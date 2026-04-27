"use server";

import {
  buildStrategyConfiguration,
  parseStrategyRequirements,
  parseUserConfigOptions,
} from "@/util/strategies/configuration";
import { deleteStrategy } from "@/util/strategies/deleteStrategy";
import getStrategy from "@/util/strategies/getStrategy";
import { patchStrategy } from "@/util/strategies/patchStrategy";
import { getServerSession } from "@/auth/server";
import {
  normalizeStrategyEntryFile,
  readStrategySourceFiles,
} from "@/util/strategies/sourceFiles";
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
  const strategyCodeFiles = formData.getAll("strategyCode");
  const strategyEntryFile = formData.get("strategyEntryFile");
  const strategyConfig = formData.get("strategyConfig");
  const strategyRequirements = formData.get("strategyRequirements");

  if (typeof strategyName !== "string" || !strategyName.trim()) {
    throw new Error("Strategy name is required.");
  }

  const descriptionText =
    typeof strategyDescription === "string" ? strategyDescription : "";

  const configFile =
    strategyConfig instanceof File && strategyConfig.size > 0 ? strategyConfig : null;
  const requirementsFile = strategyRequirements instanceof File && strategyRequirements.size > 0 ? strategyRequirements : null;

  const sourceFiles = await readStrategySourceFiles(strategyCodeFiles);
  const entryFile = normalizeStrategyEntryFile(strategyEntryFile);
  const configText = configFile ? await configFile.text() : "";
  const requirementsText = requirementsFile ? await requirementsFile.text() : '';
  const parsedConfig = configText ? parseUserConfigOptions(configText) : [];
  const parsedRequirements = requirementsText ? parseStrategyRequirements(requirementsText) : {};
  const finalConfig = configFile
    ? JSON.stringify(buildStrategyConfiguration(parsedConfig))
    : existingStrategy.configuration;
  const finalRequirements = requirementsFile
    ? JSON.stringify(parsedRequirements)
    : existingStrategy.requirements;

  const { error } = await patchStrategy({
    id: strategyId,
    name: strategyName,
    description: descriptionText,
    isPublic: strategyIsPublic,
    strategySourceFiles: sourceFiles.length > 0 ? sourceFiles : undefined,
    entryFile,
    configurationOptions: finalConfig,
    requirements: finalRequirements
  });

  if (error) {
    throw new Error(error);
  }

  redirect(`/strategies/${strategyId}`);
}

export async function deleteStrategyAction(strategyId: string) {
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
    throw new Error("Only the strategy owner can delete this strategy.");
  }

  const { error } = await deleteStrategy(strategyId);

  if (error) {
    throw new Error(error);
  }

  redirect("/strategies?deleted=1");
}
