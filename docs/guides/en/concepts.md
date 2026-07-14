# Concepts

## Function

A function is one action that Channel calls on the app server. Each function receives `method`, `params`, and `context`, then returns either `result` or `error`.

## Schema

Functions expose input and output schemas. TypeScript uses Zod. Go uses structs and `json` tags as the default app developer type surface.

## Native Client

The native client calls AppStore native functions from an app server. It covers token issuance, extension registration, and ALF task registration.

## Extension Helper

Extension helpers provide convenient registration APIs for fixed method sets such as WMS.

## Proto

`proto/` is the shared contract source. App developers usually consume the ergonomic SDK APIs instead of generated proto code.
Large shared DTO families, such as messaging, are managed here and surfaced through each language SDK.
