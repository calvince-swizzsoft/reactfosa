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

internal static class TenhosMaximums
{
    static readonly Dictionary<string,decimal> Caps=new Dictionary<string,decimal> {
        {"boresha-elimu",500000m},{"emergency-loan",500000m},
        {"asset-financing-loan",3000000m},{"development-loan",3000000m},
        {"advances",100000m},{"hospital-check-off-advance",100000m},
        {"special-advance",200000m},{"overdraft-facility",300000m},
        {"loan-item-facility",300000m},{"start-up-loan",300000m},
        {"bonus-advance",200000m},{"dairy-loan",500000m},
        {"ukulima-loan",500000m},{"vijana-loan",300000m}
    };
    static void Save(string path,object value){File.WriteAllText(path,JsonConvert.SerializeObject(value,Formatting.Indented));}
    static void Verify(List<LoanProductDTO> before,List<LoanProductDTO> after,Dictionary<Guid,decimal> targets)
    {
        if(before.Count!=after.Count)throw new InvalidOperationException("Product count changed.");
        foreach(var original in before)
        {
            var expected=JObject.FromObject(original);
            if(targets.ContainsKey(original.Id))expected["LoanRegistrationMaximumAmount"]=targets[original.Id];
            var actual=after.Single(p=>p.Id==original.Id);
            if(!JToken.DeepEquals(expected,JObject.FromObject(actual)))throw new InvalidOperationException("Unexpected product change: "+original.Description);
        }
    }
    public static void Run(string mode,string directory,JArray research,ILoanProductAppService service,IDbContextScopeFactory scopes,ServiceHeader header)
    {
        List<LoanProductDTO> before;
        var targets=new Dictionary<Guid,decimal>();
        var changed=0;
        using(var scope=scopes.CreateWithTransaction(IsolationLevel.Serializable))
        {
            before=service.FindLoanProducts(header);
            foreach(var item in research)
            {
                var product=before.Single(p=>p.Description=="TENHOS - "+(string)item["name"]+" [DRAFT]");
                if(!product.IsLocked)throw new InvalidOperationException("Expected locked draft: "+product.Description);
                targets.Add(product.Id,Caps[(string)item["key"]]);
                var proposed=JsonConvert.DeserializeObject<LoanProductDTO>(JsonConvert.SerializeObject(product));
                proposed.LoanRegistrationMaximumAmount=targets[product.Id];
                var errors=service.ValidateLoanProduct(proposed,header);
                if(errors.Any())throw new InvalidOperationException("Maximum validation failed: "+product.Description);
            }
            if(targets.Count!=14)throw new InvalidOperationException("Expected 14 products.");
            Save(Path.Combine(directory,"maximums-plan.json"),new {basis="User-authorized provisional local testing ceilings, not approved Tenhos limits. Applicant qualification rules still apply.",products=before.Where(p=>targets.ContainsKey(p.Id)).Select(p=>new {p.Id,p.Description,previousMaximum=p.LoanRegistrationMaximumAmount,maximum=targets[p.Id]})});
            if(mode=="maximums-plan"){Console.WriteLine("Validated all 14 provisional maximums; no database writes.");return;}
            var backup=Path.Combine(directory,"before-maximums.json");
            if(!File.Exists(backup))Save(backup,before);
            foreach(var original in before.Where(p=>targets.ContainsKey(p.Id)))
            {
                if(original.LoanRegistrationMaximumAmount==targets[original.Id])continue;
                var product=JsonConvert.DeserializeObject<LoanProductDTO>(JsonConvert.SerializeObject(original));
                product.LoanRegistrationMaximumAmount=targets[product.Id];
                if(!service.UpdateLoanProduct(product,header))throw new InvalidOperationException("Maximum update failed: "+product.Description);
                changed++;
            }
            Verify(before,service.FindLoanProducts(header),targets);
            scope.SaveChanges(header);
        }
        var after=service.FindLoanProducts(header);
        Verify(before,after,targets);
        Save(Path.Combine(directory,"maximums-result.json"),new {verified=true,changedCount=changed,products=after.Where(p=>targets.ContainsKey(p.Id))});
        Console.WriteLine("Saved "+changed+" maximums; verified all 14 requested caps. Locks, ledger mappings and all other settings unchanged; unrelated products unchanged.");
    }
}
