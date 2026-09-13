# SOFP mapping recovery — 12 September 2026

Recovered the latest complete surviving SOFP template tree, root `32df3176-59ae-f111-b32d-c8e2651ef92d`, created at database-local 04:24:29.35. Its 51 report lines and 19 account entries were matched against the embedded Form 6 definition by spreadsheet cell and exact trimmed description. The older complete tree had 18 entries; it was not merged into or substituted for the newer tree.

The existing SasraSetupAppService saved the recovered mappings as Form 6 `WORKBOOK-CD81FC5DAAD8`, revision 1, version ID `b329b203-6cae-f111-b32d-c8e2651ef92d`. This is a new revision sequence because the former SASRA version records were lost. All line/account pairs were read back and compared. The source tree and all 19 original entries remain intact. No G/L account or journal was modified. Automatic database initialization was disabled in the recovery runner; no migration or schema SQL was run.

The profile singleton was also absent. The previously verified values (Swizz Sacco, DT, Swizz001) were restored through SaveProfile because the existing SaveVersion service requires matching institution settings. This does not add institution settings back to the report-list UI.

Recovered account mappings:

| Cell | Account codes |
|---|---|
| C11 | 1002, 1011 |
| C12 | 1001 |
| C14 | 1003, 1005, 1006 |
| C23 | 1004 |
| C33 | 1007, 1008 |
| C42 | 2001 |
| C43 | 2007 |
| C44 | 2009 |
| C52 | 2004, 2005, 2006, 2008, 2010 |
| C57 | 2002 |
| C61 | 3001 |

Preview verification used financial-year start 1 January 2026 and as-at 12 September 2026. Underlying ledger difference was zero. Assets less liabilities/equity differed by KSh 5,000. Account 2011, Teller Shortage Account, is currently an asset (1000), has a credit balance of KSh 5,000, and was absent from the surviving mappings. It remains unmapped; reconstruction did not infer new accounting treatment. Excel export remains blocked by this data issue.

## Follow-up after another restart

The investigation resumed after another loss. SQL trace recorded process 25572 dropping the profile table at 06:41:09 and IIS Express process 27584 recreating it at 06:43:49. The business migration configuration now keeps automatic migrations enabled but sets `AutomaticMigrationDataLossAllowed = false`. API and Utility were rebuilt in Debug, and their domain/infrastructure DLL hashes match. Existing older Release or separately deployed binaries remain outside this protection until updated.

The same 19 SOFP mappings were recovered again, under version ID `c1251bc4-6dae-f111-b32d-c8e2651ef92d`, revision 1. Two independent processes using the normal EF automatic initializer preserved that exact revision and the institution record. All 1,109 backend assertions passed, including migration-policy checks. The KSh 5,000 unmapped-account issue remains unchanged.

## Responsible process identified

A further deletion at 06:53:14 was traced to PID 3900, `SwiftFinancials.WindowsService.exe`; IIS Express PID 27596 recreated the empty tables at 06:54:34. The Windows Service Debug infrastructure DLL lacked SASRA entities (SHA-256 prefix `d160b14b7157`) while the API DLL contained them (`b65baabf9904`). MSBuild identified the live service and Visual Studio debugger as locking `SwiftFinancials.WindowsService/bin/Debug` files. Rebuilding API and Utility alone was insufficient: the Windows Service must also be rebuilt and restarted with the current model. Its attempted build was blocked by those locks, so this record does not claim the latest recovery still exists or that the running service has been updated.

After PID 3900 stopped, an ordinary successful service build still left the outdated infrastructure DLL behind. The Windows Service project lacked a direct reference to Infrastructure.Data.MainBoundedContext, which it resolves at runtime. Added an explicit project reference with copy-local enabled and rebuilt in Debug. Domain and infrastructure DLL hashes now match across Windows Service, Utility and API outputs. A fresh process resolving dependencies from the Windows Service Debug output, using normal EF initialization, preserved the institution and all 19 SOFP mappings and verified the migration data-loss guard is false.

The latest recovered Form 6 revision 1 ID is `40cf31a3-6fae-f111-b32d-c8e2651ef92d`. The service itself was not launched by the agent, so scheduled jobs were not triggered during verification. Restart it from the rebuilt Debug output. The project-reference fix ensures future builds refresh the infrastructure model; separately deployed or old Release binaries still require their own update.
