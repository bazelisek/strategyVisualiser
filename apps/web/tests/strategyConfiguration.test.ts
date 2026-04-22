import {
  buildStrategyConfiguration,
  parseUserConfigOptions,
  UNIVERSE_CONFIG_ID,
} from "@/util/strategies/configuration";

describe("strategy configuration helpers", () => {
  it("accepts uploaded universe configuration", () => {
    const parsed = parseUserConfigOptions(`
      [
        {
          "id": "universe",
          "label": "Custom Universe",
          "type": "multi-select",
          "defaultValue": ["AAPL", "MSFT"],
          "required": true
        },
        {
          "id": "lookback",
          "label": "Lookback",
          "type": "number",
          "defaultValue": 20
        }
      ]
    `);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.id).toBe(UNIVERSE_CONFIG_ID);
  });

  it("uses uploaded universe fields to override frontend defaults", () => {
    const config = buildStrategyConfiguration([
      {
        id: "universe",
        label: "Custom Universe",
        type: "multi-select",
        defaultValue: ["AAPL", "MSFT"],
        required: true,
      },
      {
        id: "lookback",
        label: "Lookback",
        type: "number",
        defaultValue: 20,
      },
    ]);

    expect(config[0]).toEqual(
      expect.objectContaining({
        id: "universe",
        label: "Custom Universe",
        type: "multi-select",
        defaultValue: ["AAPL", "MSFT"],
        required: true,
      })
    );
    expect(config[0]?.options).toContain("AAPL");
    expect(config[1]?.id).toBe("lookback");
  });

  it("keeps frontend defaults for missing universe fields", () => {
    const config = buildStrategyConfiguration([
      {
        id: "universe",
        label: "Uploaded Universe",
        type: "multi-select",
      },
    ]);

    expect(config[0]?.label).toBe("Uploaded Universe");
    expect(config[0]?.defaultValue).toBeDefined();
    expect(Array.isArray(config[0]?.options)).toBe(true);
  });
});
