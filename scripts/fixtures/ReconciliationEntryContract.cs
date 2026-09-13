using System;
using System.IO;
using System.Reflection;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.CompilerServices;
using Newtonsoft.Json;
using WebApplication1.Areas.Accounts.Controllers;
using Application.MainBoundedContext.DTO.AccountsModule;
class ReconciliationEntryContract
{
    static void Main(string[] args)
    {
        AppDomain.CurrentDomain.AssemblyResolve += (sender,e) => { var path=Path.Combine(args[0],new AssemblyName(e.Name).Name+".dll"); return File.Exists(path)?Assembly.LoadFrom(path):null; };
        Run();
    }
    static bool Valid(object value) { return Validator.TryValidateObject(value,new ValidationContext(value),new List<ValidationResult>(),true); }
    [MethodImpl(MethodImplOptions.NoInlining)]
    static void Run()
    {
        const string json="{\"AdjustmentType\":0,\"Value\":125.50,\"ChartOfAccountId\":null,\"ChequeDate\":null}";
        if(Valid(JsonConvert.DeserializeObject<BankReconciliationEntryDTO>(json)))throw new Exception("Old missing-period failure was not reproduced.");
        var request=JsonConvert.DeserializeObject<AddBankReconciliationEntryRequest>(json);
        if(!Valid(request))throw new Exception("Valid adjustment rejected before route binding.");
        var periodId=Guid.NewGuid();var entry=request.ToEntry(periodId);
        if(!Valid(entry)||entry.BankReconciliationPeriodId!=periodId||entry.ChequeDate!=null||entry.Value!=125.50m)throw new Exception("Period assignment or optional fields failed.");
        request.Value=0;if(Valid(request))throw new Exception("Zero adjustment accepted.");
        request.Value=1;request.AdjustmentType=4;if(Valid(request))throw new Exception("Unknown adjustment accepted.");
        var bodyId=Guid.NewGuid();request=JsonConvert.DeserializeObject<AddBankReconciliationEntryRequest>(json.TrimEnd('}')+",\"BankReconciliationPeriodId\":\""+bodyId+"\"}");
        if(request.ToEntry(periodId).BankReconciliationPeriodId!=periodId)throw new Exception("Body overrode route period.");
        Console.WriteLine("PASS: reproduced old binding failure; valid request binds; route controls period; invalid values rejected. No database writes.");
    }
}
