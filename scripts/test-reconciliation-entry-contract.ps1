$ErrorActionPreference='Stop'
$apiBin=(Resolve-Path '../SwiftFinancialz2/WebApplication1/bin').Path
$refs=@('WebApplication1','Application.MainBoundedContext.DTO','Application.Seedwork','Newtonsoft.Json') | ForEach-Object { '/reference:'+(Join-Path $apiBin ($_+'.dll')) }
& 'C:/Program Files/Microsoft Visual Studio/18/Community/MSBuild/Current/Bin/Roslyn/csc.exe' /nologo /debug /optimize- /out:tmp/ReconciliationEntryContract.exe /reference:System.ComponentModel.DataAnnotations.dll @refs scripts/fixtures/ReconciliationEntryContract.cs
if($LASTEXITCODE -ne 0){throw 'Contract test compilation failed.'}
& ./tmp/ReconciliationEntryContract.exe $apiBin
if($LASTEXITCODE -ne 0){throw 'Contract test failed.'}
