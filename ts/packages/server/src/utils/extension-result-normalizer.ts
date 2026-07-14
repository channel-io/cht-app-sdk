const DEFAULT_SYSTEM_VERSION = "v1";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function normalizeConfigs<T extends string>(result: unknown, key: T): unknown {
  if (!isRecord(result)) {
    return result;
  }

  const configs = result[key];
  if (!Array.isArray(configs)) {
    return result;
  }

  return {
    ...result,
    [key]: configs.map((config): unknown => {
      if (!isRecord(config) || config["systemVersion"] !== undefined) {
        return config;
      }

      return {
        ...config,
        systemVersion: DEFAULT_SYSTEM_VERSION,
      };
    }),
  };
}

function normalizeFirstMatchingConfigs(result: unknown, keys: string[]): unknown {
  for (const key of keys) {
    const normalized = normalizeConfigs(result, key);
    if (normalized !== result) {
      return normalized;
    }
  }

  return result;
}

export function normalizeExtensionResult(method: string, result: unknown): unknown {
  if (method.endsWith("metadata.getCommands")) {
    return normalizeConfigs(result, "commands");
  }

  if (method.endsWith("metadata.getWidgets") || method.endsWith("widget.getConfig")) {
    return normalizeConfigs(result, "widgets");
  }

  if (method.endsWith("metadata.getCustomTabs") || method.endsWith("customtab.getConfig")) {
    return normalizeFirstMatchingConfigs(result, ["customTabs", "tabs"]);
  }

  if (method.endsWith("metadata.getHooks")) {
    return normalizeConfigs(result, "hooks");
  }

  return result;
}
