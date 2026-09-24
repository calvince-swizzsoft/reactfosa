param([Parameter(Mandatory=$true)][string]$BackendConfig,[Parameter(Mandatory=$true)][string]$Executable)
$ErrorActionPreference='Stop'
$source=[xml](Get-Content -LiteralPath $BackendConfig -Raw)
$destination=$Executable+'.config'
$runtime=[xml](Get-Content -LiteralPath $destination -Raw)
$sections=$runtime.configuration.configSections
if(-not $sections){$sections=$runtime.CreateElement('configSections');[void]$runtime.configuration.PrependChild($sections)}
foreach($name in @('serviceBrokerConfiguration','entityFramework')){
  if(-not ($sections.section | Where-Object name -eq $name)){
    $definition=$source.configuration.configSections.section | Where-Object name -eq $name
    if(-not $definition){throw "Missing configuration section: $name"}
    [void]$sections.AppendChild($runtime.ImportNode($definition,$true))
  }
}
$existing=$runtime.configuration.serviceBrokerConfiguration
if($existing){[void]$runtime.configuration.RemoveChild($existing)}
[void]$runtime.configuration.AppendChild($runtime.ImportNode($source.configuration.serviceBrokerConfiguration,$true))
$ef=$runtime.configuration.entityFramework
if(-not $ef){$ef=$runtime.CreateElement('entityFramework');[void]$runtime.configuration.AppendChild($ef)}
$ef.SetAttribute('codeConfigurationType','Program+NoMigrations, Tenhos.Import')
$runtime.Save([IO.Path]::GetFullPath($destination))
# Contains runtime settings: stays under ignored bin/, never copied into research artifacts.
Write-Output 'Prepared isolated runtime configuration with migrations disabled and existing audit queues retained.'
