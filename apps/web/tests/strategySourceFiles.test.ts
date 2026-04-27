import {
  normalizeStrategyEntryFile,
  readStrategySourceFiles,
} from "@/util/strategies/sourceFiles";

describe("strategy source files", () => {
  test("readStrategySourceFiles reads multiple uploaded files", async () => {
    const mainFile = new File(["public class StrategyMain {}"], "StrategyMain.java", {
      type: "text/plain",
    });
    Object.assign(mainFile, {
      text: async () => "public class StrategyMain {}",
    });
    const helperFile = new File(["class IndicatorUtils {}"], "IndicatorUtils.java", {
      type: "text/plain",
    });
    Object.assign(helperFile, {
      text: async () => "class IndicatorUtils {}",
    });

    const sourceFiles = await readStrategySourceFiles([
      mainFile,
      helperFile,
    ]);

    expect(sourceFiles).toEqual([
      {
        path: "StrategyMain.java",
        content: "public class StrategyMain {}",
      },
      {
        path: "IndicatorUtils.java",
        content: "class IndicatorUtils {}",
      },
    ]);
  });

  test("normalizeStrategyEntryFile trims and normalizes blank values", () => {
    expect(normalizeStrategyEntryFile("  main.py  ")).toBe("main.py");
    expect(normalizeStrategyEntryFile("   ")).toBeNull();
    expect(normalizeStrategyEntryFile(null)).toBeNull();
  });
});
