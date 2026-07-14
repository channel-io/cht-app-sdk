# Hook Extension

Use the hook extension when AppStore or Desk should call your app on lifecycle events.

## Required Function

- `extension.hook.metadata.getHooks`

Hook handlers themselves are plain app functions referenced by `actionFunctionName`.

## Supported Hook Types

Current SDK schema supports:

- `app.installed`
- `app.uninstalled`
- `command.toggle`
- `config.saved`
- `config.deleted`
- `widget.installed`
- `widget.uninstalled`

Widget hooks must include a `targetId` that matches the widget name. App,
command, and config hooks must not include a `targetId`.

## Registration

Hooks register through:

- `registerExtension("hook", "v1")`

AppStore currently backs this with app-level install, command toggle, config
lifecycle, and widget installation hook registrations.

## Good Fit

Use hooks for:

- app bootstrap and cleanup
- syncing external resources when the app is installed
- reacting to config save and delete lifecycle events
- reacting to command enable/disable
- provisioning resources when a specific widget is installed
