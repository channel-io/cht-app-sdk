# Store Extension

Use the Store Extension to provide localized App Store introduction metadata without hardcoding app-specific copy in App Store.

App Store calls the metadata function during registration or re-registration, validates the result, and persists it. App Store reads the stored effective profile for list and detail queries; it does not call the app function for every customer-facing read.

## Required Function

- `extension.store.metadata.getStoreProfile`

Register the extension through `registerExtension("store", "v1")`.

## Output Contract

The function returns the persisted metadata directly. Do not wrap it in a `profile` field.

```typescript
type StoreProfileMetadata = {
  relatedAppIds: string[];
  i18nMap: {
    ko: StoreProfileLocalizedContent;
    ja: StoreProfileLocalizedContent;
    en: StoreProfileLocalizedContent;
  };
};

type StoreProfileLocalizedContent = {
  images: Array<{ key: string; alt?: string }>;
  intro: {
    helpsWith: string;
    recommendedFor: string;
  };
  faqs: Array<{ question: string; answer: string }>;
};
```

- `relatedAppIds` lists apps that work with this app.
- `images[].key` is the opaque relative key returned by the App Store media upload API. Do not assume a storage prefix or pass an external URL.
- `images[].alt` is limited to 120 characters.
- Intro and FAQ answers support the limited Markdown syntax validated by App Store.
- Use empty arrays or empty strings when App Store Developer GUI should provide a fallback value.

## Helper API

For static metadata, use `createStoreExtension()`.

```typescript
import { createStoreExtension } from "@channel.io/app-sdk-server";

const localizedContent = {
  images: [],
  intro: {
    helpsWith: "Connect order and shipping data to customer support.",
    recommendedFor: "Teams that automate repeated commerce questions.",
  },
  faqs: [
    {
      question: "Do I need a commerce app?",
      answer: "A commerce app is optional but recommended.",
    },
  ],
};

export const storeExtension = createStoreExtension({
  relatedAppIds: ["appCafe24"],
  i18nMap: {
    ko: localizedContent,
    ja: localizedContent,
    en: localizedContent,
  },
});
```

For decorator-based apps, implement the metadata function directly.

```typescript
import {
  Extension,
  Func,
  OutputSchema,
  StoreFunctionNames,
  GetStoreProfileOutputSchema,
  type StoreExtensionInterface,
} from "@channel.io/app-sdk-server";

@Extension({ name: "store", systemVersion: "v1" })
export class MyStoreExtension implements StoreExtensionInterface {
  @Func(StoreFunctionNames.getStoreProfile)
  @OutputSchema(GetStoreProfileOutputSchema)
  async getStoreProfile() {
    const localizedContent = {
      images: [],
      intro: {
        helpsWith: "Connect customer work to Channel Talk.",
        recommendedFor: "Teams that automate repeated customer questions.",
      },
      faqs: [],
    };

    return {
      relatedAppIds: [],
      i18nMap: {
        ko: localizedContent,
        ja: localizedContent,
        en: localizedContent,
      },
    };
  }
}
```

## Migration From the Runtime Profile Contract

The legacy `{ profile: StoreProfile }` response and flattened runtime presentation fields are not accepted by the persisted `store:v1` contract. Move related apps to `relatedAppIds`, localized copy to `intro` and `faqs`, and uploaded media references to `images[].key`.
