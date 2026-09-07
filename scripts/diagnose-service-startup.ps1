& {
    $ErrorActionPreference = 'Stop'
    $serviceFolder = 'C:\swiftfin\windows-service'
    $probeDll = Join-Path $env:TEMP ('SwiftFinProbe-' + [guid]::NewGuid().ToString('N') + '.dll')
    $source = @'
using System;
using System.IO;
using System.Reflection;
using System.Text;
public class SwiftFinStartupProbe : MarshalByRefObject {
    public string Inspect(string folder) {
        var report = new StringBuilder();
        try {
            var assembly = Assembly.LoadFrom(Path.Combine(folder, "SwiftFinancials.WindowsService.exe"));
            var type = assembly.GetType("SwiftFinancials.WindowsService.MainService", true);
            var service = Activator.CreateInstance(type);
            report.AppendLine("Service constructor: OK");
            var factory = type.GetMethod("ConfigureFactories", BindingFlags.Instance | BindingFlags.NonPublic);
            if (factory == null) throw new Exception("Deployed service has no ConfigureFactories method; its build differs from the inspected source.");
            factory.Invoke(service, null);
            report.AppendLine("Logging and scheduler factories: OK");
            var logger = type.GetField("_logger", BindingFlags.Instance | BindingFlags.NonPublic).GetValue(service);
            var pluginType = assembly.GetType("SwiftFinancials.WindowsService.PluginProvider", true);
            var provider = Activator.CreateInstance(pluginType, new object[] { logger });
            pluginType.GetMethod("Initialize").Invoke(provider, null);
            report.AppendLine("Plugin discovery: OK");
            report.AppendLine("Available plugins: " + pluginType.GetProperty("AvailablePlugins").GetValue(provider, null));
        } catch (Exception ex) {
            report.AppendLine("STARTUP PROBE FAILED:");
            report.AppendLine(ex.ToString());
            for (var current = ex; current != null; current = current.InnerException) {
                var loadError = current as ReflectionTypeLoadException;
                if (loadError != null) foreach (var item in loadError.LoaderExceptions)
                    report.AppendLine(item.ToString());
            }
        }
        return report.ToString();
    }
}
'@
    Add-Type -TypeDefinition $source -OutputAssembly $probeDll
    [void][System.Reflection.Assembly]::LoadFrom($probeDll)
    $setup = New-Object System.AppDomainSetup
    $setup.ApplicationBase = $serviceFolder
    $setup.ConfigurationFile = Join-Path $serviceFolder 'SwiftFinancials.WindowsService.exe.config'
    $domain = [AppDomain]::CreateDomain('SwiftFinDiagnostic', $null, $setup)
    try {
        $probe = $domain.CreateInstanceFromAndUnwrap($probeDll, 'SwiftFinStartupProbe')
        $probe.Inspect($serviceFolder)
    } finally {
        [AppDomain]::Unload($domain)
    }
}
