# Tenhos product ledger mappings

Created and verified on 24 September 2026 in the authorized local development database (SwiftFin_Dev, local server). All 14 products remain locked drafts.

56 dedicated ledger accounts replace the original shared mappings. Principal, interest receivable and interest charged follow the existing Asset classification; interest received follows Income/Revenue. Principal and interest charged retain the existing control-account flag. All are postable detail accounts, following the existing flat chart, reconciliation, automatic-posting and cost-centre conventions.

| Product | Principal | Interest receivable | Interest charged | Interest received |
|---|---:|---:|---:|---:|
| TENHOS - Advances [DRAFT] | 1113 | 1114 | 1115 | 4105 |
| TENHOS - Asset Financing Loan [DRAFT] | 1107 | 1108 | 1109 | 4103 |
| TENHOS - Bonus Advance [DRAFT] | 1119 | 1120 | 1121 | 4107 |
| TENHOS - Boresha Elimu (School Fees Loan) [DRAFT] | 1101 | 1102 | 1103 | 4101 |
| TENHOS - Dairy Loan [DRAFT] | 1137 | 1138 | 1139 | 4113 |
| TENHOS - Development Loan [DRAFT] | 1110 | 1111 | 1112 | 4104 |
| TENHOS - Emergency Loan [DRAFT] | 1104 | 1105 | 1106 | 4102 |
| TENHOS - Hospital Check-Off Advance [DRAFT] | 1122 | 1123 | 1124 | 4108 |
| TENHOS - Loan Item Facility [DRAFT] | 1131 | 1132 | 1133 | 4111 |
| TENHOS - Overdraft Facility [DRAFT] | 1128 | 1129 | 1130 | 4110 |
| TENHOS - Special Advance [DRAFT] | 1125 | 1126 | 1127 | 4109 |
| TENHOS - Start-Up Loan [DRAFT] | 1116 | 1117 | 1118 | 4106 |
| TENHOS - Ukulima Loan [DRAFT] | 1140 | 1141 | 1142 | 4114 |
| TENHOS - Vijana Loan [DRAFT] | 1134 | 1135 | 1136 | 4112 |

Verification: all 56 mappings resolve to distinct accounts with the expected names, codes, types and flags; all 14 products remain locked; lending terms, the three original products and all 36 pre-existing ledger accounts are unchanged. No financial transactions or opening balances were posted. A subsequent read-only plan found zero missing accounts.

These are local development accounting mappings following the existing engine conventions, not a claim of an approved Tenhos chart of accounts. Fees, insurance, penalties and BOSA/Ukulima appraisal-product links still require their own confirmed configuration.

Evidence: accounts-result.json contains account IDs and product read-backs. before-account-mapping.json preserves the original configuration. accounts-plan.json records the latest read-only plan. The earlier import-result.json remains the historical initial-draft snapshot.

Importer modes: accounts-inventory (read only), accounts-plan (read only), accounts-apply (creates missing matching accounts and updates mappings). Re-runs reuse matching accounts and skip mappings already correct; code/name conflicts or unlocked products abort. All writes go through the existing AppServices in one serializable scope.
