"use server";

import { buildStrategyConfiguration, parseUserConfigOptions } from "@/util/strategies/configuration";
import getStrategy from "@/util/strategies/getStrategy";
import { patchStrategy } from "@/util/strategies/patchStrategy";
import { getServerSession } from "@/auth/server";
import { redirect } from "next/navigation";

export async function updateStrategy(strategyId: string, formData: FormData) {
  const session = await getServerSession();
  const currentUserEmail = session?.user?.email;
  if (!currentUserEmail) {
    throw new Error("Unauthorized");
  }

  const existingStrategy = await getStrategy(strategyId);
  if (!existingStrategy) {
    throw new Error("Strategy not found.");
  }

  if (existingStrategy.ownerUser.email !== currentUserEmail) {
    throw new Error("Only the strategy owner can edit this strategy.");
  }

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
    strategyCode instanceof File && strategyCode.size > 0 ? strategyCode : null;
  const configFile =
    strategyConfig instanceof File && strategyConfig.size > 0 ? strategyConfig : null;

  const codeText = codeFile ? await codeFile.text() : existingStrategy.code;
  const configText = configFile ? await configFile.text() : "";
  const parsedConfig = configText ? parseUserConfigOptions(configText) : [];
  const finalConfig = configFile
    ? JSON.stringify(buildStrategyConfiguration(parsedConfig))
    : existingStrategy.configuration;

  const { error } = await patchStrategy({
    id: strategyId,
    name: strategyName,
    description: descriptionText,
    isPublic: strategyIsPublic,
    strategyCode: codeText,
    configurationOptions: finalConfig,
  });

  if (error) {
    throw new Error(error);
  }

  redirect(`/strategies/${strategyId}`);
}
