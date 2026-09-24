using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using Application.MainBoundedContext.AccountsModule.Services;
using Application.MainBoundedContext.DTO.AccountsModule;
using Infrastructure.Crosscutting.Framework.Utils;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Numero3.EntityFramework.Interfaces;

internal static class TenhosAccounts
{
    sealed class Mapping
    {
        public Guid ProductId;
        public string Product;
        public string Field;
        public ChartOfAccountDTO Account;
    }
    static readonly string[] Fields = { "ChartOfAccountId", "InterestReceivableChartOfAccountId", "InterestChargedChartOfAccountId", "InterestReceivedChartOfAccountId" };
    static readonly string[] Roles = { "Principal", "Interest Receivable", "Interest Charged", "Interest Received" };
    static void Save(string path, object value) { File.WriteAllText(path, JsonConvert.SerializeObject(value, Formatting.Indented)); }
    static Guid AccountId(LoanProductDTO product, string field) { return (Guid)typeof(LoanProductDTO).GetProperty(field).GetValue(product); }
    static JObject Terms(LoanProductDTO product)
    {
        var json=JObject.FromObject(product);
        foreach(var p in json.Properties().Where(p=>p.Name.Contains("ChartOfAccount")).ToList()) p.Remove();
        return json;
    }
    static bool SameAccount(ChartOfAccountDTO a, ChartOfAccountDTO b)
    {
        return a.AccountCode==b.AccountCode && a.AccountName==b.AccountName && a.AccountType==b.AccountType &&
            a.AccountCategory==b.AccountCategory && a.ParentId==b.ParentId && a.CostCenterId==b.CostCenterId &&
            a.IsControlAccount==b.IsControlAccount && a.IsReconciliationAccount==b.IsReconciliationAccount &&
            a.PostAutomaticallyOnly==b.PostAutomaticallyOnly && a.IsLocked==b.IsLocked;
    }
    static void Verify(List<LoanProductDTO> before, List<LoanProductDTO> after, List<ChartOfAccountDTO> oldAccounts,
        List<ChartOfAccountDTO> accounts, List<Mapping> plan)
    {
        if(after.Count!=before.Count) throw new InvalidOperationException("Unexpected product count change.");
        foreach(var old in before)
        {
            var current=after.Single(p=>p.Id==old.Id);
            if(plan.Any(m=>m.ProductId==old.Id))
            {
                if(!current.IsLocked || !JToken.DeepEquals(Terms(old),Terms(current))) throw new InvalidOperationException("Product terms or lock changed: "+old.Description);
            }
            else if(!JToken.DeepEquals(JObject.FromObject(old),JObject.FromObject(current))) throw new InvalidOperationException("Unrelated product changed.");
        }
        foreach(var old in oldAccounts)
            if(!JToken.DeepEquals(JObject.FromObject(old),JObject.FromObject(accounts.Single(a=>a.Id==old.Id)))) throw new InvalidOperationException("Pre-existing ledger changed.");
        foreach(var m in plan)
        {
            var product=after.Single(p=>p.Id==m.ProductId);
            var account=accounts.Single(a=>a.Id==AccountId(product,m.Field));
            if(!SameAccount(m.Account,account)) throw new InvalidOperationException("Incorrect ledger mapping: "+m.Product+" / "+m.Field);
        }
        if(plan.Select(m=>AccountId(after.Single(p=>p.Id==m.ProductId),m.Field)).Distinct().Count()!=56)
            throw new InvalidOperationException("Expected 56 distinct mapped accounts.");
    }
    public static void Run(string mode, string directory, JArray research, ILoanProductAppService loans,
        IChartOfAccountAppService ledger, IDbContextScopeFactory scopes, ServiceHeader header)
    {
        // Serializable scope joins the AppServices' nested scopes: all accounts and mappings commit together.
        using(var transaction=scopes.CreateWithTransaction(IsolationLevel.Serializable))
        {
            var before=loans.FindLoanProducts(header);
            var oldAccounts=ledger.FindChartOfAccounts(header);
            var template=before.Single(p=>p.Description=="SALARY ADVANCE");
            if(mode=="accounts-inventory") { Save(Path.Combine(directory,"accounts-inventory.json"),oldAccounts); Console.WriteLine("Account inventory saved; no database writes."); return; }
            var plan=new List<Mapping>();
            for(int i=0;i<research.Count;i++)
            {
                var name=(string)research[i]["name"];
                var product=before.Single(p=>p.Description=="TENHOS - "+name+" [DRAFT]");
                if(!product.IsLocked) throw new InvalidOperationException("Refusing to remap an unlocked product: "+name);
                for(int role=0;role<Fields.Length;role++)
                {
                    var source=oldAccounts.Single(a=>a.Id==AccountId(template,Fields[role]));
                    var expectedType=role==3?(int)ChartOfAccountType.Income:(int)ChartOfAccountType.Asset;
                    if(source.AccountType!=expectedType || source.AccountCategory!=(int)ChartOfAccountCategory.DetailAccount || source.IsLocked)
                        throw new InvalidOperationException("Unexpected template ledger classification.");
                    var account=new ChartOfAccountDTO {
                        AccountCode=role==3?4101+i:1101+i*3+role,
                        AccountName="TENHOS - "+name+" - "+Roles[role],
                        AccountType=source.AccountType,AccountCategory=source.AccountCategory,ParentId=source.ParentId,
                        CostCenterId=source.CostCenterId,IsControlAccount=source.IsControlAccount,
                        IsReconciliationAccount=source.IsReconciliationAccount,PostAutomaticallyOnly=source.PostAutomaticallyOnly,IsLocked=false
                    };
                    var matches=oldAccounts.Where(a=>a.AccountCode==account.AccountCode || a.AccountName==account.AccountName).ToList();
                    if(matches.Count>1 || (matches.Count==1&&!SameAccount(matches[0],account))) throw new InvalidOperationException("Ledger code/name conflict: "+account.AccountCode);
                    if(matches.Count==1) account=matches[0];
                    plan.Add(new Mapping { ProductId=product.Id,Product=product.Description,Field=Fields[role],Account=account });
                }
            }
            Save(Path.Combine(directory,"accounts-plan.json"),plan);
            if(mode=="accounts-plan") { Console.WriteLine("Validated 56 ledger definitions for 14 locked products. Missing accounts: "+plan.Count(m=>m.Account.Id==Guid.Empty)+". No database writes."); return; }
            var backup=Path.Combine(directory,"before-account-mapping.json");
            if(!File.Exists(backup)) Save(backup,new { products=before,accounts=oldAccounts });
            var created=0;
            foreach(var m in plan.Where(m=>m.Account.Id==Guid.Empty))
            {
                var result=ledger.AddNewChartOfAccount(m.Account,header);
                if(result==null || result.Id==Guid.Empty || !string.IsNullOrEmpty(result.ErrorMessageResult)) throw new InvalidOperationException("Account creation failed: "+m.Account.AccountName);
                m.Account=result; created++;
            }
            var updated=0;
            foreach(var group in plan.GroupBy(m=>m.ProductId))
            {
                // Clone to preserve the immutable before snapshot used by verification.
                var product=JsonConvert.DeserializeObject<LoanProductDTO>(JsonConvert.SerializeObject(before.Single(p=>p.Id==group.Key)));
                if(group.All(m=>AccountId(product,m.Field)==m.Account.Id)) continue;
                foreach(var m in group) typeof(LoanProductDTO).GetProperty(m.Field).SetValue(product,m.Account.Id);
                if(!loans.UpdateLoanProduct(product,header)) throw new InvalidOperationException("Mapping update failed: "+product.Description);
                updated++;
            }
            // New accounts remain staged until the outer scope saves; list queries omit added entities.
            var stagedAccounts=ledger.FindChartOfAccounts(header);
            stagedAccounts.AddRange(plan.Select(m=>m.Account).Where(a=>!stagedAccounts.Any(existing=>existing.Id==a.Id)));
            Verify(before,loans.FindLoanProducts(header),oldAccounts,stagedAccounts,plan);
            transaction.SaveChanges(header);
            // SaveChanges commits the transaction; final verification uses fresh scopes after disposal.
            Save(Path.Combine(directory,"accounts-pending-result.json"),new { created,updated,mappings=plan });
        }
        var pendingPath=Path.Combine(directory,"accounts-pending-result.json");
        var pending=JObject.Parse(File.ReadAllText(pendingPath));
        var persistedProducts=loans.FindLoanProducts(header);
        var persistedAccounts=ledger.FindChartOfAccounts(header);
        var persistedPlan=pending["mappings"].ToObject<List<Mapping>>();
        var backupData=JObject.Parse(File.ReadAllText(Path.Combine(directory,"before-account-mapping.json")));
        Verify(backupData["products"].ToObject<List<LoanProductDTO>>(),persistedProducts,
            backupData["accounts"].ToObject<List<ChartOfAccountDTO>>(),persistedAccounts,persistedPlan);
        Save(Path.Combine(directory,"accounts-result.json"),new { verified=true,createdCount=(int)pending["created"],updatedProductCount=(int)pending["updated"],mappings=persistedPlan,products=persistedProducts.Where(p=>persistedPlan.Any(m=>m.ProductId==p.Id)) });
        File.Delete(pendingPath);
        Console.WriteLine("Created "+pending["created"]+" accounts; updated "+pending["updated"]+" products. Verified 56 distinct mappings, 14 locked products, unchanged lending terms and unchanged pre-existing ledgers/products.");
    }
}
