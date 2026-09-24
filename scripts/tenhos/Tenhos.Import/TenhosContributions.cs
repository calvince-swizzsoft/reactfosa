using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using Application.MainBoundedContext.AccountsModule.Services;
using Application.MainBoundedContext.RegistryModule.Services;
using Application.MainBoundedContext.BackOfficeModule.Services;
using Application.MainBoundedContext.DTO.AccountsModule;
using Infrastructure.Crosscutting.Framework.Utils;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Numero3.EntityFramework.Interfaces;
using Unity;

internal static class TenhosContributions
{
    const string Marker="TENHOS-LOCAL-BOSA-20260924";
    public static void Run(string directory,IUnityContainer container,IDbContextScopeFactory scopes,ServiceHeader header, bool additional = false)
    {
        var marker=additional ? "TENHOS-LOCAL-BOSA-EXTRA-20260924" : Marker;
        var count=additional ? 1 : 4;
        var suffix=additional ? "-extra" : "";
        var excluded=additional
            ? JObject.Parse(File.ReadAllText(Path.Combine(directory,"before-test-bosa-contributions.json")))["accounts"].Select(a=>(Guid)a["CustomerId"]).ToList()
            : new List<Guid>();
        header.ApplicationUserName="TENHOS-LOCAL-TEST";
        var accountsService=container.Resolve<ICustomerAccountAppService>();
        var customerService=container.Resolve<ICustomerAppService>();
        var journals=container.Resolve<IJournalAppService>();
        var product=container.Resolve<IInvestmentProductAppService>().FindInvestmentProduct(new Guid("301de436-4aab-f111-b324-c8e2651ef92d"),header);
        var bank=container.Resolve<IBankLinkageAppService>().FindBankLinkages(header).Single(x=>!x.IsLocked);
        var ledger=container.Resolve<IChartOfAccountAppService>().FindChartOfAccounts(header);
        var bankLedger=ledger.Single(x=>x.Id==bank.ChartOfAccountId);
        var depositLedger=ledger.Single(x=>x.Id==product.ChartOfAccountId);
        if(product.IsLocked || depositLedger.AccountCode!=2009 || depositLedger.IsLocked || bankLedger.IsLocked ||
           bankLedger.AccountType!=(int)ChartOfAccountType.Asset || depositLedger.AccountType!=(int)ChartOfAccountType.Liability)
            throw new InvalidOperationException("Unexpected product/bank ledger setup.");
        var period=container.Resolve<IPostingPeriodAppService>().FindCurrentPostingPeriod(header);
        if(period==null || period.IsClosed || period.IsLocked || !period.IsActive || DateTime.Today<period.DurationStartDate.Date || DateTime.Today>period.DurationEndDate.Date)
            throw new InvalidOperationException("No valid current posting period.");
        var entries=new List<object>();
        var ids=new List<Guid>();
        var balances=new Dictionary<Guid,decimal>();
        List<CustomerAccountDTO> selected;
        using(var scope=scopes.CreateWithTransaction(IsolationLevel.Serializable))
        {
            var existing=journals.FindJournals(0,100,new DateTime(2000,1,1),new DateTime(2100,1,1),marker,(int)JournalFilter.Reference,header).PageCollection;
            if(existing.Any())throw new InvalidOperationException("This test contribution marker already exists. Refusing to post duplicates.");
            selected=accountsService.FindCustomerAccountsByCustomerAccountTypeTargetProductId(product.Id,0,100,header).PageCollection
                .Where(a=>!excluded.Contains(a.CustomerId) && a.BranchId==bank.BranchId && a.Status==(int)CustomerAccountStatus.Normal && a.RecordStatus==(int)RecordStatus.Approved)
                .OrderBy(a=>a.CustomerSerialNumber)
                .Where(a=>GuarantorRegistrationRules.ValidateCustomer(customerService.FindCustomer(a.CustomerId,header))==null)
                .GroupBy(a=>a.CustomerId).Select(g=>g.First()).Take(count).ToList();
            if(selected.Count!=count)throw new InvalidOperationException("Four eligible distinct members were not found.");
            accountsService.FetchCustomerAccountBalances(selected,header);
            foreach(var a in selected)balances[a.Id]=a.BookBalance;
            var beforePath=Path.Combine(directory,"before-test-bosa-contributions"+suffix+".json");
            if(File.Exists(beforePath))throw new InvalidOperationException("A prior posting attempt exists; review before retry.");
            File.WriteAllText(beforePath,JsonConvert.SerializeObject(new {environment="Local development",bank=bankLedger.AccountName,valueDate=DateTime.Today,
                accounts=selected.Select(a=>new {a.Id,a.CustomerId,a.CustomerFullName,a.FullAccountNumber,a.BookBalance,contribution=50000m})},Formatting.Indented));
            foreach(var a in selected)
            {
                var reference=marker+"-"+a.CustomerSerialNumber;
                var j=journals.AddNewJournal(null,a.BranchId,null,50000m,"LOCAL TEST - BOSA contribution via bank receipt",
                    bankLedger.AccountName,reference,0,(int)SystemTransactionCode.JournalVoucher,DateTime.Today,
                    depositLedger.Id,bankLedger.Id,a,new CustomerAccountDTO(),header,false);
                if(j==null || j.Id==Guid.Empty)throw new InvalidOperationException("Journal creation failed.");
                ids.Add(j.Id);
                entries.Add(new {customer=a.CustomerFullName,account=a.FullAccountNumber,amount=50000m,reference,journalId=j.Id,beforeBalance=balances[a.Id]});
            }
            scope.SaveChanges(header);
        }
        var posted=journals.FindJournalEntries(header,ids.ToArray());
        foreach(var id in ids)
        {
            var legs=posted.Where(e=>e.JournalId==id).ToList();
            if(legs.Count!=2 || legs.Sum(e=>e.Amount)!=0 ||
               legs.Count(e=>e.ChartOfAccountId==bankLedger.Id && e.Amount==50000m && !e.CustomerAccountId.HasValue)!=1 ||
               legs.Count(e=>e.ChartOfAccountId==depositLedger.Id && e.Amount==-50000m && selected.Any(a=>a.Id==e.CustomerAccountId))!=1)
                throw new InvalidOperationException("Committed journal verification failed; do not repost.");
        }
        accountsService.FetchCustomerAccountBalances(selected,header);
        foreach(var a in selected)if(a.BookBalance!=balances[a.Id]+50000m)throw new InvalidOperationException("Committed balance verification failed; do not repost.");
        var result=new {verified=true,environment="Local development",bank=bankLedger.AccountName,total=50000m*count,postings=entries,
            balances=selected.Select(a=>new {a.CustomerFullName,a.FullAccountNumber,before=balances[a.Id],after=a.BookBalance})};
        File.WriteAllText(Path.Combine(directory,"test-bosa-contributions"+suffix+"-result.json"),JsonConvert.SerializeObject(result,Formatting.Indented));
        Console.WriteLine(JsonConvert.SerializeObject(result,Formatting.Indented));
        if(additional)
        {
            var boresha=container.Resolve<ILoanProductAppService>().FindLoanProducts(header).Single(p=>p.Description.Contains("Boresha Elimu"));
            foreach(var a in selected)
            {
                var eligibility=container.Resolve<ILoanCaseAppService>().GetRegistrationGuarantorEligibility(a.CustomerId,boresha.Id,header).Item2;
                Console.WriteLine("Guarantor lookup: "+a.CustomerFullName+"; eligible balance="+eligibility.TotalShares+"; committed="+eligibility.CommittedShares+
                    "; factor="+eligibility.AppraisalFactor+"; available="+Math.Max(0m,eligibility.TotalShares*Convert.ToDecimal(eligibility.AppraisalFactor)-eligibility.CommittedShares));
            }
        }
    }
}