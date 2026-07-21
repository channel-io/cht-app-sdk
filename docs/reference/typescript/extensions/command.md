# Command Extension

Use the command extension when your app should expose slash commands or other desk/front commands.

## Required Pieces

- `extension.command.metadata.getCommands`
- one plain app function for each `actionFunctionName`
- optional autocomplete function for each `autoCompleteFunctionName`

## Recommended Shape

- Extension metadata lives under the `metadata` group
- Runtime handlers can live anywhere as long as the metadata points to the right function name
- Command actions can return text, WAM payloads, or other AppStore action results

## Registration

From SDK code, command registration is still the generic:

- `registerExtension("command", "v1")`

In AppStore, command support also maps to command-specific registration and channel activation actions, but app code normally does not call those directly through this SDK.

## WAM Fit

Commands are often the first place a WAM surface appears.
Your action function can return:

```ts
{
  type: "wam",
  attributes: {
    appId: process.env.APP_ID,
    name: "my-command-panel",
    wamArgs: { ... },
  },
}
```

## Reference

- [examples/basic](../../../../ts/examples/basic/README.md)
