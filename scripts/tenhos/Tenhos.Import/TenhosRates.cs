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

internal static class TenhosRates
{
    static readonly Dictionary<string,double> Rates=new Dictionary<string,double> {
        {"boresha-elimu",12d},{"emergency-loan",12d},
        {"asset-financing-loan",15d},{"development-loan",12d},
        {"advances",24d},{"hospital-check-off-advance",18d},
        {"special-advance",24d},{"overdraft-facility",24d},
        {"loan-item-facility",18d},{"start-up-loan",18d},
        {"bonus-advance",24d},{"dairy-loan",15d},
        {"ukulima-loan",15d},{"vijana-loan",18d}
    };
    static void Save(string path,object value){File.WriteAllText(path,JsonConvert.SerializeObject(value,Formatting.Indented));}
    static void Verify(List<LoanProductDTO> before,List<LoanProductDTO> after,Dictionary<Guid,double> targets)
    {
        if(before.Count!=after.Count)throw new InvalidOperationException("Product count changed.");
        foreach(var original in before)
        {
            var expected=JObject.FromObject(original);
            if(targets.ContainsKey(original.Id))expected["LoanInterestAnnualPercentageRate"]=targets[original.Id];
            var actual=after.Single(p=>p.Id==original.Id);
            if(!JToken.DeepEquals(expected,JObject.FromObject(actual)))throw new InvalidOperationException("Unexpected product change: "+original.Description);
        }
    }
    public static void Run(string mode,string directory,JArray research,ILoanProductAppService service,IDbContextScopeFactory scopes,ServiceHeader header)
    {
        List<LoanProductDTO> before;
        var targets=new Dictionary<Guid,double>();
        var changed=0;
        using(var scope=scopes.CreateWithTransaction(IsolationLevel.Serializable))
        {
            before=service.FindLoanProducts(header);
            foreach(var item in research)
            {
                var product=before.Single(p=>p.Description=="TENHOS - "+(string)item["name"]+" [DRAFT]");
                if(!product.IsLocked)throw new InvalidOperationException("Expected locked draft: "+product.Description);
                if(product.LoanInterestCalculationMode!=(int)InterestCalculationMode.ReducingBalance)throw new InvalidOperationException("Expected reducing-balance mode: "+product.Description);
                targets.Add(product.Id,Rates[(string)item["key"]]);
                var proposed=JsonConvert.DeserializeObject<LoanProductDTO>(JsonConvert.SerializeObject(product));
                proposed.LoanInterestAnnualPercentageRate=targets[product.Id];
                var errors=service.ValidateLoanProduct(proposed,header);
                if(errors.Any())throw new InvalidOperationException("Rate validation failed: "+product.Description);
            }
            if(targets.Count!=14)throw new InvalidOperationException("Expected 14 products.");
            Save(Path.Combine(directory,"rates-plan.json"),new {basis="User-authorized provisional nominal annual reducing-balance test rates, not approved Tenhos rates. Fees excluded; products remain locked.",products=before.Where(p=>targets.ContainsKey(p.Id)).Select(p=>new {p.Id,p.Description,previousRate=p.LoanInterestAnnualPercentageRate,rate=targets[p.Id]})});
            if(mode=="rates-plan"){Console.WriteLine("Validated all 14 provisional rates; no database writes.");return;}
            var backup=Path.Combine(directory,"before-rates.json");
            if(!File.Exists(backup))Save(backup,before);
            foreach(var original in before.Where(p=>targets.ContainsKey(p.Id)))
            {
                if(original.LoanInterestAnnualPercentageRate==targets[original.Id])continue;
                var product=JsonConvert.DeserializeObject<LoanProductDTO>(JsonConvert.SerializeObject(original));
                product.LoanInterestAnnualPercentageRate=targets[product.Id];
                if(!service.UpdateLoanProduct(product,header))throw new InvalidOperationException("Rate update failed: "+product.Description);
                changed++;
            }
            Verify(before,service.FindLoanProducts(header),targets);
            scope.SaveChanges(header);
        }
        var after=service.FindLoanProducts(header);
        Verify(before,after,targets);
        Save(Path.Combine(directory,"rates-result.json"),new {verified=true,changedCount=changed,products=after.Where(p=>targets.ContainsKey(p.Id))});
        Console.WriteLine("Saved "+changed+" rates; verified all 14 requested annual rates. Locks, ledger mappings and all other settings unchanged; unrelated products unchanged.");
    }
}
