# Frontend API Error Handling

## Scope

Apply this strategy only to screens reachable through active routes in `src/App.jsx` and to the components and API modules those screens import.

Do not migrate commented routes, `old*` pages, prototypes, TODO files, or unreachable legacy components.

## Shared request flow

Use `apiJson()` from `src/lib/api.js` for normal JSON requests. Use `apiFetch()` plus `readApiResponse()` only when the caller needs the raw response, such as a file download.

The shared client must:

1. Attach the bearer token.
2. Parse JSON, text, and empty responses safely.
3. Convert failed responses into `ApiError`.
4. Preserve `status`, `code`, `message`, `correlationId`, and `validationErrors`.
5. Clear the session and redirect to login on `401`.
6. Never show raw response bodies, exception objects, stack traces, or internal server details.

Login uses `readApiResponse()` directly because no token exists yet.

## UI behaviour

| Response | Behaviour |
|---|---|
| `400` | Show the safe message and field validation errors. |
| `401` | Clear the session and redirect to login. |
| `403` | Explain that the user lacks permission. |
| `404` | Use the screen's empty or not-found state when appropriate. |
| `409` | Show the business conflict and do not retry automatically. |
| `429` | Ask the user to wait and prevent repeated submission. |
| `502`–`504` | Show a temporary-service message and allow a deliberate retry. |
| Other `5xx` | Show a generic message and the correlation ID for support. |
| Network failure | Explain that the server could not be reached. |
| Aborted request | Ignore it; do not display an alert. |

Pages may provide a clearer fallback message, but the server's safe message takes precedence.

## Display rules

- Use the existing page feedback pattern, normally SweetAlert2.
- Display the correlation ID as `Reference: <id>` when present.
- Do not infer success from HTTP `200` alone when a legacy body contains `success: false`.
- Disable a submitting action until its request completes.
- Do not automatically retry writes or financial transactions.
- A retry button is acceptable for read requests and temporary dependency failures.

## Migration order

1. Authentication and application bootstrap.
2. Administration and workflow.
3. Accounts and batch procedures.
4. Front Office transactions.
5. Back Office loans.
6. Registry and Human Resources.
7. Messaging, Control, and Reports.

Each migrated active screen must use the shared parser and retain its existing success, empty, and business-validation behaviour.
