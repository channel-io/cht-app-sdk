import type { ExtensionDefinition, RegisteredExtension } from "../types/extension.js";
import type { FunctionDefinition, RegisteredFunction } from "../types/function.js";
import { createRegisteredFunction } from "./function.js";

/**
 * Register an extension and extract all functions
 * @internal
 */
export function registerExtension(
  definition: ExtensionDefinition
): RegisteredExtension & { functions: RegisteredFunction[] } {
  const groups = new Map<string, Map<string, FunctionDefinition>>();
  const functions: RegisteredFunction[] = [];

  for (const [groupName, group] of Object.entries(definition.groups)) {
    const functionMap = new Map<string, FunctionDefinition>();

    for (const [funcName, funcDef] of Object.entries(group)) {
      // Skip _config property
      if (funcName === "_config") continue;

      const funcDefinition = funcDef as FunctionDefinition;
      functionMap.set(funcName, funcDefinition);

      // Create full function name: {groupName}.{functionName}
      const fullName = `${groupName}.${funcName}`;
      const registered = createRegisteredFunction(fullName, funcDefinition);
      functions.push(registered);
    }

    groups.set(groupName, functionMap);
  }

  return {
    name: definition.name,
    systemVersion: definition.systemVersion ?? "v1",
    exclusive: definition.exclusive ?? false,
    groups,
    functions,
  };
}

/**
 * Get the full method name including extension prefix
 * Used for matching incoming requests
 */
export function getFullMethodName(extensionName: string, functionName: string): string {
  return `extension.${extensionName}.${functionName}`;
}
