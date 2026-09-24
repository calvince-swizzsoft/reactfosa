using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.Remoting.Messaging;
using System.Runtime.Remoting.Proxies;
using Application.MainBoundedContext.BackOfficeModule.Services;
using Application.MainBoundedContext.DTO.BackOfficeModule;
using Domain.MainBoundedContext.BackOfficeModule.Aggregates.LoanCaseAgg;
using Domain.MainBoundedContext.BackOfficeModule.Aggregates.LoanDisbursementBatchAgg;
using Domain.MainBoundedContext.BackOfficeModule.Aggregates.LoanDisbursementBatchEntryAgg;
using Domain.Seedwork;
using Infrastructure.Crosscutting.Framework.Utils;
using Numero3.EntityFramework.Interfaces;
using WebApplication1.Areas.BackOffice.Controllers;

// Audit probes: real service/control methods, in-memory dependencies, no database.
// These assert observed defects, not desired behavior. A repaired control should fail its probe.
class Program
{
    class Proxy : RealProxy
    {
        readonly Func<IMethodCallMessage,object> invoke;
        public Proxy(Type type,Func<IMethodCallMessage,object> invoke):base(type){this.invoke=invoke;}
        public override IMessage Invoke(IMessage message)
        {
            var call=(IMethodCallMessage)message;
            try{return new ReturnMessage(invoke(call),null,0,call.LogicalCallContext,call);}
            catch(Exception e){return new ReturnMessage(e,call);}
        }
    }
    static object Stub(Type type,Func<IMethodCallMessage,object> f){return new Proxy(type,f).GetTransparentProxy();}
    static T Stub<T>(Func<IMethodCallMessage,object> f){return (T)Stub(typeof(T),f);}
    static T Construct<T>(Dictionary<Type,object> dependencies)
    {
        var ctor=typeof(T).GetConstructors().Single();
        return (T)ctor.Invoke(ctor.GetParameters().Select(p=>dependencies.ContainsKey(p.ParameterType)?dependencies[p.ParameterType]:Stub(p.ParameterType,c=>{throw new Exception("Unexpected dependency: "+p.ParameterType.Name+"."+c.MethodName);})).ToArray());
    }
    static void Observed(bool condition,string label){if(!condition)throw new Exception("Not reproduced: "+label);Console.WriteLine("REPRODUCED: "+label);}
    static void Main()
    {
        int saves=0,removed=0,queued=0;
        var header=new ServiceHeader{ApplicationUserName="maker",ApplicationUserRoles=new List<string>()};
        var batch=new LoanDisbursementBatch{Status=(byte)BatchStatus.Pending,CreatedBy="maker"};batch.GenerateNewIdentity();
        var loan=new LoanCase{Status=(int)LoanCaseStatus.Audited,IsBatched=true};loan.GenerateNewIdentity();
        var entry=new LoanDisbursementBatchEntry{LoanCaseId=loan.Id,LoanDisbursementBatchId=batch.Id,Status=(byte)BatchEntryStatus.Pending};entry.GenerateNewIdentity();
        var scope=Stub<IDbContextScope>(c=>{if(c.MethodName=="SaveChanges"){saves++;return 1;}if(c.MethodName=="Dispose")return null;throw new Exception(c.MethodName);});
        var dependencies=new Dictionary<Type,object>{
            {typeof(IDbContextScopeFactory),Stub<IDbContextScopeFactory>(c=>scope)},
            {typeof(IRepository<LoanDisbursementBatch>),Stub<IRepository<LoanDisbursementBatch>>(c=>{if(c.MethodName=="Get")return batch;if(c.MethodName=="DatabaseSqlQuery")return new Guid[0];throw new Exception(c.MethodName);})},
            {typeof(IRepository<LoanDisbursementBatchEntry>),Stub<IRepository<LoanDisbursementBatchEntry>>(c=>{if(c.MethodName=="Get")return entry;if(c.MethodName=="Remove"){removed++;return null;}throw new Exception(c.MethodName);})},
            {typeof(IRepository<LoanCase>),Stub<IRepository<LoanCase>>(c=>loan)}
        };
        var brokerType=typeof(LoanDisbursementBatchAppService).GetConstructors().Single().GetParameters().Single(p=>p.Name=="brokerService").ParameterType;
        dependencies[brokerType]=Stub(brokerType,c=>{queued++;return true;});
        var service=Construct<LoanDisbursementBatchAppService>(dependencies);
        var dto=new LoanDisbursementBatchDTO{Id=batch.Id,AuditRemarks="audit",AuthorizationRemarks="authorize"};
        Observed(service.AuditLoanDisbursementBatch(dto,(int)BatchAuthOption.Post,header)&&batch.AuditedBy=="maker","batch creator with no roles can audit their own batch");
        Observed(service.AuthorizeLoanDisbursementBatch(dto,(int)BatchAuthOption.Post,0,header)&&batch.AuthorizedBy=="maker"&&queued==1,"same unprivileged actor can authorize and queue the batch");
        batch.Status=(byte)BatchStatus.Pending;
        var mark=typeof(LoanDisbursementBatchAppService).GetMethod("MarkLoanDisbursementBatchEntryPosted",BindingFlags.Instance|BindingFlags.NonPublic);
        Observed((bool)mark.Invoke(service,new object[]{entry.Id,header})&&entry.Status==(byte)BatchEntryStatus.Posted,"entry enters Posted while its parent batch is still Pending");
        Observed((bool)mark.Invoke(service,new object[]{entry.Id,header}),"second worker/retry is admitted while the first has not disbursed the loan");
        batch.Status=(byte)BatchStatus.Posted;loan.Status=(int)LoanCaseStatus.Disbursed;
        Observed(service.RemoveLoanDisbursementBatchEntries(new List<LoanDisbursementBatchEntryDTO>{new LoanDisbursementBatchEntryDTO{Id=entry.Id}},header)&&removed==1&&!loan.IsBatched,"posted batch entry can be removed and the disbursed loan unbatched");
        entry.Status=(byte)BatchEntryStatus.Pending;
        Observed(service.UpdateLoanDisbursementBatchEntry(new LoanDisbursementBatchEntryDTO{Id=entry.Id,Status=255},header)&&entry.Status==255,"entry status accepts an undefined numeric state");

        var controllerDependencies=new Dictionary<Type,object>();
        var workflowType=typeof(LoanCaseController).GetConstructors().Single().GetParameters().Single(p=>p.ParameterType.Name=="IWorkflowAppService").ParameterType;
        controllerDependencies[workflowType]=Stub(workflowType,c=>{if(c.MethodName=="FindWorkflow")return null;throw new Exception(c.MethodName);});
        var controller=Construct<LoanCaseController>(controllerDependencies);
        var validate=typeof(LoanCaseController).GetMethod("ValidateFinalLoanStageItem",BindingFlags.Instance|BindingFlags.NonPublic);
        Observed(validate.Invoke(controller,new object[]{loan.Id,Guid.Empty,SystemPermissionType.BackOfficeLoanApproval,header,null})==null,"missing approval workflow accepts caller with no roles or workflow item");
        Console.WriteLine("Completed 7 isolated control probes; no database or network access.");
    }
}
