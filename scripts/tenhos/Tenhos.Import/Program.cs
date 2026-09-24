using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Unity;
using Application.MainBoundedContext.AccountsModule.Services;
using Application.MainBoundedContext.DTO.AccountsModule;
using Infrastructure.Crosscutting.Framework.Utils;
using Infrastructure.Data.MainBoundedContext.UnitOfWork;
using Numero3.EntityFramework.Interfaces;

public class Program
{
    public class NoMigrations : DbConfiguration
    {
        public NoMigrations(){SetProviderServices("System.Data.SqlClient",System.Data.Entity.SqlServer.SqlProviderServices.Instance);SetDatabaseInitializer<BoundedContextUnitOfWork>(new NullDatabaseInitializer<BoundedContextUnitOfWork>());}
    }
    class Factory : IDbContextFactory
    {
        readonly string connection;
        public Factory(string connection){this.connection=connection;}
        public TDbContext CreateDbContext<TDbContext>(ServiceHeader h) where TDbContext:DbContext{return new BoundedContextUnitOfWork(connection) as TDbContext;}
    }
    static int First<T>(){return Convert.ToInt32(Enum.GetValues(typeof(T)).GetValue(0));}
    static void Save(string path,object value){File.WriteAllText(path,JsonConvert.SerializeObject(value,Formatting.Indented));}
    static void Main(string[] args)
    {
        if(args.Length!=4||!new[]{"plan","apply","accounts-inventory","accounts-plan","accounts-apply","maximums-plan","maximums-apply","rates-plan","rates-apply","bosa-inventory","bosa-apply","bosa-test","income-apply","income-test","boresha-unlock","contributions-plan","contributions-apply","contributions-extra","appraisal-audit","income-signature-audit","insider-inventory","insider-create"}.Contains(args[0]))throw new ArgumentException("plan|apply Web.config research.json output-directory");
        var config=XDocument.Load(args[1]);
        var domain=(string)config.Root.Element("appSettings").Elements("add").Single(x=>(string)x.Attribute("key")=="ApplicationDomainName").Attribute("value");
        var connection=(string)config.Root.Element("connectionStrings").Elements("add").Single(x=>(string)x.Attribute("name")==domain).Attribute("connectionString");
        var target=new SqlConnectionStringBuilder(connection);
        if(domain!="SwiftFin_Dev"||target.DataSource!="(local)"||target.InitialCatalog!="SwiftFinancialsDB_Live")throw new InvalidOperationException("Target differs from the inspected local development connection. No writes performed.");
        var research=JObject.Parse(File.ReadAllText(args[2]));
        var products=(JArray)research["products"];
        if(products.Count!=14)throw new InvalidOperationException("Expected 14 researched products.");
        Directory.CreateDirectory(args[3]);
        DbConfiguration.SetConfiguration(new NoMigrations());
        Database.SetInitializer<BoundedContextUnitOfWork>(null);
        var container=WebApplication1.UnityConfig.Current;
        container.RegisterInstance<IDbContextFactory>(new Factory(connection));
        var service=container.Resolve<ILoanProductAppService>();
        var scopes=container.Resolve<IDbContextScopeFactory>();
        var header=new ServiceHeader{ApplicationDomainName=domain,ApplicationUserName="TENHOS-DRAFT-20260924"};
        var before=service.FindLoanProducts(header)??new List<LoanProductDTO>();
        if(args[0].StartsWith("insider-")){TenhosInsider.Run(args[0],args[3],container,scopes,header);return;}
        if(args[0]=="income-signature-audit")
        {
            var cases=container.Resolve<Application.MainBoundedContext.BackOfficeModule.Services.ILoanCaseAppService>().FindLoanCases(header);
            foreach(var c in cases.Where(c=>c.RequireIncomeAssessment==true))
            {
                var rules=typeof(Application.MainBoundedContext.BackOfficeModule.Services.LoanIncomeAssessmentRules);
                var expected=Application.MainBoundedContext.BackOfficeModule.Services.LoanIncomeAssessmentRules.Signature(c,c.AppraisedAmount,c.LoanProductLatestIncome,c.AppraisedNetIncome,c.IncomeAssessmentReference);
                Console.WriteLine(JsonConvert.SerializeObject(new{c.CaseNumber,c.Status,c.AppraisedAmount,c.ApprovedAmount,
                    hasSignature=!string.IsNullOrEmpty(c.IncomeAssessmentSignature),matchesPersisted=expected==c.IncomeAssessmentSignature,accepted=Application.MainBoundedContext.BackOfficeModule.Services.LoanIncomeAssessmentRules.MatchesSignature(c,c.AppraisedAmount,c.LoanProductLatestIncome,c.AppraisedNetIncome,c.IncomeAssessmentReference,c.IncomeAssessmentSignature)}));
                for(int pScale=0;pScale<=2;pScale++)for(int gScale=0;gScale<=2;gScale++)for(int nScale=0;nScale<=2;nScale++)
                {
                    var pValue=decimal.Parse(c.AppraisedAmount.ToString("F"+pScale,System.Globalization.CultureInfo.InvariantCulture),System.Globalization.CultureInfo.InvariantCulture);
                    var gValue=decimal.Parse(c.LoanProductLatestIncome.ToString("F"+gScale,System.Globalization.CultureInfo.InvariantCulture),System.Globalization.CultureInfo.InvariantCulture);
                    var nValue=decimal.Parse(c.AppraisedNetIncome.ToString("F"+nScale,System.Globalization.CultureInfo.InvariantCulture),System.Globalization.CultureInfo.InvariantCulture);
                    if(pValue!=c.AppraisedAmount || gValue!=c.LoanProductLatestIncome || nValue!=c.AppraisedNetIncome)continue;
                    if(Application.MainBoundedContext.BackOfficeModule.Services.LoanIncomeAssessmentRules.Signature(c,pValue,gValue,nValue,c.IncomeAssessmentReference)==c.IncomeAssessmentSignature)
                        Console.WriteLine("Same numeric values match saved signature with decimal scales: "+pScale+","+gScale+","+nScale);
                }
            }
            return;
        }
        if(args[0]=="appraisal-audit")
        {
            foreach(var p in before)
            {
                var mappings=service.FindAppraisalProducts(p.Id,header);
                Console.WriteLine(JsonConvert.SerializeObject(new {p.Id,p.Description,p.IsLocked,p.LoanRegistrationLoanProductSection,p.LoanRegistrationInvestmentsMultiplier,
                    investments=(mappings?.InvestmentProductCollection??new List<InvestmentProductDTO>()).Select(x=>new{x.Id,x.Description,x.IsLocked})}));
                try { service.CalculateLoanQualificationFromAccounts(p.Id,new CustomerAccountDTO[0],0,false,false,p.LoanRegistrationMaximumAmount,header); }
                catch(Exception e) { Console.WriteLine("Qualification failure for "+p.Description+": "+e.GetType().FullName+"; "+e.Message); }
            }
            var cases=container.Resolve<Application.MainBoundedContext.BackOfficeModule.Services.ILoanCaseAppService>().FindLoanCases(header);
            foreach(var c in cases) Console.WriteLine(JsonConvert.SerializeObject(new{c.Id,c.CaseNumber,c.LoanProductId,c.Status,c.AmountApplied}));
            return;
        }
        if(args[0]=="contributions-extra"){TenhosContributions.Run(args[3],container,scopes,header,true);return;}
        if(args[0]=="contributions-apply"){TenhosContributions.Run(args[3],container,scopes,header);return;}
        if(args[0]=="contributions-plan")
        {
            var accounts=container.Resolve<ICustomerAccountAppService>().FindCustomerAccountsByCustomerAccountTypeTargetProductId(new Guid("301de436-4aab-f111-b324-c8e2651ef92d"),0,100,header).PageCollection;
            Save(Path.Combine(args[3],"contributions-plan.json"),new {
                accounts=accounts.Select(a=>new {a.Id,a.CustomerId,a.CustomerFullName,a.CustomerSerialNumber,a.FullAccountNumber,a.BranchId,a.Status,a.RecordStatus,a.BookBalance}),
                ledgers=container.Resolve<IChartOfAccountAppService>().FindChartOfAccounts(header).Where(a=>!a.AccountName.StartsWith("TENHOS -")).Select(a=>new {a.Id,a.AccountCode,a.AccountName,a.AccountType,a.AccountCategory,a.IsLocked,a.IsControlAccount}),
                banks=container.Resolve<IBankLinkageAppService>().FindBankLinkages(header)
            });
            Console.WriteLine("Contribution account and bank inventory saved; no writes.");
            return;
        }
        if(args[0]=="boresha-unlock")
        {
            var original=before.Single(p=>p.Description=="TENHOS - Boresha Elimu (School Fees Loan) [DRAFT]");
            var others=before.Where(p=>p.Description.StartsWith("TENHOS - ") && p.Id!=original.Id).ToList();
            if(others.Count!=13 || others.Any(p=>!p.IsLocked))throw new InvalidOperationException("Expected the other 13 Tenhos products to be locked.");
            var proposed=JsonConvert.DeserializeObject<LoanProductDTO>(JsonConvert.SerializeObject(original));
            proposed.IsLocked=false;
            var errors=service.ValidateLoanProduct(proposed,header);
            if(errors.Any())throw new InvalidOperationException(string.Join("; ",errors.SelectMany(e=>e.Value)));
            var backup=Path.Combine(args[3],"before-boresha-unlock.json");
            if(!File.Exists(backup))Save(backup,before);
            if(original.IsLocked)
            {
                using(var scope=scopes.CreateWithTransaction(IsolationLevel.Serializable))
                {
                    if(!service.UpdateLoanProduct(proposed,header))throw new InvalidOperationException("Boresha unlock failed.");
                    scope.SaveChanges(header);
                }
            }
            var unlockedProducts=service.FindLoanProducts(header);
            if(before.Count!=unlockedProducts.Count)throw new InvalidOperationException("Product count changed.");
            foreach(var old in before)
            {
                var expected=old.Id==original.Id?proposed:old;
                if(!JToken.DeepEquals(JObject.FromObject(expected),JObject.FromObject(unlockedProducts.Single(p=>p.Id==old.Id))))
                    throw new InvalidOperationException("Unexpected configuration change: "+old.Description);
            }
            Save(Path.Combine(args[3],"boresha-unlock-result.json"),new{verified=true,environment="Local development",product=unlockedProducts.Single(p=>p.Id==original.Id),otherTenhosProductsLocked=13});
            Console.WriteLine("Boresha Elimu unlocked in local development. Verified the other 13 Tenhos products remain locked; all other product settings unchanged.");
            return;
        }
        if(args[0]=="income-apply" || args[0]=="income-test")
        {
            TenhosIncome.Run(args[0],args[3],service,scopes,header);
            return;
        }
        if(args[0]=="bosa-apply" || args[0]=="bosa-test")
        {
            TenhosBosa.Run(args[0],args[3],products,service,container.Resolve<IInvestmentProductAppService>(),container.Resolve<IChartOfAccountAppService>(),scopes,header);
            return;
        }
        if(args[0]=="bosa-inventory")
        {
            Save(Path.Combine(args[3],"bosa-inventory.json"),container.Resolve<IInvestmentProductAppService>().FindInvestmentProducts(header));
            Console.WriteLine("Investment product inventory saved; no database writes.");
            return;
        }
        if(args[0].StartsWith("rates-"))
        {
            TenhosRates.Run(args[0],args[3],products,service,scopes,header);
            return;
        }
        if(args[0].StartsWith("maximums-"))
        {
            TenhosMaximums.Run(args[0],args[3],products,service,scopes,header);
            return;
        }
        if(args[0].StartsWith("accounts-"))
        {
            var accounts=container.Resolve<IChartOfAccountAppService>();
            TenhosAccounts.Run(args[0],args[3],products,service,accounts,scopes,header);
            return;
        }
        var template=before.Single(x=>x.Description=="SALARY ADVANCE");
        var planned=new List<LoanProductDTO>();
        foreach(JObject item in products)
        {
            var published=item["published"];
            var key=(string)item["key"];
            var bosa=new[]{"boresha-elimu","emergency-loan","asset-financing-loan","development-loan"}.Contains(key);
            var count=(int?)published["guarantorCount"]??0;
            // Non-nullable schema requires technical placeholders. These are not approved terms.
            // Every record stays locked and its visible name explicitly says DRAFT.
            var dto=new LoanProductDTO{
                Description="TENHOS - "+(string)item["name"]+" [DRAFT]",IsLocked=true,
                ChartOfAccountId=template.ChartOfAccountId,InterestReceivedChartOfAccountId=template.InterestReceivedChartOfAccountId,
                InterestReceivableChartOfAccountId=template.InterestReceivableChartOfAccountId,InterestChargedChartOfAccountId=template.InterestChargedChartOfAccountId,
                LoanInterestAnnualPercentageRate=0,LoanInterestChargeMode=(int)InterestChargeMode.Periodic,
                LoanInterestRecoveryMode=(int)InterestRecoveryMode.Periodic,LoanInterestCalculationMode=(int)InterestCalculationMode.ReducingBalance,
                LoanRegistrationTermInMonths=(int?)published["termMonths"]??1,
                LoanRegistrationMinimumAmount=0,LoanRegistrationMaximumAmount=1,
                LoanRegistrationLoanProductSection=bosa?(int)LoanProductSection.BOSA:(int)LoanProductSection.FOSA,
                LoanRegistrationLoanProductCategory=((int?)published["termMonths"]??1)>12?(int)LoanProductCategory.LongTerm:(int)LoanProductCategory.ShortTerm,
                LoanRegistrationInvestmentsMultiplier=(double?)published["depositMultiplier"]??0,
                LoanRegistrationMinimumGuarantors=count,LoanRegistrationMaximumGuarantees=Math.Max(1,count),
                LoanRegistrationSecurityRequired=count>0,LoanRegistrationGuarantorSecurityMode=bosa?(int)GuarantorSecurityMode.Investments:(int)GuarantorSecurityMode.Income,
                LoanRegistrationConsecutiveIncome=new[]{"advances","special-advance","overdraft-facility","loan-item-facility"}.Contains(key)?3:0,
                LoanRegistrationMinimumMembershipPeriod=key=="development-loan"?3:0,
                LoanRegistrationPaymentFrequencyPerYear=(int)PaymentFrequencyPerYear.Monthly,
                LoanRegistrationPaymentDueDate=First<PaymentDueDate>(),LoanRegistrationPayoutRecoveryMode=First<PayoutRecoveryMode>(),
                LoanRegistrationAggregateCheckOffRecoveryMode=First<AggregateCheckOffRecoveryMode>(),LoanRegistrationStandingOrderTrigger=First<StandingOrderTrigger>(),
                LoanRegistrationRoundingType=First<RoundingType>(),TakeHomeType=(int)ChargeType.FixedAmount,
                LoanRegistrationBypassAudit=false,LoanRegistrationEnforceSystemAppraisalRecommendation=true
            };
            var errors=service.ValidateLoanProduct(dto,header);
            if(errors.Any())throw new InvalidOperationException(dto.Description+": "+string.Join("; ",errors.SelectMany(x=>x.Value)));
            planned.Add(dto);
        }
        Save(Path.Combine(args[3],"import-plan.json"),new{target=new{domain,server=target.DataSource,database=target.InitialCatalog},mode=args[0],placeholders="Locked drafts only: rate 0 is UNKNOWN, principal cap 1 is a non-operational sentinel, minimum 0, unknown term 1, unknown minimum guarantor count 0, maximum 1 (schema placeholder). Section/category/security mode, periodic reducing interest, monthly schedule and enum defaults are provisional. Existing shared accounting IDs are reused provisionally. No charges or appraisal-product links are added. Never unlock without completing the research checklist.",products=planned});
        if(args[0]=="plan"){Console.WriteLine("Validated 14 locked drafts. Existing matching drafts: "+planned.Count(x=>before.Any(y=>y.Description==x.Description))+". No database writes.");return;}
        var backupPath=Path.Combine(args[3],"before-products.json");
        if(!File.Exists(backupPath))Save(backupPath,before);
        var createdIds=new List<Guid>();
        using(var transaction=scopes.CreateWithTransaction(IsolationLevel.Serializable))
        {
            var current=service.FindLoanProducts(header)??new List<LoanProductDTO>();
            foreach(var dto in planned)
            {
                var matches=current.Where(x=>x.Description==dto.Description).ToList();
                if(matches.Count>1)throw new InvalidOperationException("Duplicate draft names found.");
                if(matches.Count==1){if(!matches[0].IsLocked)throw new InvalidOperationException("Existing matching product is active; refusing to overwrite.");continue;}
                var created=service.AddNewLoanProductConfiguration(new LoanProductConfigurationDTO{LoanProduct=dto},header);
                if(created==null||!created.IsLocked)throw new InvalidOperationException("Draft creation failed or returned unlocked product.");
                createdIds.Add(created.Id);current.Add(created);
            }
            transaction.SaveChanges(header);
        }
        var after=service.FindLoanProducts(header);
        var drafts=after.Where(x=>planned.Any(y=>x.Description==y.Description)).ToList();
        if(drafts.Count!=14||drafts.Any(x=>!x.IsLocked))throw new InvalidOperationException("Read-back verification failed.");
        foreach(var original in before)
        {
            var persisted=after.Single(x=>x.Id==original.Id);
            if(JsonConvert.SerializeObject(original)!=JsonConvert.SerializeObject(persisted))throw new InvalidOperationException("Pre-existing product changed.");
        }
        Save(Path.Combine(args[3],"import-result.json"),new{createdCount=createdIds.Count,createdIds,drafts});
        Console.WriteLine("Created "+createdIds.Count+" locked drafts; verified all 14 are locked. All "+before.Count+" pre-existing products unchanged.");
    }
}
