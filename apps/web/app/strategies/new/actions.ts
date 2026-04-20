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
  const strategyRequirements = formData.get("strategyRequirements");

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

  const requirementsFile =
    strategyRequirements instanceof File && strategyRequirements.size > 0
      ? strategyRequirements
      : null;

  const codeText = codeFile ? await codeFile.text() : "";
  const configText = configFile ? await configFile.text() : "";
  const requirementsText = requirementsFile ? await requirementsFile.text() : '';
  const parsedConfig = configText ? parseUserConfigOptions(configText) : [];
  const parsedRequirements = requirementsText ? parseUserConfigOptions(requirementsText) : [];
  const finalConfig = JSON.stringify(
    buildStrategyConfiguration(parsedConfig)
  );
  const finalRequirements = JSON.stringify(
    parsedRequirements
  )

  console.log("Recieved request for saving a new strategy: ");
  console.log({
    strategyName,
    strategyDescription,
    strategyIsPublic,
    codeText,
    configText: finalConfig,
    requirementsText: finalRequirements
  });

  const { error } = await postStrategy({
    name: strategyName,
    description: descriptionText,
    isPublic: strategyIsPublic,
    strategyCode: codeText,
    configurationOptions: finalConfig,
    requirements: finalRequirements
  });

  if (error) {
    throw new Error(error);
  }

  redirect("/strategies/");
}
