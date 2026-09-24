using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using Application.MainBoundedContext.AccountsModule.Services;
using Application.MainBoundedContext.DTO;
using Application.MainBoundedContext.DTO.AccountsModule;
using Infrastructure.Crosscutting.Framework.Utils;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Numero3.EntityFramework.Interfaces;

internal static class TenhosBosa
{
    static readonly string[] Keys={"boresha-elimu","emergency-loan","asset-financing-loan","development-loan"};
    static void Save(string path,object value){File.WriteAllText(path,JsonConvert.SerializeObject(value,Formatting.Indented));}
    static void Check(bool condition,string message){if(!condition)throw new InvalidOperationException(message);}
    static JToken Normalize(ProductCollectionInfo data)
    {
        if(data==null)data=new ProductCollectionInfo();
        return JToken.FromObject(new {
            investments=(data.InvestmentProductCollection??new List<InvestmentProductDTO>()).Select(p=>p.Id).OrderBy(id=>id),
            recovery=(data.LoanProductCollection??new List<LoanProductDTO>()).Select(p=>p.Id).OrderBy(id=>id),
            loans=(data.EligibileIncomeDeductionLoanProductCollection??new List<LoanProductDTO>()).Select(p=>p.Id).OrderBy(id=>id),
            deductions=(data.EligibileIncomeDeductionInvestmentProductCollection??new List<InvestmentProductDTO>()).Select(p=>p.Id).OrderBy(id=>id),
            savings=(data.EligibileIncomeDeductionSavingsProductCollection??new List<SavingsProductDTO>()).Select(p=>p.Id).OrderBy(id=>id)
        });
    }
    public static void Run(string mode,string directory,JArray research,ILoanProductAppService loans,IInvestmentProductAppService investments,IChartOfAccountAppService ledger,IDbContextScopeFactory scopes,ServiceHeader header)
    {
        var deposit=investments.FindInvestmentProducts(header).Single(p=>p.Description=="DEPOSIT CONTRIBUTION");
        var gl=ledger.FindChartOfAccount(deposit.ChartOfAccountId,header);
        Check(!deposit.IsLocked && gl.AccountName=="BOSA DEPOSITS" && gl.AccountCode==2009 && gl.AccountType==(int)ChartOfAccountType.Liability,"Unexpected BOSA investment/ledger mapping.");
        var before=loans.FindLoanProducts(header);
        var targets=research.Where(p=>Keys.Contains((string)p["key"])).Select(p=>before.Single(l=>l.Description=="TENHOS - "+(string)p["name"]+" [DRAFT]")).ToList();
        Check(targets.Count==4 && targets.All(p=>p.IsLocked && p.LoanRegistrationLoanProductSection==(int)LoanProductSection.BOSA && p.LoanRegistrationInvestmentsMultiplier==4d),"Unexpected target product settings.");
        if(mode=="bosa-apply")
        {
            var previous=before.ToDictionary(p=>p.Id,p=>Normalize(loans.FindAppraisalProducts(p.Id,header)));
            var backup=Path.Combine(directory,"before-bosa-mapping.json");
            if(!File.Exists(backup))Save(backup,new {products=before,appraisalProducts=previous});
            int changed=0;
            using(var scope=scopes.CreateWithTransaction(IsolationLevel.Serializable))
            {
                foreach(var product in targets)
                {
                    var mapping=loans.FindAppraisalProducts(product.Id,header)??new ProductCollectionInfo();
                    var current=mapping.InvestmentProductCollection??new List<InvestmentProductDTO>();
                    Check(!current.Any(p=>p.Id!=deposit.Id),"Refusing to overwrite a different investment selection.");
                    if(current.Count==1)continue;
                    mapping.InvestmentProductCollection=new List<InvestmentProductDTO>{deposit};
                    Check(loans.UpdateAppraisalProducts(product.Id,mapping,header),"Failed to save appraisal mapping.");
                    changed++;
                }
                scope.SaveChanges(header);
            }
            var after=loans.FindLoanProducts(header);
            Check(JToken.DeepEquals(JToken.FromObject(before),JToken.FromObject(after)),"Loan product settings changed.");
            foreach(var p in before)
            {
                var expected=(JObject)previous[p.Id].DeepClone();
                if(targets.Any(t=>t.Id==p.Id))expected["investments"]=new JArray(deposit.Id);
                Check(JToken.DeepEquals(expected,Normalize(loans.FindAppraisalProducts(p.Id,header))),"Unexpected appraisal mapping change.");
            }
            Save(Path.Combine(directory,"bosa-mapping-result.json"),new {verified=true,changedCount=changed,investmentProductId=deposit.Id,investmentProduct=deposit.Description,ledgerId=gl.Id,ledger=gl.AccountName,ledgerCode=gl.AccountCode,products=targets.Select(p=>new{p.Id,p.Description,selectedInvestmentProducts=loans.FindAppraisalProducts(p.Id,header).InvestmentProductCollection.Select(i=>i.Id)})});
            Console.WriteLine("Mapped and verified "+changed+" BOSA loan products. Other appraisal selections and all loan settings unchanged.");
        }
        var checks=0;
        foreach(var p in targets)
        {
            var share=investments.FindInvestmentProducts(header).Single(i=>i.Description=="Mandatory Share Capital");
            var accounts=new List<CustomerAccountDTO>{
                new CustomerAccountDTO{CustomerAccountTypeProductCode=(int)ProductCode.Investment,CustomerAccountTypeTargetProductId=deposit.Id,BookBalance=100000m},
                new CustomerAccountDTO{CustomerAccountTypeProductCode=(int)ProductCode.Investment,CustomerAccountTypeTargetProductId=share.Id,BookBalance=20000m},
                new CustomerAccountDTO{CustomerAccountTypeProductCode=(int)ProductCode.Savings,CustomerAccountTypeTargetProductId=Guid.NewGuid(),BookBalance=30000m}
            };
            Func<List<CustomerAccountDTO>,decimal,bool,bool,decimal,LoanQualificationDTO> calculate=(a,outstanding,savings,exclude,cap)=>loans.CalculateLoanQualificationFromAccounts(p.Id,a,outstanding,savings,exclude,cap,header);
            var q=calculate(accounts,0m,false,false,p.LoanRegistrationMaximumAmount);
            Check(q.InvestmentsBalance==100000m && q.SavingsBalance==0m && q.MaximumEntitled==400000m,"Mixed-balance case failed.");checks++;
            q=calculate(accounts,0m,true,false,p.LoanRegistrationMaximumAmount);
            Check(!q.SavingsIncluded && q.MaximumEntitled==400000m,"BOSA must exclude savings even when legacy flag is true.");checks++;
            q=calculate(accounts,50000m,false,false,p.LoanRegistrationMaximumAmount);
            Check(q.MaximumEntitled==350000m,"Outstanding-loan deduction failed.");checks++;
            q=calculate(accounts,50000m,false,true,p.LoanRegistrationMaximumAmount);
            Check(q.MaximumEntitled==400000m,"Outstanding-loan exclusion flag changed.");checks++;
            Check(calculate(accounts,0m,false,false,250000m).MaximumEntitled==250000m,"Product cap failed.");checks++;
            Check(calculate(accounts.Skip(1).ToList(),0m,false,false,p.LoanRegistrationMaximumAmount).MaximumEntitled==0m,"Unmapped balances must not qualify.");checks++;
            accounts.Add(new CustomerAccountDTO{CustomerAccountTypeProductCode=(int)ProductCode.Investment,CustomerAccountTypeTargetProductId=deposit.Id,BookBalance=10000m});
            Check(calculate(accounts,0m,false,false,p.LoanRegistrationMaximumAmount).MaximumEntitled==440000m,"Multiple selected deposit accounts must aggregate.");checks++;
            Check(calculate(null,0m,false,false,p.LoanRegistrationMaximumAmount).MaximumEntitled==0m,"Missing customer accounts must give zero entitlement.");checks++;
            // A savings account cannot qualify merely by carrying the selected investment ID.
            var wrongType=new List<CustomerAccountDTO>{new CustomerAccountDTO{CustomerAccountTypeProductCode=(int)ProductCode.Savings,CustomerAccountTypeTargetProductId=deposit.Id,BookBalance=100000m}};
            Check(calculate(wrongType,0m,false,false,p.LoanRegistrationMaximumAmount).MaximumEntitled==0m,"Product type must match investment.");checks++;
        }
        var unmapped=before.FirstOrDefault(p=>p.LoanRegistrationInvestmentsMultiplier>0 && !(loans.FindAppraisalProducts(p.Id,header)?.InvestmentProductCollection?.Any()??false));
        Check(unmapped!=null,"Missing-mapping regression fixture not available.");
        bool blocked=false;
        try{loans.CalculateLoanQualificationFromAccounts(unmapped.Id,new List<CustomerAccountDTO>(),0,false,false,unmapped.LoanRegistrationMaximumAmount,header);}
        catch(LoanAppraisalConfigurationException){blocked=true;}
        Check(blocked,"Missing required mapping must block qualification.");checks++;
        Save(Path.Combine(directory,"bosa-verification.json"),new {passed=checks,scope="Real AppService and local product mappings with synthetic balances; read-only tests, no member balances or journals written",example=new {bosaDeposits=100000,shareCapital=20000,ordinarySavings=30000,multiplier=4,entitlement=400000}});
        Console.WriteLine("PASS "+checks+" qualification checks through the real AppService; no financial transactions posted.");
    }
}
