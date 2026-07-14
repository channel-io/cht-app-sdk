# Custom Tab Extension

Use the custom tab extension when your app should add a persistent Desk tab.

## Required Pieces

- `extension.customtab.metadata.getCustomTabs`
- one plain app function per tab `actionFunctionName`

## Registration

Register through:

- `registerExtension("customtab", "v1")`

AppStore maps this to custom-tab registration under the hood.

## Runtime Shape

Custom tab action functions usually return a WAM payload, so the tab content is just another WAM app with tab-specific `wamArgs`.

## Good Fit

Choose custom tabs when:

- the surface should always be available in Desk
- the experience is larger than a command result
- the workflow needs long-lived state or navigation
