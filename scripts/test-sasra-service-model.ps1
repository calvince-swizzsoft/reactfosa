$ErrorActionPreference='Stop'
$backend=Join-Path $PSScriptRoot '../../SwiftFinancialz2'
[xml]$project=Get-Content (Join-Path $backend 'SwiftFinancials.WindowsService/SwiftFinancials.WindowsService.csproj')
$refs=$project.SelectNodes('//*[local-name()="ProjectReference"]')
if(-not ($refs | Where-Object {$_.Include -eq '..\Infrastructure.Data.MainBoundedContext\Infrastructure.Data.MainBoundedContext.csproj'})){throw 'Windows Service must directly reference the EF infrastructure project.'}
foreach($assembly in @('Infrastructure.Data.MainBoundedContext.dll','Domain.MainBoundedContext.dll')){
 $hashes=@(foreach($output in @('WebApplication1/bin','SwiftFinancials.Utility/bin/Debug','SwiftFinancials.WindowsService/bin/Debug')){(Get-FileHash (Join-Path $backend "$output/$assembly") -Algorithm SHA256).Hash})
 if(@($hashes | Select-Object -Unique).Count -ne 1){throw "$assembly differs between API, Utility and Windows Service. Rebuild all three in Debug before startup."}
}
Write-Output 'PASS: Windows Service references the EF model and all three Debug application outputs contain matching domain/infrastructure assemblies.'
