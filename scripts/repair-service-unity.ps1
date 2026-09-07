& {
    $ErrorActionPreference = 'Stop'
    $folder = 'C:\swiftfin\windows-service'
    $configPath = Join-Path $folder 'SwiftFinancials.WindowsService.exe.config'
    $dllPath = Join-Path $folder 'Unity.Container.dll'
    $stage = Join-Path $env:TEMP ('SwiftFinUnity-' + [guid]::NewGuid().ToString('N'))
    [void](New-Item -ItemType Directory -Path $stage)
    $previousTls = [Net.ServicePointManager]::SecurityProtocol
    try {
        [Net.ServicePointManager]::SecurityProtocol = $previousTls -bor [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -UseBasicParsing -Uri 'https://api.nuget.org/v3-flatcontainer/unity.container/5.8.13/unity.container.5.8.13.nupkg' -OutFile (Join-Path $stage 'package.zip')
    } finally {
        [Net.ServicePointManager]::SecurityProtocol = $previousTls
    }
    Expand-Archive -LiteralPath (Join-Path $stage 'package.zip') -DestinationPath (Join-Path $stage 'package')
    $replacement = Join-Path $stage 'package\lib\net47\Unity.Container.dll'
    $identity = [Reflection.AssemblyName]::GetAssemblyName($replacement)
    if ($identity.FullName -ne 'Unity.Container, Version=5.8.13.0, Culture=neutral, PublicKeyToken=489b6accfaf20ef0') {
        throw 'Downloaded assembly identity differs from the required version. Service untouched.'
    }
    $xml = New-Object System.Xml.XmlDocument
    $xml.PreserveWhitespace = $true
    $xml.Load($configPath)
    $runtime = $xml.SelectSingleNode('/configuration/runtime')
    if ($null -eq $runtime) { $runtime = $xml.DocumentElement.AppendChild($xml.CreateElement('runtime')) }
    $ns = 'urn:schemas-microsoft-com:asm.v1'
    $binding = $runtime.SelectSingleNode("*[local-name()='assemblyBinding' and namespace-uri()='$ns' and not(@appliesTo)]")
    if ($null -eq $binding) { $binding = $runtime.AppendChild($xml.CreateElement('assemblyBinding', $ns)) }
    $old = $runtime.SelectNodes(".//*[local-name()='dependentAssembly'][*[local-name()='assemblyIdentity' and @name='Unity.Container']]")
    foreach ($node in $old) { [void]$node.ParentNode.RemoveChild($node) }
    $fragment = $xml.CreateDocumentFragment()
    $fragment.InnerXml = '<dependentAssembly xmlns="urn:schemas-microsoft-com:asm.v1"><assemblyIdentity name="Unity.Container" publicKeyToken="489b6accfaf20ef0" culture="neutral" /><bindingRedirect oldVersion="0.0.0.0-5.8.13.0" newVersion="5.8.13.0" /></dependentAssembly>'
    [void]$binding.AppendChild($fragment)
    $preparedConfig = Join-Path $stage 'service.config'
    $xml.Save($preparedConfig)
    $backup = 'C:\swiftfin\service-backups\unity-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
    [void](New-Item -ItemType Directory -Path $backup)
    Copy-Item -LiteralPath $dllPath -Destination (Join-Path $backup 'Unity.Container.dll')
    Copy-Item -LiteralPath $configPath -Destination (Join-Path $backup 'SwiftFinancials.WindowsService.exe.config')
    Write-Host "Backup: $backup"
    Stop-Service -Name 'SwiftFinancialsService'
    try {
        Copy-Item -LiteralPath $replacement -Destination $dllPath -Force
        Copy-Item -LiteralPath $preparedConfig -Destination $configPath -Force
        Start-Service -Name 'SwiftFinancialsService'
        Write-Host 'Unity.Container 5.8.13.0 installed with its binding redirect. Service started; queue processing still needs verification.'
    } catch {
        $repairError = $_
        Copy-Item -LiteralPath (Join-Path $backup 'Unity.Container.dll') -Destination $dllPath -Force
        Copy-Item -LiteralPath (Join-Path $backup 'SwiftFinancials.WindowsService.exe.config') -Destination $configPath -Force
        Start-Service -Name 'SwiftFinancialsService'
        throw $repairError
    }
}
