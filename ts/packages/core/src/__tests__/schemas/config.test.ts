import { describe, expect, it } from "vitest";
import {
  ConfigDraftResolutionParamsSchema,
  ConfigDraftResolutionOutputSchema,
  GetConfigSchemaOutputSchema,
  ValidateStoredConfigOutputSchema,
} from "../../extensions/index.js";

describe("config extension schema", () => {
  it("preserves dynamic multi-config metadata", () => {
    const parsed = GetConfigSchemaOutputSchema.parse({
      schemaVersion: "v1",
      configScope: "channel",
      providerName: "Example Provider",
      supportsMultiple: true,
      keyResolverFunctionName: "config.resolveKey",
      blocks: [{ type: "text", key: "type", label: "Type" }],
    });

    expect(parsed.supportsMultiple).toBe(true);
    expect(parsed.keyResolverFunctionName).toBe("config.resolveKey");
  });

  it("accepts layout-aware grouped config fields", () => {
    const parsed = GetConfigSchemaOutputSchema.parse({
      schemaVersion: "v1",
      configScope: "channel",
      providerName: "Cafe24 Hub",
      title: "Cafe24 setup",
      oauth: {
        additionalParams: [{ name: "domain", fieldKey: "commerceDomain" }],
      },
      hooks: {
        draftResolverFunctionName: "cafe24.config.resolveDraft",
        validateFunctionName: "cafe24.config.validate",
      },
      blocks: [
        {
          type: "section",
          id: "wms-settings",
          title: "WMS settings",
          description: "Configure the provider before enabling task flows.",
          visibleWhen: [
            {
              fieldKey: "wmsType",
              operator: "exists",
            },
          ],
        },
        {
          type: "group",
          title: "Connection",
          layout: "row",
          visibleWhen: [
            {
              fieldKey: "wmsType",
              operator: "ne",
              value: "none",
            },
          ],
          fields: [
            {
              type: "select",
              key: "wmsType",
              label: "WMS type",
              required: true,
              choices: [
                { label: "Acme Commerce", value: "acme-commerce" },
                { label: "Doortodoor", value: "doortodoor" },
              ],
            },
            {
              type: "phone",
              key: "supportPhone",
              label: "Support phone",
              helperText:
                "Need a format guide? Check {guide} before saving.\nInternational format is recommended.",
              helperLinks: [
                {
                  key: "guide",
                  label: "the guide",
                  url: "https://example.com/guide",
                },
              ],
              fieldLabels: {
                countryCode: "Country code",
                number: "Phone number",
              },
            },
            {
              type: "multiselect",
              key: "claimTypes",
              label: "Claim types",
              choices: [
                { label: "Cancel", value: "cancel" },
                { label: "Return", value: "return" },
              ],
            },
            {
              type: "address",
              key: "returnAddress",
              label: "Return address",
              searchEnabled: true,
              fieldLabels: {
                recipient: "Recipient",
                countryCode: "Country code",
                phone: "Phone",
                postcode: "Postcode",
                address1: "Address line 1",
                address2: "Address line 2",
              },
            },
            {
              type: "image",
              key: "otpQrImage",
              label: "OTP QR image",
              storageClass: "transient",
              accept: ["image/*"],
              maxFileSizeMb: 2,
              resolvesTo: {
                key: "otpSecret",
                storageClass: "credential",
                sensitive: true,
                maskType: "full",
              },
            },
            {
              type: "image",
              key: "brandLogo",
              label: "Brand logo",
              storageClass: "media",
              media: { visibility: "public" },
              accept: ["image/png", "image/jpeg"],
              maxFileSizeMb: 5,
            },
          ],
        },
        {
          type: "description",
          text: "Complete the setup and save to continue.",
          helperLinks: [
            {
              key: "setup",
              label: "setup guide",
              url: "/relative/setup-guide",
            },
          ],
          visibleWhen: [
            {
              fieldKey: "claimTypes",
              operator: "exists",
            },
          ],
        },
      ],
    });

    expect(parsed.blocks).toHaveLength(3);
    expect(parsed.oauth?.additionalParams?.[0]).toEqual({
      name: "domain",
      fieldKey: "commerceDomain",
    });
    expect(parsed.hooks?.draftResolverFunctionName).toBe("cafe24.config.resolveDraft");
    if (parsed.blocks[1]?.type === "group") {
      const group = parsed.blocks[1];
      const otpQrImage = group.fields.find((field) => field.key === "otpQrImage");
      const brandLogo = group.fields.find((field) => field.key === "brandLogo");

      expect(group.fields[1]?.helperLinks?.[0]?.key).toBe("guide");
      expect(group.visibleWhen?.[0]?.fieldKey).toBe("wmsType");
      expect(otpQrImage?.type).toBe("image");
      expect(otpQrImage?.storageClass).toBe("transient");
      expect(otpQrImage?.accept).toEqual(["image/*"]);
      expect(otpQrImage?.maxFileSizeMb).toBe(2);
      expect(otpQrImage?.resolvesTo?.key).toBe("otpSecret");
      expect(otpQrImage?.resolvesTo?.storageClass).toBe("credential");
      expect(otpQrImage?.resolvesTo?.sensitive).toBe(true);
      expect(otpQrImage?.resolvesTo?.maskType).toBe("full");
      expect(brandLogo?.type).toBe("image");
      expect(brandLogo?.storageClass).toBe("media");
      expect(brandLogo?.media?.visibility).toBe("public");
      expect(brandLogo?.accept).toEqual(["image/png", "image/jpeg"]);
      expect(brandLogo?.maxFileSizeMb).toBe(5);
    }
    if (parsed.blocks[2]?.type === "description") {
      expect(parsed.blocks[2].helperLinks?.[0]?.url).toBe("/relative/setup-guide");
    }
  });

  it("accepts draft resolution output", () => {
    const parsed = ConfigDraftResolutionOutputSchema.parse({
      valuesPatch: {
        appWmsType: "none",
        "shippingDateOptions.allowPartial": false,
      },
      choicesPatch: {
        appWmsType: [
          {
            label: "Sabangnet",
            value: "cht-app-sabangnet",
          },
        ],
      },
    });

    expect(parsed.valuesPatch?.appWmsType).toBe("none");
    expect(parsed.choicesPatch?.appWmsType?.[0]?.label).toBe("Sabangnet");
  });

  it("accepts select choices loaded from an app function", () => {
    const parsed = GetConfigSchemaOutputSchema.parse({
      schemaVersion: "v1",
      configScope: "channel",
      providerName: "Naver SmartStore",
      blocks: [
        {
          type: "select",
          key: "selectedWmsAppId",
          label: "WMS",
          choicesSource: {
            type: "function",
            functionName: "extension.config.choices.getWmsChoices",
            params: {
              commerceType: "appNaverSmartStore",
              includeNone: true,
            },
            triggerOnLoad: true,
          },
        },
      ],
    });

    if (parsed.blocks[0]?.type === "select") {
      expect(parsed.blocks[0].choices).toBeUndefined();
      expect(parsed.blocks[0].choicesSource?.type).toBe("function");
      expect(parsed.blocks[0].choicesSource?.functionName).toBe(
        "extension.config.choices.getWmsChoices"
      );
    }
  });

  it("accepts select choices loaded from a native function", () => {
    const parsed = GetConfigSchemaOutputSchema.parse({
      schemaVersion: "v1",
      configScope: "channel",
      providerName: "Naver SmartStore",
      blocks: [
        {
          type: "select",
          key: "selectedWmsAppId",
          label: "WMS",
          choicesSource: {
            type: "nativeFunction",
            functionName: "getConfigWMSChoices",
            params: {
              commerceType: "appNaverSmartStore",
              includeNone: true,
            },
            triggerOnLoad: true,
          },
        },
      ],
    });

    if (parsed.blocks[0]?.type === "select") {
      expect(parsed.blocks[0].choices).toBeUndefined();
      expect(parsed.blocks[0].choicesSource?.functionName).toBe("getConfigWMSChoices");
    }
  });

  it("accepts draft resolution params", () => {
    const parsed = ConfigDraftResolutionParamsSchema.parse({
      scope: "channel",
      channelId: "channel-123",
      changedFieldKey: "appWmsType",
      changedValue: "none",
      values: {
        appWmsType: "none",
      },
    });

    expect(parsed.changedFieldKey).toBe("appWmsType");
    expect(parsed.values.appWmsType).toBe("none");
  });

  it("accepts config validation feedback", () => {
    const parsed = ValidateStoredConfigOutputSchema.parse({
      valid: false,
      reasonCode: "MISSING_REQUIRED_FIELDS",
      message: "Some required fields are missing.",
      missingFields: ["storeId"],
      errors: [
        {
          fieldKey: "storeId",
          reasonCode: "REQUIRED",
          message: "Store ID is required.",
        },
      ],
      notices: [
        {
          tone: "warning",
          title: "WMS 확인 필요",
          message: "WMS 기본 설정을 먼저 저장해주세요.",
          placement: "block",
          blockId: "wms-settings",
        },
      ],
    });

    expect(parsed.valid).toBe(false);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.notices?.[0]?.blockId).toBe("wms-settings");
  });
});
