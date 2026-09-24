using Application.Seedwork;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using File = System.IO.File;
using System.Linq;
using System.Reflection;
using System.Runtime.Remoting.Messaging;
using System.Runtime.Remoting.Proxies;
using System.Runtime.Serialization;
using System.Threading.Tasks;
using Application.MainBoundedContext.AccountsModule.Services;
using Application.MainBoundedContext.BackOfficeModule.Services;
using Application.MainBoundedContext.DTO.AccountsModule;
using Application.MainBoundedContext.DTO.BackOfficeModule;
using Application.MainBoundedContext.Services;
using Domain.MainBoundedContext.BackOfficeModule.Aggregates.LoanCaseAgg;
using Domain.MainBoundedContext.ValueObjects;
using Domain.Seedwork;
using Infrastructure.Crosscutting.Framework.Utils;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Numero3.EntityFramework.Interfaces;

internal static class TenhosIncome
{
    class Proxy:RealProxy
    {
        readonly Func<IMethodCallMessage,object> f;
        public Proxy(Type type,Func<IMethodCallMessage,object> f):base(type){this.f=f;}
        public override IMessage Invoke(IMessage message){var c=(IMethodCallMessage)message;try{return new ReturnMessage(f(c),null,0,c.LogicalCallContext,c);}catch(Exception e){return new ReturnMessage(e,c);}}
    }
    static object Stub(Type type,Func<IMethodCallMessage,object> f){return new Proxy(type,f).GetTransparentProxy();}
    static int checks;
    static void Check(bool condition,string message){if(!condition)throw new Exception(message);checks++;}
    static void Reject(Action action,string message){try{action();}catch(LoanIncomeAssessmentException){checks++;return;}throw new Exception(message);}
    static void Save(string path,object data){File.WriteAllText(path,JsonConvert.SerializeObject(data,Formatting.Indented));}
    public static void Run(string mode,string directory,ILoanProductAppService products,IDbContextScopeFactory scopes,ServiceHeader header)
    {
        checks=0;
        Check(LoanIncomeAssessmentRules.RequiredTakeHome(60000m,(int)ChargeType.Percentage,100d/3d,0m)==20000m,"One-third threshold incorrect.");
        Check(LoanIncomeAssessmentRules.Validate(60000m,45000m,25000m,(int)ChargeType.Percentage,100d/3d,0m)==25000m,"Exact boundary should pass.");
        Reject(()=>LoanIncomeAssessmentRules.Validate(60000m,45000m,25000.01m,(int)ChargeType.Percentage,100d/3d,0m),"Below boundary should fail.");
        Reject(()=>LoanIncomeAssessmentRules.Validate(0m,0m,1m,(int)ChargeType.Percentage,100d/3d,0m),"Zero income accepted.");
        Reject(()=>LoanIncomeAssessmentRules.Validate(60000m,70000m,1m,(int)ChargeType.Percentage,100d/3d,0m),"Inflated net income accepted.");
        Reject(()=>LoanIncomeAssessmentRules.RequiredTakeHome(60000m,(int)ChargeType.Percentage,0d,0m),"Missing threshold accepted.");
        Reject(()=>LoanIncomeAssessmentRules.RequiredTakeHome(60000m,(int)ChargeType.Percentage,double.NaN,0m),"NaN threshold accepted.");
        Check(LoanIncomeAssessmentRules.RequiredTakeHome(10000m,(int)ChargeType.Percentage,100d/3d,0m)==3333.34m,"Threshold must round up to cents.");
        Check(LoanIncomeAssessmentRules.Validate(60000m,45000m,25000m,(int)ChargeType.FixedAmount,0d,20000m)==25000m,"Fixed threshold failed.");
        RunLifecycle(header);
        Console.WriteLine("PASS "+checks+" isolated affordability/lifecycle checks; no loans or journals written.");
        Save(Path.Combine(directory,"income-assessment-tests.json"),new{passed=checks,scope="In-memory real LoanCaseAppService with actual financial calculator; no member data or postings"});
        if(mode!="income-apply")return;
        var before=products.FindLoanProducts(header);
        var product=JsonConvert.DeserializeObject<LoanProductDTO>(JsonConvert.SerializeObject(before.Single(p=>p.Description=="TENHOS - Boresha Elimu (School Fees Loan) [DRAFT]")));
        Check(product.IsLocked,"Boresha must remain locked.");
        var backup=Path.Combine(directory,"before-income-assessment.json");
        if(!File.Exists(backup))Save(backup,before);
        product.RequireIncomeAssessment=true;
        product.TakeHomeType=(int)ChargeType.Percentage;
        product.TakeHomePercentage=100d/3d;
        product.TakeHomeFixedAmount=0m;
        Check(!products.ValidateLoanProduct(product,header).Any(),"Boresha configuration invalid.");
        using(var scope=scopes.CreateWithTransaction(IsolationLevel.Serializable))
        {
            Check(products.UpdateLoanProduct(product,header),"Could not enable income assessment.");
            scope.SaveChanges(header);
        }
        var after=products.FindLoanProducts(header);
        Check(before.Count==after.Count,"Product count changed.");
        foreach(var old in before)
        {
            var expected=old.Id==product.Id?product:old;
            Check(JToken.DeepEquals(JObject.FromObject(expected),JObject.FromObject(after.Single(p=>p.Id==old.Id))),"Unexpected product change.");
        }
        Save(Path.Combine(directory,"income-assessment-result.json"),new{verified=true,rule="Local test: retain one-third of verified monthly gross income after deductions and maximum monthly instalment",product=after.Single(p=>p.Id==product.Id)});
        Console.WriteLine("Enabled Boresha income assessment with one-third gross take-home; verified product remains locked and all unrelated settings/products unchanged.");
    }
    static void RunLifecycle(ServiceHeader header)
    {
        var registration=(LoanRegistration)FormatterServices.GetUninitializedObject(typeof(LoanRegistration));
        Action<string,object> set=(name,value)=>typeof(LoanRegistration).GetProperty(name).SetValue(registration,value);
        set("TermInMonths",(short)11);set("PaymentFrequencyPerYear",(short)12);set("LoanProductSection",(byte)LoanProductSection.BOSA);
        var loan=new LoanCase{RequireIncomeAssessment=true,LoanRegistration=registration,LoanInterest=new LoanInterest(12,(int)InterestChargeMode.Periodic,(int)InterestRecoveryMode.Periodic,(int)InterestCalculationMode.ReducingBalance),TakeHome=new Charge((int)ChargeType.Percentage,100d/3d,0m),Status=(int)LoanCaseStatus.Registered};
        loan.GenerateNewIdentity();
        var deductionId=Guid.NewGuid();var allowanceId=Guid.NewGuid();int saves=0;
        var dependencies=new Dictionary<Type,object>{
            {typeof(IRepository<LoanCase>),Stub(typeof(IRepository<LoanCase>),c=>c.MethodName=="GetAsync"?(object)Task.FromResult(loan):c.MethodName=="Get"?loan:throw new Exception("Unexpected repository call: "+c.MethodName))},
            {typeof(IFinancialsService),new FinancialsService()},
            {typeof(IDbContextScopeFactory),Stub(typeof(IDbContextScopeFactory),c=>Stub(((MethodInfo)c.MethodBase).ReturnType,x=>{if(x.MethodName=="Dispose")return null;if(x.MethodName=="SaveChanges"){saves++;return 1;}if(x.MethodName=="SaveChangesAsync"){saves++;return Task.FromResult(1);}throw new Exception(x.MethodName);}))},
            {typeof(IIncomeAdjustmentAppService),Stub(typeof(IIncomeAdjustmentAppService),c=>new IncomeAdjustmentDTO{Id=(Guid)c.Args[0],Type=(Guid)c.Args[0]==deductionId?(int)IncomeAdjustmentType.Deduction:(int)IncomeAdjustmentType.Allowance})},
            {typeof(IBrokerService),Stub(typeof(IBrokerService),c=>true)}
        };
        var ctor=typeof(LoanCaseAppService).GetConstructors().Single();
        var service=(LoanCaseAppService)ctor.Invoke(ctor.GetParameters().Select(p=>dependencies.ContainsKey(p.ParameterType)?dependencies[p.ParameterType]:Stub(p.ParameterType,c=>{throw new Exception("Unexpected dependency: "+p.ParameterType.Name+"."+c.MethodName);})).ToArray());
        Func<LoanCaseDTO> input=()=>new LoanCaseDTO{Id=loan.Id,AppraisedAmount=100000m,LoanProductLatestIncome=60000m,AppraisedNetIncome=999999m,MonthlyPaybackAmount=1m,TotalPaybackAmount=1m,IncomeAssessmentReference="TEST payslips July/August",IncomeAssessmentAdjustments=new List<LoanAppraisalFactorDTO>{new LoanAppraisalFactorDTO{IncomeAdjustmentId=deductionId,Amount=15000m,IsEnabled=true}}};
        var invalid=input();invalid.IncomeAssessmentReference=null;
        Reject(()=>service.AppraiseLoanCase(invalid,(int)LoanAppraisalOption.Appraise,0,header),"Missing evidence accepted.");
        Check(saves==0 && loan.Status==(int)LoanCaseStatus.Registered,"Failed assessment saved or advanced case.");
        invalid=input();invalid.AppraisedAmount=400000m;
        Reject(()=>service.AppraiseLoanCase(invalid,(int)LoanAppraisalOption.Appraise,0,header),"Unaffordable loan accepted through AppService.");
        invalid=input();invalid.IncomeAssessmentAdjustments[0].IncomeAdjustmentId=allowanceId;
        Reject(()=>service.AppraiseLoanCase(invalid,(int)LoanAppraisalOption.Appraise,0,header),"Allowance could inflate verified gross.");
        invalid=input();invalid.IncomeAssessmentAdjustments.Add(invalid.IncomeAssessmentAdjustments[0]);
        Reject(()=>service.AppraiseLoanCase(invalid,(int)LoanAppraisalOption.Appraise,0,header),"Duplicate deduction accepted.");
        Check(service.AppraiseLoanCase(input(),(int)LoanAppraisalOption.Appraise,0,header),"Valid assessment failed.");
        Check(loan.AppraisedNetIncome==45000m && loan.MonthlyPaybackAmount>10000m && loan.TotalPaybackAmount>100000m,"Server failed to overwrite spoofed net income/repayment.");
        Check(!string.IsNullOrEmpty(loan.IncomeAssessmentSignature),"Assessment signature missing.");
        Reject(()=>service.UpdateLoanCaseAsync(new LoanCaseDTO{Id=loan.Id},header).GetAwaiter().GetResult(),"Generic edit bypassed reassessment requirement.");
        var signatureDto=loan.ProjectedAs<LoanCaseDTO>();
        var canonical=LoanIncomeAssessmentRules.Signature(signatureDto,100000m,60000m,45000m,loan.IncomeAssessmentReference);
        signatureDto.TakeHomeFixedAmount=0.00m;
        Check(canonical==LoanIncomeAssessmentRules.Signature(signatureDto,100000.00m,60000.00m,45000.00m,loan.IncomeAssessmentReference),"SQL decimal scale changed the signature.");
        Check(canonical!=LoanIncomeAssessmentRules.Signature(signatureDto,100000.01m,60000m,45000m,loan.IncomeAssessmentReference),"One-cent principal change was ignored.");
        Check(!LoanIncomeAssessmentRules.MatchesSignature(signatureDto,100000m,60000m,45000m,loan.IncomeAssessmentReference,null),"Missing signature accepted.");
        // Simulate reloading decimal amounts from SQL before the actual approval call.
        loan.LoanProductLatestIncome=60000.00m;
        loan.AppraisedNetIncome=45000.00m;
        loan.TakeHome=new Charge((int)ChargeType.Percentage,100d/3d,0.00m);
        var signature=loan.IncomeAssessmentSignature;
        Reject(()=>service.ApproveLoanCase(new LoanCaseDTO{Id=loan.Id,ApprovedAmount=110000m},(int)LoanApprovalOption.Approve,header),"Changed principal approved without reassessment.");
        loan.LoanInterest=new LoanInterest(24,(int)InterestChargeMode.Periodic,(int)InterestRecoveryMode.Periodic,(int)InterestCalculationMode.ReducingBalance);
        Reject(()=>service.ApproveLoanCase(new LoanCaseDTO{Id=loan.Id,ApprovedAmount=100000m},(int)LoanApprovalOption.Approve,header),"Changed rate approved without reassessment.");
        loan.LoanInterest=new LoanInterest(12,(int)InterestChargeMode.Periodic,(int)InterestRecoveryMode.Periodic,(int)InterestCalculationMode.ReducingBalance);
        set("TermInMonths",(short)12);
        Reject(()=>service.ApproveLoanCase(new LoanCaseDTO{Id=loan.Id,ApprovedAmount=100000m},(int)LoanApprovalOption.Approve,header),"Changed term approved without reassessment.");
        set("TermInMonths",(short)11);
        loan.AppraisedNetIncome=46000m;
        Reject(()=>service.ApproveLoanCase(new LoanCaseDTO{Id=loan.Id,ApprovedAmount=100000m},(int)LoanApprovalOption.Approve,header),"Changed income approved without reassessment.");
        loan.AppraisedNetIncome=45000m;
        Check(service.ApproveLoanCase(new LoanCaseDTO{Id=loan.Id,ApprovedAmount=100000m,MonthlyPaybackAmount=1m,TotalPaybackAmount=1m},(int)LoanApprovalOption.Approve,header),"Valid assessed loan could not be approved.");
        Check(loan.MonthlyPaybackAmount>10000m,"Approval accepted spoofed repayment.");
        loan.IncomeAssessmentSignature=null;
        Reject(()=>service.AuditLoanCase(new LoanCaseDTO{Id=loan.Id},(int)LoanAuditOption.Audit,header),"Verification accepted missing assessment.");
        loan.Status=(int)LoanCaseStatus.Audited;
        Reject(()=>service.MarkLoanCaseDisbursed(new LoanDisbursementBatchEntryDTO{LoanCaseId=loan.Id},header),"Disbursement accepted missing assessment.");
        loan.Status=(int)LoanCaseStatus.Appraised;
        Reject(()=>service.ApproveLoanCaseAsync(new LoanCaseDTO{Id=loan.Id,ApprovedAmount=100000m},(int)LoanApprovalOption.Approve,header).GetAwaiter().GetResult(),"Async approval accepted missing assessment.");
        loan.Status=(int)LoanCaseStatus.Registered;
        invalid=input();invalid.IncomeAssessmentReference=null;
        Reject(()=>service.AppraiseLoanCaseAsync(invalid,(int)LoanAppraisalOption.Appraise,0,header).GetAwaiter().GetResult(),"Async appraisal accepted missing evidence.");
        Check(service.AppraiseLoanCaseAsync(input(),(int)LoanAppraisalOption.Appraise,0,header).GetAwaiter().GetResult(),"Valid async assessment failed.");
        Check(service.ApproveLoanCaseAsync(new LoanCaseDTO{Id=loan.Id,ApprovedAmount=100000m},(int)LoanApprovalOption.Approve,header).GetAwaiter().GetResult(),"Valid async approval failed.");
        loan.RequireIncomeAssessment=null;
        loan.Status=(int)LoanCaseStatus.Registered;
        Check(service.AppraiseLoanCase(invalid,(int)LoanAppraisalOption.Appraise,0,header),"Legacy non-opted-in service behavior changed.");
    }
}
