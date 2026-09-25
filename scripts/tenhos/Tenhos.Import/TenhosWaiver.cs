using System;
using System.IO;
using System.Linq;
using Application.MainBoundedContext.AccountsModule.Services;
using Application.MainBoundedContext.BackOfficeModule.Services;
using Application.MainBoundedContext.DTO.AccountsModule;
using Infrastructure.Crosscutting.Framework.Utils;
using Numero3.EntityFramework.Interfaces;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Unity;
internal static class TenhosWaiver
{
    static void Check(bool ok,string name){if(!ok)throw new Exception(name);Console.WriteLine("PASS "+name);}
    public static void Run(string mode,string directory,IUnityContainer c,IDbContextScopeFactory scopes,ServiceHeader h)
    {
        Check(OwnDepositSecurityRules.Qualifies(40000m,50000m,0m),"40k below 50k qualifies");
        Check(!OwnDepositSecurityRules.Qualifies(50000m,50000m,0m),"Equality does not qualify");
        Check(!OwnDepositSecurityRules.Qualifies(40000m,50000m,10000m),"Existing commitments remove eligibility at equality");
        Check(!OwnDepositSecurityRules.Qualifies(40000m,50000m,20000m),"Insufficient uncommitted deposits rejected");
        Check(!OwnDepositSecurityRules.Qualifies(0m,50000m,0m),"Zero principal rejected");
        Check(!OwnDepositSecurityRules.Qualifies(-1m,50000m,0m),"Negative principal rejected");
        Check(!OwnDepositSecurityRules.Qualifies(1.001m,50000m,0m),"Fractional cent rejected");
        Check(!OwnDepositSecurityRules.Qualifies(1m,50000m,-1m),"Negative commitments rejected");
        var products=c.Resolve<ILoanProductAppService>();
        var before=products.FindLoanProducts(h);
        var original=before.Single(p=>p.Id==new Guid("77e09114-15b8-f111-b338-c8e2651ef92d"));
        if(mode=="waiver-enable")
        {
            var proposed=JsonConvert.DeserializeObject<LoanProductDTO>(JsonConvert.SerializeObject(original));
            proposed.WaiveGuarantorsBelowOwnDeposits=true;
            Check(!products.ValidateLoanProduct(proposed,h).Any(),"Emergency configuration valid");
            var backup=Path.Combine(directory,"before-emergency-waiver.json");
            if(!File.Exists(backup))File.WriteAllText(backup,JsonConvert.SerializeObject(original,Formatting.Indented));
            using(var scope=scopes.CreateWithTransaction(System.Data.IsolationLevel.Serializable))
            {Check(products.UpdateLoanProduct(proposed,h),"Emergency waiver saved");scope.SaveChanges(h);}
            var after=products.FindLoanProducts(h);
            foreach(var old in before)Check(JToken.DeepEquals(JObject.FromObject(old.Id==original.Id?proposed:old),JObject.FromObject(after.Single(p=>p.Id==old.Id))),"Product readback "+old.Description);
        }
        var loans=c.Resolve<ILoanCaseAppService>();
        var customer=new Guid("5f23af9a-b4b8-f111-b338-c8e2651ef92d");
        if(mode=="waiver-cleanup")
        {
            var verification=loans.FindLoanCase(new Guid("1980269c-b9b8-f111-b338-c8e2651ef92d"),h);
            Check(verification!=null && verification.CustomerId==customer && verification.LoanProductId==original.Id && verification.AmountApplied==40000m && !verification.DisbursedDate.HasValue,"Known verification fixture identified");
            if(verification.Status==(int)LoanCaseStatus.Appraised)
            {
                verification.ApprovalRemarks="Automated deposit-waiver verification only; rejected after checks. No disbursement.";
                Check(loans.ApproveLoanCase(verification,(int)LoanApprovalOption.Reject,h),"Verification case rejected through normal service");
            }
            Check(loans.FindLoanCase(verification.Id,h).Status==(int)LoanCaseStatus.Rejected,"Verification case inactive");
            Check(loans.ReleaseOwnDepositSecurity(verification.Id,h),"Verification reservation released");
        }
        var quote=loans.GetOwnDepositSecurity(customer,original.Id,40000m,h);
        Console.WriteLine(JsonConvert.SerializeObject(quote,Formatting.Indented));
        File.WriteAllText(Path.Combine(directory,"emergency-waiver-check.json"),JsonConvert.SerializeObject(quote,Formatting.Indented));
        if(mode=="waiver-test")
        {
            Guid temporaryLoanId=Guid.Empty;
            try
            {
                var source=loans.FindLoanCases(h).First(x=>x.CaseNumber==13);
                var input=JsonConvert.DeserializeObject<Application.MainBoundedContext.DTO.BackOfficeModule.LoanCaseDTO>(JsonConvert.SerializeObject(source));
                input.Id=Guid.Empty;input.CustomerId=customer;input.LoanProductId=original.Id;input.AmountApplied=40000m;input.Status=(int)LoanCaseStatus.Registered;
                input.Reference="AUTOMATED-WAIVER-VERIFICATION";input.Remarks="Synthetic service integration verification; rejected on completion, never disbursed.";input.TotalNumberOfGuarantors=0;input.TotalAmountGuaranteed=0m;input.TotalCollateralAmount=0m;input.ReceivedDate=DateTime.Today;
                var error=loans.ValidateRegistrationGuarantors(input,new System.Collections.Generic.List<Application.MainBoundedContext.DTO.BackOfficeModule.LoanGuarantorDTO>(),h);
                Check(error==null,"Server registration accepts zero guarantors below free deposits");
                var created=loans.AddNewLoanCase(input,h);temporaryLoanId=created.Id;
                Check(created.Id!=Guid.Empty && string.IsNullOrEmpty(created.ErrorMessageResult) && created.DepositSecurityAmount==40000m,"Registration persists the reservation");
                var next=loans.GetOwnDepositSecurity(customer,original.Id,15000m,h);
                Check(next.Available==10000m && !next.Waived,"Another loan cannot reuse the reserved 40k");
                var guarantee=loans.GetRegistrationGuarantorEligibility(customer,original.Id,h).Item2;
                Check(guarantee.TotalShares==10000m,"Guarantor capacity excludes reserved deposits before applying multiplier");
                var accounts=c.Resolve<ICustomerAccountAppService>().FindCustomerAccountsByCustomerId(customer,h);
                var deposit=accounts.Single(a=>a.Id==created.DepositSecurityAccountId);
                var bank=c.Resolve<IBankLinkageAppService>().FindBankLinkages(h).Single(x=>x.Id==new Guid("aba70bf3-dda2-f111-b322-c8e2651ef92d"));
                var depositProduct=c.Resolve<IInvestmentProductAppService>().FindInvestmentProduct(deposit.CustomerAccountTypeTargetProductId,h);
                bool blocked=false;
                try {c.Resolve<IJournalAppService>().AddNewJournal(null,deposit.BranchId,null,10000.01m,"ROLLBACK waiver security check","","WAIVER-ROLLBACK",0,(int)SystemTransactionCode.JournalVoucher,DateTime.Today,bank.ChartOfAccountId,depositProduct.ChartOfAccountId,new CustomerAccountDTO(),deposit,h,false);}
                catch(LoanDepositSecurityException){blocked=true;}
                Check(blocked,"Withdrawal that spends reserved deposits is rejected");
                created.AppraisedAmount=50000m;blocked=false;
                try{loans.AppraiseLoanCase(created,(int)LoanAppraisalOption.Appraise,0,h);}catch(LoanDepositSecurityException){blocked=true;}
                Check(blocked && loans.FindLoanCase(created.Id,h).Status==(int)LoanCaseStatus.Registered,"Appraisal amount increase rejected before stage transition");
                created.AppraisedAmount=40000m;
                Check(loans.AppraiseLoanCase(created,(int)LoanAppraisalOption.Appraise,0,h),"Original 40k appraisal succeeds without guarantors");
                created.ApprovedAmount=50000m;blocked=false;
                try{loans.ApproveLoanCase(created,(int)LoanApprovalOption.Approve,h);}catch(LoanDepositSecurityException){blocked=true;}
                Check(blocked && loans.FindLoanCase(created.Id,h).Status==(int)LoanCaseStatus.Appraised,"Approval amount increase rejected before transition");

            }
            finally
            {
                if(temporaryLoanId!=Guid.Empty)
                {
                    var temporary=loans.FindLoanCase(temporaryLoanId,h);
                    temporary.ApprovalRemarks="Automated verification complete; no disbursement.";
                    if(temporary.Status==(int)LoanCaseStatus.Registered)loans.AppraiseLoanCase(temporary,(int)LoanAppraisalOption.Reject,0,h);
                    else if(temporary.Status==(int)LoanCaseStatus.Appraised)loans.ApproveLoanCase(temporary,(int)LoanApprovalOption.Reject,h);
                    Check(loans.FindLoanCase(temporaryLoanId,h).Status==(int)LoanCaseStatus.Rejected,"Verification loan rejected after checks");
                    loans.ReleaseOwnDepositSecurity(temporaryLoanId,h);
                }
            }
            var restored=loans.GetOwnDepositSecurity(customer,original.Id,40000m,h);
            Check(restored.Available==50000m && restored.Waived,"Original deposit availability restored after verification cleanup");
        }

    }
}
