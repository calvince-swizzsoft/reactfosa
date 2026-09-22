$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
[xml]$config=Get-Content (Join-Path $root '../SwiftFinancialz2/WebApplication1/Web.config')
$connection=[System.Data.SqlClient.SqlConnection]::new(($config.configuration.connectionStrings.add | Where-Object name -eq 'SwiftFin_Dev').connectionString)
$connection.Open()
function Query([string]$sql){$cmd=$connection.CreateCommand();$cmd.CommandText=$sql;$table=[System.Data.DataTable]::new();$table.Load($cmd.ExecuteReader());return ,$table}