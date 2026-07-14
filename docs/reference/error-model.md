# Error Model

SDK functions return a `FunctionError` inside the response envelope instead of
raising transport errors for expected app-level failures.

Common codes:

- `1`: unprocessable entity
- `2`: bad request or invalid params
- `3`: not found
- `4`: unauthorized
- `-32601`: method not found
- `-32603`: internal error

Use stable `type` values such as `invalidParams`, `notFound`, or
`duplicateFunction` so callers can handle failures without parsing messages.
Messages should be human-readable. `data` is optional structured JSON for
debugging or field-level validation details.
