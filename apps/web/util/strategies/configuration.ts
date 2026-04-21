import { Requirements } from "@/components/Input/Form/Form";
import { symbols } from "@/util/symbols";

export const UNIVERSE_CONFIG_ID = "universe";

export type ConfigOption = {
  id: string;
  label: string;
  type: "number" | "boolean" | "select" | "string" | "multi-select";
  options?: string[];
  defaultValue?: string | number | boolean | string[];
  required?: boolean;
};

export type ConfigOptions = ConfigOption[];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function createUniverseConfigOption(): ConfigOption {
  return {
    id: UNIVERSE_CONFIG_ID,
    label: "Universe",
    type: "multi-select",
    options: [...symbols],
    defaultValue: [...symbols],
  };
}

export function isConfigOption(value: unknown): value is ConfigOption {
  if (!value || typeof value !== "object") return false;

  const option = value as Record<string, unknown>;

  const validType =
    option.type === "number" ||
    option.type === "boolean" ||
    option.type === "select" ||
    option.type === "string" ||
    option.type === "multi-select";

  const validOptions =
    option.options === undefined ||
    (Array.isArray(option.options) &&
      option.options.every((item) => typeof item === "string"));

  const validDefaultValue =
    option.defaultValue === undefined
      ? true
      : option.type === "multi-select"
        ? isStringArray(option.defaultValue)
        : typeof option.defaultValue === "string" ||
          typeof option.defaultValue === "number" ||
          typeof option.defaultValue === "boolean";

  const validRequired =
    option.required === undefined || typeof option.required === "boolean";

  return (
    typeof option.id === "string" &&
    option.id.trim().length > 0 &&
    typeof option.label === "string" &&
    validType &&
    validOptions &&
    validDefaultValue &&
    validRequired
  );
}

export function isConfigOptions(value: unknown): value is ConfigOptions {
  return Array.isArray(value) && value.every(isConfigOption);
}

function hasReservedConfigId(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some(
      (item) =>
        item &&
        typeof item === "object" &&
        "id" in item &&
        item.id === UNIVERSE_CONFIG_ID
    )
  );
}

export function parseUserConfigOptions(configText: string): ConfigOptions {
  const parsedConfig: unknown = JSON.parse(configText);

  if (hasReservedConfigId(parsedConfig)) {
    throw new Error(
      `Configuration option id "${UNIVERSE_CONFIG_ID}" is reserved.`
    );
  }

  if (!isConfigOptions(parsedConfig)) {
    throw new Error("Invalid configuration file structure.");
  }

  return parsedConfig;
}

export function buildStrategyConfiguration(
  configOptions: ConfigOptions = []
): ConfigOptions {
  return [createUniverseConfigOption(), ...configOptions];
}

export function parseStrategyRequirements(text: string): Requirements {
  const parsed = JSON.parse(text);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid requirements structure.");
  }

  return parsed;
}