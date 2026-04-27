export type StrategySourceFile = {
  path: string;
  content: string;
};

export async function readStrategySourceFiles(
  entries: FormDataEntryValue[],
): Promise<StrategySourceFile[]> {
  const files = entries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0,
  );

  return Promise.all(
    files.map(async (file) => ({
      path: file.name,
      content: await readFileText(file),
    })),
  );
}

export function normalizeStrategyEntryFile(
  entryFile: FormDataEntryValue | null,
): string | null {
  if (typeof entryFile !== "string") {
    return null;
  }
  const trimmed = entryFile.trim();
  return trimmed ? trimmed : null;
}

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  if (typeof file.arrayBuffer === "function") {
    const buffer = await file.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }

  throw new Error(`Unable to read uploaded file ${file.name}.`);
}
