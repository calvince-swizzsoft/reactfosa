. "$PSScriptRoot/notice-db-session.ps1"
$marker='NOTICE-SEED-20260917'
if((Query "SELECT COUNT(*) N FROM swiftFin_LoanRepaymentPlans WHERE CreatedBy='$marker'").Rows[0].N -ne 0){throw 'This seed already exists; refusing to repeat.'}
if((Query 'SELECT DB_NAME() Name').Rows[0].Name -ne 'SwiftFinancialsDB_Live'){throw 'Wrong database'}
$backup=Join-Path $root 'tmp/notice-seed/before.xml'
$ds=[System.Data.DataSet]::new('NoticeSeedBackup')
$queries=@{
 LoanCases='SELECT * FROM swiftFin_LoanCases WHERE CaseNumber IN(6,9,10)';
 Plans='SELECT s.* FROM swiftFin_LoanRepaymentPlans s JOIN swiftFin_LoanCases l ON l.Id=s.LoanCaseId WHERE l.CaseNumber IN(6,9,10)';
 Instalments='SELECT i.* FROM swiftFin_LoanRepaymentInstalments i JOIN swiftFin_LoanRepaymentPlans s ON s.Id=i.PlanId JOIN swiftFin_LoanCases l ON l.Id=s.LoanCaseId WHERE l.CaseNumber IN(6,9,10)';
 Journals="SELECT * FROM swiftFin_Journals WHERE Reference LIKE '%~L#0000006' OR Reference LIKE '%~L#0000009' OR Reference LIKE '%~L#0000010'";
 Entries="SELECT e.* FROM swiftFin_JournalEntries e JOIN swiftFin_Journals j ON j.Id=e.JournalId WHERE j.Reference LIKE '%~L#0000006' OR j.Reference LIKE '%~L#0000009' OR j.Reference LIKE '%~L#0000010'"
}
foreach($name in $queries.Keys){$table=Query $queries[$name];$table.TableName=$name;[void]$ds.Tables.Add($table)}
$ds.WriteXml($backup,[System.Data.XmlWriteMode]::WriteSchema)
$tx=$connection.BeginTransaction([System.Data.IsolationLevel]::Serializable)
try {
$cmd=$connection.CreateCommand();$cmd.Transaction=$tx;$cmd.CommandTimeout=60
$cmd.CommandText=@"
SET XACT_ABORT ON;
DECLARE @asAt date='20260917', @marker nvarchar(50)='$marker';
DECLARE @targets TABLE(CaseNumber int, AnchorNumber int, DaysOverdue int);
INSERT @targets VALUES(6,3,45),(9,3,60),(10,1,90);
DECLARE @case int,@anchor int,@days int,@old uniqueidentifier,@new uniqueidentifier,@caseId uniqueidentifier,@journal uniqueidentifier,@shift int,@disb date,@oldDisb date,@due date,@interest decimal(18,2);
DECLARE fixtures CURSOR LOCAL FAST_FORWARD FOR SELECT CaseNumber,AnchorNumber,DaysOverdue FROM @targets;
OPEN fixtures; FETCH NEXT FROM fixtures INTO @case,@anchor,@days;
WHILE @@FETCH_STATUS=0
BEGIN
 SELECT @caseId=Id FROM swiftFin_LoanCases WHERE CaseNumber=@case AND Status=48829;
 SET @old=NULL;
 SELECT TOP 1 @old=Id,@journal=SourceJournalId,@oldDisb=DisbursementDate FROM swiftFin_LoanRepaymentPlans WHERE LoanCaseId=@caseId ORDER BY Revision DESC;
 IF @old IS NULL THROW 50001,'Missing seed loan plan',1;
 SELECT @due=DueDate FROM swiftFin_LoanRepaymentInstalments WHERE PlanId=@old AND Number=@anchor;
 SET @shift=DATEDIFF(day,@due,DATEADD(day,-@days,@asAt));
 SET @disb=DATEADD(day,@shift,@oldDisb);
 IF @case=10 SET @disb=DATEADD(day,-30,DATEADD(day,-@days,@asAt));
 SET @new=NEWID();
 UPDATE swiftFin_LoanCases SET DisbursedDate=@disb, DisbursementRemarks=CONCAT(DisbursementRemarks,' [',@marker,': overdue test fixture; dates backdated; amounts unchanged]') WHERE Id=@caseId;
 UPDATE swiftFin_Journals SET ValueDate=@disb WHERE Id=@journal OR ParentId=@journal;
 UPDATE e SET ValueDate=@disb FROM swiftFin_JournalEntries e JOIN swiftFin_Journals j ON j.Id=e.JournalId WHERE j.Id=@journal OR j.ParentId=@journal;
 INSERT swiftFin_LoanRepaymentPlans(Id,LoanCaseId,CustomerAccountId,PrincipalChartOfAccountId,SourceJournalId,Revision,IsConfirmed,DisbursementDate,Principal,Evidence,AllocationPolicy,SequentialId,CreatedBy,CreatedDate,InterestReceivableChartOfAccountId,InterestChargedChartOfAccountId,InterestTermsConfirmed,IsRestructuring)
 SELECT @new,LoanCaseId,CustomerAccountId,PrincipalChartOfAccountId,SourceJournalId,Revision+1,1,@disb,Principal,
 CONCAT(@marker,': user-authorized test-database principal-arrears fixture. Existing customer/account/product and all ledger amounts retained. Principal dates backdated; education-loan interest dates retained to isolate principal default. Upfront interest reconciled to recorded charge. Prior revision preserved.'),AllocationPolicy,NEWID(),@marker,SYSUTCDATETIME(),InterestReceivableChartOfAccountId,InterestChargedChartOfAccountId,1,0
 FROM swiftFin_LoanRepaymentPlans WHERE Id=@old;
 SELECT @interest=SUM(e.Amount) FROM swiftFin_JournalEntries e JOIN swiftFin_Journals j ON j.Id=e.JournalId JOIN swiftFin_LoanRepaymentPlans p ON p.Id=@old WHERE e.CustomerAccountId=p.CustomerAccountId AND e.ChartOfAccountId=p.InterestReceivableChartOfAccountId AND e.ContraChartOfAccountId=p.InterestChargedChartOfAccountId AND (j.Id=@journal OR j.ParentId=@journal);
 INSERT swiftFin_LoanRepaymentInstalments(Id,PlanId,Number,DueDate,Principal,SequentialId,CreatedBy,CreatedDate,Interest,InterestDueDate)
 SELECT NEWID(),@new,Number,DATEADD(day,@shift,DueDate),Principal,NEWID(),@marker,SYSUTCDATETIME(),
 CASE WHEN @case=10 THEN @interest ELSE Interest END,
 CASE WHEN @case=9 THEN InterestDueDate WHEN InterestDueDate IS NOT NULL THEN @disb ELSE NULL END
 FROM swiftFin_LoanRepaymentInstalments WHERE PlanId=@old;
 IF EXISTS(SELECT j.Id FROM swiftFin_Journals j JOIN swiftFin_JournalEntries e ON e.JournalId=j.Id WHERE j.Id=@journal OR j.ParentId=@journal GROUP BY j.Id HAVING SUM(e.Amount)<>0) THROW 50002,'Unbalanced journal',1;
 FETCH NEXT FROM fixtures INTO @case,@anchor,@days;
END
CLOSE fixtures; DEALLOCATE fixtures;
IF (SELECT COUNT(*) FROM swiftFin_LoanRepaymentPlans WHERE CreatedBy=@marker)<>3 THROW 50003,'Expected exactly three fixture plans',1;
"@
[void]$cmd.ExecuteNonQuery();$tx.Commit();Write-Output "Seeded three schedule revisions. Before-change snapshot: $backup"
} catch {$tx.Rollback();throw} finally {$connection.Close()}