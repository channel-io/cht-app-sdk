# Widget Extension

Use the widget extension when your app should add UI into Desk or front widget surfaces.

## Required Pieces

- `extension.widget.metadata.getWidgets`
- one plain app function per widget `actionFunctionName`

## Registration

SDK registration is still generic:

- `registerExtension("widget", "v1")`

AppStore also uses widget-specific registration and install-hook claims internally, but SDK app code usually only needs the generic registration call.

## Action Result

The most common widget action result is a WAM payload:

```ts
{
  type: "wam",
  attributes: {
    appId: process.env.APP_ID,
    name: "my-widget",
    wamArgs: { ... },
  },
}
```

Desk snippet widgets follow a different metadata shape and are not the main path documented here.

## Related Hook Types

If you need post-install behavior for widgets, pair the widget extension with the hook extension and add:

- `widget.installed`
- `widget.uninstalled`
