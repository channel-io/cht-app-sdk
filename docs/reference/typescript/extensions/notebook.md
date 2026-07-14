# Notebook Extension

Use the Notebook extension when your app should publish app-managed notebook
definitions to cht-notebook.

## Required Function

- `extension.notebook.core.getNotebooks`

The SDK helper names the function group `core` and the function `getNotebooks`.

```typescript
import { createNotebookExtensionV1 } from "@channel.io/app-sdk-server";

export const notebookExtension = createNotebookExtensionV1({
  getNotebooks: async () => ({
    notebooks: [
      {
        notebookKey: "sales-dashboard",
        version: 1,
        title: "Sales Dashboard",
        initialVisibility: "visible",
        notebook: {
          cells: [
            {
              cellKey: "intro",
              type: "markdown",
              definition: {
                markdown: "# Sales Dashboard",
              },
            },
          ],
        },
      },
    ],
  }),
});
```

## Registration Is Two-Step

Notebook apps normally need both:

1. generic extension registration
   - `registerExtension("notebook", "v1")`
2. notebook sync
   - `registerAppNotebooks(appId, accessToken)`

Use `getAppNotebookVersions(appId, accessToken)` when you need to inspect the
latest synced notebook versions.

AppStore owns extension registration and native function proxying. cht-notebook
owns appNotebook storage, revision history, sync runs, and UI presentation.
