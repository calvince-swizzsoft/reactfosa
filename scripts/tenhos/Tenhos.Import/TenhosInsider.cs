using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using Application.MainBoundedContext.AccountsModule.Services;
using Application.MainBoundedContext.RegistryModule.Services;
using Application.MainBoundedContext.AdministrationModule.Services;
using Application.MainBoundedContext.DTO.AccountsModule;
using Application.MainBoundedContext.DTO.RegistryModule;
using Infrastructure.Crosscutting.Framework.Utils;
using Newtonsoft.Json;
using Numero3.EntityFramework.Interfaces;
using Unity;

internal static class TenhosInsider
{
    const string Identity="TEST-INS-0926";
    const string Member="TEST-INS-SEP26";
    const string Marker="TENHOS-LOCAL-INSIDER-SEP26-DEPOSIT";
    public static void Run(string mode,string directory,IUnityContainer c,IDbContextScopeFactory scopes,ServiceHeader h)
    {
        h.ApplicationUserName="TENHOS-LOCAL-TEST";
        var grants=c.Resolve<INavigationItemInRoleAppService>().GetRolesForNavigationItemCode(26016,h);
        if(grants==null || grants.Length==0)throw new InvalidOperationException("SASRA roles are not configured.");
        h.ApplicationUserRoles=grants.ToList();
        var customers=c.Resolve<ICustomerAppService>();
        var accounts=c.Resolve<ICustomerAccountAppService>();
        var investments=c.Resolve<IInvestmentProductAppService>().FindInvestmentProducts(h);
        var deposit=investments.Single(x=>x.Id==new Guid("301de436-4aab-f111-b324-c8e2651ef92d"));
        var savings=c.Resolve<ISavingsProductAppService>().FindDefaultSavingsProduct(h);
        var loan=c.Resolve<ILoanProductAppService>().FindLoanProducts(h).Single(x=>x.Id==new Guid("75e09114-15b8-f111-b338-c8e2651ef92d"));
        var divisions=c.Resolve<IDivisionAppService>().FindDivisionsAsync(h).GetAwaiter().GetResult();
        var bank=c.Resolve<IBankLinkageAppService>().FindBankLinkages(h).Single(x=>x.Id==new Guid("aba70bf3-dda2-f111-b322-c8e2651ef92d"));
        var matches=customers.FindCustomersByIdentityCardNumberAsync(Identity,true,h).GetAwaiter().GetResult();
        if(mode=="insider-inventory")
        {
            Console.WriteLine(JsonConvert.SerializeObject(new{divisions=divisions.Select(x=>new{x.Id,x.Description}), investments=investments.Select(x=>new{x.Id,x.Description,x.IsLocked}),savings=savings.Description,loan=loan.Description,existing=matches.Select(x=>new{x.Id,x.SerialNumber,x.Reference2})},Formatting.Indented));
            return;
        }
        var division=divisions.Single(x=>x.Id==new Guid("28eb9ba2-a7a2-f111-b321-c8e2651ef92d"));
        if(deposit.IsLocked || savings.IsLocked || loan.IsLocked || bank.IsLocked)throw new InvalidOperationException("A required product or bank is locked.");
        var customer=matches.SingleOrDefault();
        if(customer==null)
        {
            customer=customers.AddNewCustomerAsync(new CustomerDTO{Type=0,IndividualType=0,IndividualFirstName="TEST SEPTEMBER",IndividualLastName="INSIDER",IndividualIdentityCardNumber=Identity,IndividualBirthDate=new DateTime(1990,1,1),IndividualNationality=1,BranchId=bank.BranchId,Reference2=Member,RegistrationDate=new DateTime(2026,9,1),Remarks="LOCAL TEST ONLY - synthetic insider customer for September 2026 loan workflow. No real person or appointment."},new List<DebitTypeDTO>(),investments.Where(x=>x.Id==deposit.Id || x.Id==new Guid("e38dce24-a6a4-f111-b323-c8e2651ef92d")).ToList(),new List<SavingsProductDTO>{savings},0,h).GetAwaiter().GetResult();
            if(customer==null || customer.Id==Guid.Empty)throw new InvalidOperationException("Customer creation failed.");
        }
        if(customer.Reference2!=Member || customer.IndividualFirstName!="TEST SEPTEMBER" || customer.IsLocked)throw new InvalidOperationException("Fixture identity collision or locked record.");
        if(customer.RecordStatus!=(int)RecordStatus.Approved)throw new InvalidOperationException("Customer needs normal verification before funding; customer created, no loan created.");
        // Service provisioning is idempotent by customer/product and includes mandatory accounts.
        var existingAccounts=accounts.FindCustomerAccountsByCustomerId(customer.Id,h) ?? new List<CustomerAccountDTO>();
        var requiredInvestments=investments.Where(x=>x.Id==deposit.Id || x.Id==new Guid("e38dce24-a6a4-f111-b323-c8e2651ef92d")).ToList();
        var requiredIds=requiredInvestments.Select(x=>x.Id).Concat(new[]{savings.Id,loan.Id}).ToList();
        if(requiredIds.Any(id=>!existingAccounts.Any(a=>a.CustomerAccountTypeTargetProductId==id)))
            accounts.AddNewCustomerAccounts(customer,new List<SavingsProductDTO>{savings}.Where(p=>!existingAccounts.Any(a=>a.CustomerAccountTypeTargetProductId==p.Id)).ToList(),requiredInvestments.Where(p=>!existingAccounts.Any(a=>a.CustomerAccountTypeTargetProductId==p.Id)).ToList(),new List<LoanProductDTO>{loan}.Where(p=>!existingAccounts.Any(a=>a.CustomerAccountTypeTargetProductId==p.Id)).ToList(),h);
        existingAccounts=accounts.FindCustomerAccountsByCustomerId(customer.Id,h);
        if(requiredIds.Any(id=>existingAccounts.Count(a=>a.CustomerAccountTypeTargetProductId==id)!=1))throw new InvalidOperationException("Required account missing or duplicated.");
        var directorService=c.Resolve<IDirectorAppService>();
        var director=(directorService.FindDirectors(h) ?? new List<DirectorDTO>()).SingleOrDefault(x=>x.CustomerId==customer.Id);
        if(director==null)director=directorService.AddNewDirector(new DirectorDTO{CustomerId=customer.Id,DivisionId=division.Id,Remarks="LOCAL TEST ONLY - synthetic director for insider reporting."},h);
        if(director==null || director.IsLocked)throw new InvalidOperationException("Director registration failed.");
        var insider=c.Resolve<ISasraInsiderAppService>();
        var appointment=insider.GetAppointments(Member,0,100,h).Items.SingleOrDefault(x=>x.CustomerId==customer.Id && !x.IsVoided);
        if(appointment==null)appointment=insider.SaveAppointment(new InsiderAppointmentDTO{CustomerId=customer.Id,Kind="Director",Position="LOCAL TEST Director",StartsAt=new DateTime(2026,9,1),Evidence="LOCAL TEST FIXTURE: synthetic director appointment effective 2026-09-01; not real appointment evidence."},h);
        var all=accounts.FindCustomerAccountsByCustomerId(customer.Id,h);
        var account=all.Single(x=>x.CustomerAccountTypeTargetProductId==deposit.Id);
        if(all.Any(x=>x.Status!=(int)CustomerAccountStatus.Normal || x.RecordStatus!=(int)RecordStatus.Approved))throw new InvalidOperationException("Customer accounts need normal verification.");
        var ledgers=c.Resolve<IChartOfAccountAppService>().FindChartOfAccounts(h);
        var bankLedger=ledgers.Single(x=>x.Id==bank.ChartOfAccountId);
        var depositLedger=ledgers.Single(x=>x.Id==deposit.ChartOfAccountId);
        if(bankLedger.IsLocked || depositLedger.IsLocked || bankLedger.AccountType!=(int)ChartOfAccountType.Asset || depositLedger.AccountType!=(int)ChartOfAccountType.Liability)throw new InvalidOperationException("Invalid funding ledgers.");
        var period=c.Resolve<IPostingPeriodAppService>().FindCurrentPostingPeriod(h);
        if(period==null || period.IsClosed || period.IsLocked || !period.IsActive || DateTime.Today<period.DurationStartDate.Date || DateTime.Today>period.DurationEndDate.Date)throw new InvalidOperationException("No valid current posting period.");
        var journals=c.Resolve<IJournalAppService>();
        Guid journalId;
        using(var scope=scopes.CreateWithTransaction(IsolationLevel.Serializable))
        {
            var existing=journals.FindJournals(0,100,new DateTime(2000,1,1),new DateTime(2100,1,1),Marker,(int)JournalFilter.Reference,h).PageCollection;
            if(existing.Count>1)throw new InvalidOperationException("Duplicate funding markers; manual review required.");
            var journal=existing.SingleOrDefault();
            if(journal==null)
            {
                accounts.FetchCustomerAccountBalances(new List<CustomerAccountDTO>{account},h);
                if(account.BookBalance!=0)throw new InvalidOperationException("Expected unfunded fixture BOSA account.");
                journal=journals.AddNewJournal(null,bank.BranchId,null,50000m,"LOCAL TEST - BOSA contribution via bank receipt",bankLedger.AccountName,Marker,0,(int)SystemTransactionCode.JournalVoucher,DateTime.Today,depositLedger.Id,bankLedger.Id,account,new CustomerAccountDTO(),h,false);
                if(journal==null || journal.Id==Guid.Empty)throw new InvalidOperationException("Funding journal failed.");
            }
            journalId=journal.Id;
            scope.SaveChanges(h);
        }
        var legs=journals.FindJournalEntries(h,journalId);
        if(legs.Count!=2 || legs.Sum(x=>x.Amount)!=0 || !legs.Any(x=>x.Amount==50000m && x.ChartOfAccountId==bankLedger.Id && !x.CustomerAccountId.HasValue) || !legs.Any(x=>x.Amount==-50000m && x.ChartOfAccountId==depositLedger.Id && x.CustomerAccountId==account.Id))throw new InvalidOperationException("Posted funding verification failed; do not repost.");
        accounts.FetchCustomerAccountBalances(all,h);
        if(account.BookBalance!=50000m)throw new InvalidOperationException("Expected KES 50,000 BOSA balance; do not repost.");
        var candidate=insider.GetCandidates(Member,0,100,h).Items.Single(x=>x.CustomerId==customer.Id && x.Kind=="Director");
        if(!candidate.HasHistory || candidate.IsLocked)throw new InvalidOperationException("Insider candidate verification failed.");
        var file=c.Resolve<IFileRegisterAppService>().FindFileRegisterAndLastDepartmentByCustomerId(customer.Id,bank.BranchId,h);
        var result=new{verified=true,environment="Local development",customer=new{customer.Id,customer.SerialNumber,customer.Reference2,customer.IndividualFirstName,customer.IndividualLastName,customer.RegistrationDate},appointment,accounts=all.Select(x=>new{x.FullAccountNumber,x.CustomerAccountTypeTargetProductId,x.BookBalance}),journalId,bank=bankLedger.AccountName,file.IsReadyForLoanAppraisal,file.LoanAppraisalReadinessMessage,loanCreated=false};
        File.WriteAllText(Path.Combine(directory,"test-september-insider-result.json"),JsonConvert.SerializeObject(result,Formatting.Indented));
        Console.WriteLine(JsonConvert.SerializeObject(result,Formatting.Indented));
    }
}
