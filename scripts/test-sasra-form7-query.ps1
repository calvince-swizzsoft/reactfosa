$ErrorActionPreference='Stop'
[xml]$config=Get-Content '../SwiftFinancialz2/WebApplication1/Web.config'
$connection=[System.Data.SqlClient.SqlConnection]::new(($config.configuration.connectionStrings.add|Where-Object name -eq 'SwiftFin_Dev').connectionString)
try{
 $connection.Open();$command=$connection.CreateCommand()
 $source=Get-Content '../SwiftFinancialz2/Application.MainBoundedContext/AccountsModule/Services/SasraSetupAppService.Form7.cs' -Raw
 $sql=($source -split 'public const string Form7BalancesSql=@"',2)[1].Split(@('";'),[StringSplitOptions]::None)[0]
 $sql=$sql.Replace('dbo.swiftFin_JournalEntries','TestEntries').Replace('dbo.swiftFin_Journals','TestJournals').Replace('dbo.swiftFin_ChartOfAccounts','TestAccounts')
 $fixture=@'
WITH TestAccounts AS (
 SELECT Id,AccountType,AccountCode,AccountName FROM (VALUES
 (1,4000,4001,N'Income'),(2,5000,5001,N'Expense'),(3,1000,1001,N'Cash')) x(Id,AccountType,AccountCode,AccountName)
), TestJournals AS (
 SELECT Id,TransactionCode,CAST(ValueDate AS datetime2) ValueDate,CAST(CreatedDate AS datetime2) CreatedDate FROM (VALUES
 (1,5,'2025-12-31T23:59:59','2026-01-05'),
 (2,5,'2026-01-01T00:00:00','2026-01-01'),
 (3,5,'2026-12-31T23:59:59.9999999','2026-12-31'),
 (4,5,'2027-01-01T00:00:00','2026-12-31'),
 (5,5,NULL,'2026-06-01'),
 (6,15,'2026-12-31','2026-12-31'),
 (7,5,NULL,'2026-06-02')) x(Id,TransactionCode,ValueDate,CreatedDate)
), TestEntries AS (
 SELECT JournalId,ChartOfAccountId,CAST(Amount AS decimal(18,2)) Amount FROM (VALUES
 (1,1,-999),(2,1,-100),(2,2,30),(2,3,70),
 (3,1,-50),(3,2,10),(3,3,40),(4,1,-999),
 (5,1,-25),(5,3,25),(6,1,175),(6,2,-40),
 (7,1,5),(7,3,-5)) x(JournalId,ChartOfAccountId,Amount)
)
'@
 $command.CommandText=$fixture+$sql
 [void]$command.Parameters.AddWithValue('@Start',[datetime]'2026-01-01')
 [void]$command.Parameters.AddWithValue('@End',[datetime]'2027-01-01')
 [void]$command.Parameters.AddWithValue('@Closing',15)
 $table=[System.Data.DataTable]::new();$table.Load($command.ExecuteReader())
 if($table.Rows.Count -ne 2){throw 'Expected only income and expense accounts.'}
 $income=@($table.Rows|Where-Object AccountType -eq 4000)[0];$expense=@($table.Rows|Where-Object AccountType -eq 5000)[0]
 if($income.Balance -ne -170 -or $income.ClosingBalance -ne 175 -or $expense.Balance -ne 40 -or $expense.ClosingBalance -ne -40){throw 'Form 7 date/closing calculation mismatch.'}
 Write-Output 'PASS: real Form 7 SQL excludes prior/next years, includes the full last day, honors value date, falls back to created date, nets ordinary reversals and separates closing transfers. No database writes.'
}finally{$connection.Dispose()}
