"use server";

import {
  buildStrategyConfiguration,
  parseUserConfigOptions,
} from "@/util/strategies/configuration";
import { postStrategy } from "@/util/strategies/postStrategy";
import { redirect } from "next/navigation";

export async function createStrategy(formData: FormData) {
  const strategyName = formData.get("strategyName");
  const strategyDescription = formData.get("strategyDescription");
  const strategyIsPublic = formData.get("strategyIsPublic") === "on";

  const strategyCode = formData.get("strategyCode");
  const strategyConfig = formData.get("strategyConfig");

  if (typeof strategyName !== "string" || !strategyName.trim()) {
    throw new Error("Strategy name is required.");
  }

  const descriptionText =
    typeof strategyDescription === "string" ? strategyDescription : "";

  const codeFile =
    strategyCode instanceof File && strategyCode.size > 0
      ? strategyCode
      : null;

  const configFile =
    strategyConfig instanceof File && strategyConfig.size > 0
      ? strategyConfig
      : null;

  const codeText = codeFile ? await codeFile.text() : "";
  const configText = configFile ? await configFile.text() : "";
  const parsedConfig = configText ? parseUserConfigOptions(configText) : [];
  const finalConfig = JSON.stringify(
    buildStrategyConfiguration(parsedConfig)
  );

  console.log("Recieved request for saving a new strategy: ");
  console.log({
    strategyName,
    strategyDescription,
    strategyIsPublic,
    codeText,
    configText: finalConfig,
  });

  const { error } = await postStrategy({
    name: strategyName,
    description: descriptionText,
    isPublic: strategyIsPublic,
    strategyCode: codeText,
    configurationOptions: finalConfig,
  });

  if (error) {
    throw new Error(error);
  }

  redirect("/strategies/");
}
