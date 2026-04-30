import {
  AVAILABLE_MONEY_CONFIG_ID,
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

  it("injects available money next to the universe by default", () => {
    const config = buildStrategyConfiguration([
      {
        id: "lookback",
        label: "Lookback",
        type: "number",
        defaultValue: 20,
      },
    ]);

    expect(config[0]?.id).toBe(UNIVERSE_CONFIG_ID);
    expect(config[1]?.id).toBe(AVAILABLE_MONEY_CONFIG_ID);
    expect(config[1]?.defaultValue).toBe(10000);
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
    expect(config[1]?.id).toBe(AVAILABLE_MONEY_CONFIG_ID);
    expect(config[2]?.id).toBe("lookback");
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

  it("uses uploaded available money fields to override frontend defaults", () => {
    const config = buildStrategyConfiguration([
      {
        id: "availableMoney",
        label: "Capital",
        type: "number",
        defaultValue: 25000,
        required: false,
      },
    ]);

    expect(config[1]).toEqual(
      expect.objectContaining({
        id: AVAILABLE_MONEY_CONFIG_ID,
        label: "Capital",
        type: "number",
        defaultValue: 25000,
        required: false,
      }),
    );
  });
});
