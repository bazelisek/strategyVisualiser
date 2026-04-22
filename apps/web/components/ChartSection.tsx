"use client";

import { useChartData } from "@/hooks/useChartData";
import { useTiles } from "@/hooks/useTiles";
import { getTradeMarkers } from "@/util/markers";
import { getValidIntervals } from "@/util/formCheck";
import {
  buildStrategyConfiguration,
  ConfigOption,
  isConfigOptions,
} from "@/util/strategies/configuration";
import { parseStrategyId } from "@/util/strategies/strategyId";
import {
  getAvailableStrategies,
  type Strategy as StrategyType,
} from "@/util/strategies/strategies";
import { symbols } from "@/util/symbols";
import CandlestickChartWrapper from "./Chart/CandlestickChartWrapper";
import StrategyConsoleCollapsible from "./StrategyConsoleCollapsible";
import StrategyPerformanceOverview from "./StrategyPerformanceOverview";
import CustomSelect from "./Input/Form/CustomSelect";
import classes from "./ChartSection.module.css";
import { AnimatePresence, motion } from "framer-motion";
import {
  Autocomplete,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Option,
  Select,
  Sheet,
  Stack,
  Typography,
} from "@mui/joy";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React, { ReactNode, useEffect, useMemo, useState } from "react";

interface ChartSectionProps {
  children?: ReactNode;
  index: number;
}

type Requirements = {
  symbol?: { whitelist?: string[]; blacklist?: string[] };
  interval?: { whitelist?: string[]; blacklist?: string[] };
  period?: { min?: number; max?: number };
};

type ActiveTab = "tile" | "job";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const panelMotionProps = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -32 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

function parseRequirements(raw: string | undefined): Requirements {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Requirements;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function toDateFromSeconds(value: string): Date | null {
  if (!value) return null;
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== "";
}

const ChartSection: React.FC<ChartSectionProps> = ({ index }) => {
  const { tiles, updateTile } = useTiles();
  const tile = tiles[index];

  const [activeTab, setActiveTab] = useState<ActiveTab>("tile");
  const [availableStrategies, setAvailableStrategies] = useState<
    StrategyType[]
  >([]);
  const [strategyLoadError, setStrategyLoadError] = useState("");
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([]);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [configError, setConfigError] = useState("");
  const [isConfigReady, setIsConfigReady] = useState(false);

  const strategy = tile?.strategy ?? "";
  const symbol = tile?.symbol ?? "";
  const interval = tile?.interval ?? "";
  const period1 = tile?.period1 ?? "";
  const period2 = tile?.period2 ?? "";
  const strategyId = parseStrategyId(strategy);
  const strategyInfo = availableStrategies.find(
    (item) => item.id === strategyId,
  );
  const requirements = useMemo(
    () => parseRequirements(strategyInfo?.requirements),
    [strategyInfo?.requirements],
  );

  const fromDate = toDateFromSeconds(period1);
  const toDate = toDateFromSeconds(period2);
  const period1Num = Number(period1);
  const period2Num = Number(period2);
  const validIntervals = useMemo(
    () => (fromDate && toDate ? getValidIntervals(fromDate, toDate) : []),
    [fromDate, toDate],
  );

  const handleBackToTileConfig = () => {
    setIsConfigReady(false);
    setActiveTab("tile");
  };

  const availableSymbols = useMemo(() => {
    if (requirements.symbol?.whitelist?.length) {
      return symbols.filter((item) =>
        requirements.symbol?.whitelist?.includes(item),
      );
    }
    if (requirements.symbol?.blacklist?.length) {
      return symbols.filter(
        (item) => !requirements.symbol?.blacklist?.includes(item),
      );
    }
    return symbols;
  }, [requirements.symbol?.blacklist, requirements.symbol?.whitelist]);

  const availableIntervals = useMemo(() => {
    if (requirements.interval?.whitelist?.length) {
      return validIntervals.filter((item) =>
        requirements.interval?.whitelist?.includes(item),
      );
    }
    if (requirements.interval?.blacklist?.length) {
      return validIntervals.filter(
        (item) => !requirements.interval?.blacklist?.includes(item),
      );
    }
    return validIntervals;
  }, [
    requirements.interval?.blacklist,
    requirements.interval?.whitelist,
    validIntervals,
  ]);

  useEffect(() => {
    if (symbol && availableSymbols.length > 0 && !availableSymbols.includes(symbol)) {
      updateTile(index, { symbol: "" });
    }
  }, [availableSymbols, index, symbol, updateTile]);

  useEffect(() => {
    if (
      interval &&
      fromDate &&
      toDate &&
      !availableIntervals.includes(interval)
    ) {
      updateTile(index, { interval: "" });
    }
  }, [availableIntervals, fromDate, index, interval, toDate, updateTile]);

  useEffect(() => {
    let isActive = true;
    async function loadStrategies() {
      try {
        const nextStrategies = await getAvailableStrategies();
        if (!isActive) return;
        setAvailableStrategies(nextStrategies);
        setStrategyLoadError("");
      } catch (error) {
        if (!isActive) return;
        setStrategyLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load available strategies.",
        );
      }
    }
    void loadStrategies();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!strategyId) {
      setConfigOptions([]);
      setFormValues({});
      setConfigError("");
      return;
    }
    let isActive = true;
    async function loadConfig() {
      try {
        const res = await fetch(`/api/strategies/${strategyId}`);
        if (!res.ok) {
          throw new Error("Failed to load strategy configuration.");
        }
        const strategyResponse = await res.json();
        const parsed = JSON.parse(
          strategyResponse.configuration ?? "[]",
        ) as unknown;
        const mergedOptions = isConfigOptions(parsed)
          ? parsed.some((option) => option.id === "universe")
            ? parsed
            : buildStrategyConfiguration(parsed)
          : buildStrategyConfiguration([]);
        if (!isActive) return;
        setConfigOptions(mergedOptions);
        setFormValues(
          mergedOptions.reduce<Record<string, unknown>>((acc, option) => {
            acc[option.id] =
              option.defaultValue ?? (option.type === "multi-select" ? [] : "");
            return acc;
          }, {}),
        );
        setConfigError("");
      } catch (error) {
        if (!isActive) return;
        setConfigOptions([]);
        setFormValues({});
        setConfigError(
          error instanceof Error
            ? error.message
            : "Failed to load strategy configuration.",
        );
      }
    }
    void loadConfig();
    return () => {
      isActive = false;
    };
  }, [strategyId]);

  const tileValidationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!strategy) errors.push("Strategy");
    if (!symbol) errors.push("Symbol");

    if (!period1 || !fromDate) {
      errors.push("From date");
    }
    if (!period2 || !toDate) {
      errors.push("To date");
    }
    if (fromDate && toDate && fromDate >= toDate) {
      errors.push("Valid date range");
    }

    if (!interval) {
      errors.push("Interval");
    } else if (fromDate && toDate && !availableIntervals.includes(interval)) {
      errors.push("Compatible interval");
    }

    if (
      symbol &&
      availableSymbols.length > 0 &&
      !availableSymbols.includes(symbol)
    ) {
      errors.push("Strategy-compatible symbol");
    }

    if (
      requirements.period?.min &&
      fromDate &&
      fromDate.getTime() < requirements.period.min * 1000
    ) {
      errors.push("Allowed start date");
    }

    if (
      requirements.period?.max &&
      toDate &&
      toDate.getTime() > requirements.period.max * 1000
    ) {
      errors.push("Allowed end date");
    }

    return Array.from(new Set(errors));
  }, [
    availableIntervals,
    availableSymbols,
    fromDate,
    interval,
    period1,
    period2,
    requirements.period?.max,
    requirements.period?.min,
    strategy,
    symbol,
    toDate,
  ]);

  const validationErrors = useMemo(() => {
    return configOptions
      .filter((option) => option.required)
      .filter((option) => !hasValue(formValues[option.id]))
      .map((option) => option.label);
  }, [configOptions, formValues]);

  const isTileReady = tileValidationErrors.length === 0;
  useEffect(() => {
    if (!isTileReady && activeTab === "job") {
      setActiveTab("tile");
    }
  }, [activeTab, isTileReady]);

  const {
    strategyData,
    loading,
    transformedData,
    error,
    runCalculation,
    stage,
    statusMessage,
    consoleOutput,
  } = useChartData(
    useMemo(
      () =>
        isTileReady
          ? {
              symbol,
              interval,
              period1: period1Num,
              period2: period2Num,
              strategy,
            }
          : null,
      [interval, isTileReady, period1Num, period2Num, strategy, symbol],
    ),
    "/",
  );

  const tradeMarkers = getTradeMarkers(strategyData);
  const canCalculate =
    isTileReady &&
    validationErrors.length === 0 &&
    configOptions.length > 0 &&
    !loading;

  useEffect(() => {
    if (stage === "submitting" || stage === "running") {
      setActiveTab("job");
    }
  }, [stage]);

  const renderOptionInput = (option: ConfigOption) => {
    const value = formValues[option.id];
    if (option.type === "boolean") {
      return (
        <Select
          name={option.id}
          value={typeof value === "boolean" ? String(value) : null}
          onChange={(_, newValue) =>
            setFormValues((prev) => ({
              ...prev,
              [option.id]: newValue === "true",
            }))
          }
        >
          <Option value="true">True</Option>
          <Option value="false">False</Option>
        </Select>
      );
    }
    if (option.type === "number") {
      return (
        <Input
          name={option.id}
          type="number"
          value={typeof value === "number" ? String(value) : ""}
          onChange={(event) =>
            setFormValues((prev) => ({
              ...prev,
              [option.id]:
                event.target.value === "" ? "" : Number(event.target.value),
            }))
          }
        />
      );
    }
    if (option.type === "select") {
      return (
        <Select
          name={option.id}
          value={typeof value === "string" && value !== "" ? value : null}
          onChange={(_, newValue) =>
            setFormValues((prev) => ({
              ...prev,
              [option.id]: newValue ?? "",
            }))
          }
        >
          {(option.options ?? []).map((choice) => (
            <Option key={choice} value={choice}>
              {choice}
            </Option>
          ))}
        </Select>
      );
    }
    if (option.type === "multi-select") {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <Autocomplete
          multiple
          placeholder={`Select ${option.label.toLowerCase()}`}
          options={option.options ?? []}
          getOptionLabel={(choice) => choice}
          value={selected}
          onChange={(_, newValue) =>
            setFormValues((prev) => ({ ...prev, [option.id]: newValue }))
          }
        />
      );
    }
    return (
      <Input
        name={option.id}
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(event) =>
          setFormValues((prev) => ({
            ...prev,
            [option.id]: event.target.value,
          }))
        }
      />
    );
  };

  const handleTileValueChange = (
    field: "strategy" | "symbol" | "interval",
    value: string,
  ) => {
    updateTile(index, { [field]: value });
    if (field === "strategy") {
      setActiveTab("tile");
      setIsConfigReady(false);
    }
  };

  const handleDateChange = (
    field: "period1" | "period2",
    value: Date | null,
  ) => {
    updateTile(index, {
      [field]: value ? String(Math.floor(value.getTime() / 1000)) : "",
    });
  };

  const showChart = stage === "success" && !error && isConfigReady;

  const tilePanel = (
    <motion.div key="tile-panel" {...panelMotionProps}>
      <Stack spacing={2} width="100%">
        <div>
          <Typography level="h3">Configure tile</Typography>
          <Typography level="body-sm">
            Select the strategy, market data range, and interval for this tile.
          </Typography>
        </div>
        {strategyLoadError && (
          <Typography color="danger">{strategyLoadError}</Typography>
        )}
        <FormControl className={classes.field} required>
          <FormLabel>Strategy</FormLabel>
          <CustomSelect
            options={availableStrategies.map((item) => String(item.id))}
            mapping={availableStrategies.map((item) => item.name)}
            value={strategyInfo?.name ?? ""}
            onChange={(newValue) => handleTileValueChange("strategy", newValue)}
            initialText="Select a strategy"
          />
        </FormControl>
        <FormControl className={classes.field} required>
          <FormLabel>Symbol</FormLabel>
          <CustomSelect
            options={availableSymbols}
            value={symbol || ""}
            onChange={(newValue) =>
              handleTileValueChange("symbol", newValue ?? "")
            }
            initialText="Select a symbol"
          />
        </FormControl>
        <FormControl className={classes.field} required>
          <FormLabel>From</FormLabel>
          <ThemeProvider theme={darkTheme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                value={fromDate}
                onChange={(newValue) => handleDateChange("period1", newValue)}
                format="dd.MM.yyyy HH:mm"
                minDateTime={
                  requirements.period?.min
                    ? new Date(requirements.period.min * 1000)
                    : undefined
                }
                maxDateTime={
                  toDate ||
                  (requirements.period?.max
                    ? new Date(requirements.period.max * 1000)
                    : new Date())
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>
          </ThemeProvider>
        </FormControl>
        <FormControl className={classes.field} required>
          <FormLabel>To</FormLabel>
          <ThemeProvider theme={darkTheme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                value={toDate}
                onChange={(newValue) => handleDateChange("period2", newValue)}
                format="dd.MM.yyyy HH:mm"
                minDateTime={
                  fromDate ||
                  (requirements.period?.min
                    ? new Date(requirements.period.min * 1000)
                    : undefined)
                }
                maxDateTime={
                  requirements.period?.max
                    ? new Date(requirements.period.max * 1000)
                    : new Date()
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>
          </ThemeProvider>
        </FormControl>
        <FormControl className={classes.field} required>
          <FormLabel>Interval</FormLabel>
          <CustomSelect
            options={availableIntervals}
            value={interval}
            onChange={(newValue) => handleTileValueChange("interval", newValue)}
            initialText="Select an interval"
            direction="up"
          />
        </FormControl>
        {tileValidationErrors.length > 0 && (
          <FormHelperText className={classes.errorText}>
            Complete these fields before opening job configuration:{" "}
            {tileValidationErrors.join(", ")}
          </FormHelperText>
        )}
        <div className={classes.actions}>
          <Button
            endDecorator="->"
            disabled={!isTileReady}
            onClick={() => setActiveTab("job")}
          >
            Job configuration
          </Button>
        </div>
      </Stack>
    </motion.div>
  );

  const jobPanel = (
    <motion.div key="job-panel" {...panelMotionProps}>
      <Stack spacing={2} width="100%">
        <div>
          <Typography level="h3">Configure strategy run</Typography>
          <Typography level="body-sm">
            Review the job inputs below, then run the strategy on the selected
            chart data.
          </Typography>
        </div>
        {configError && <Typography color="danger">{configError}</Typography>}
        {!configError &&
          configOptions.map((option) => (
            <FormControl
              key={option.id}
              required={option.required}
              className={classes.field}
            >
              <FormLabel>{option.label}</FormLabel>
              {renderOptionInput(option)}
            </FormControl>
          ))}
        {validationErrors.length > 0 && (
          <FormHelperText className={classes.errorText}>
            Missing required values: {validationErrors.join(", ")}
          </FormHelperText>
        )}
        {statusMessage && (
          <Typography level="body-sm">{statusMessage}</Typography>
        )}
        <div className={classes.actions}>
          <Button
            loading={loading}
            onClick={async () => {
              setIsConfigReady(true);
              await runCalculation(formValues);
            }}
            disabled={!canCalculate}
          >
            Calculate strategy
          </Button>
        </div>
        {(stage === "submitting" || stage === "running") && loading && (
          <div className={classes.consolePanel}>
            <Typography level="title-sm">Strategy run log</Typography>
            <pre className={classes.consoleOutput}>
              {consoleOutput ||
                (stage === "submitting"
                  ? "Submitting job..."
                  : "Waiting for runner output...")}
            </pre>
          </div>
        )}
      </Stack>
    </motion.div>
  );

  return (
    <>
      {!showChart && (
        <Sheet className={classes.div} variant="outlined">
          <div className={classes.tabBar}>
            <button
              type="button"
              className={`${classes.tabButton} ${activeTab === "tile" ? classes.tabButtonActive : ""}`}
              onClick={() => setActiveTab("tile")}
            >
              Tile configuration
            </button>
            <button
              type="button"
              className={`${classes.tabButton} ${activeTab === "job" ? classes.tabButtonActive : ""}`}
              onClick={() => {
                if (isTileReady) {
                  setActiveTab("job");
                }
              }}
              disabled={!isTileReady}
            >
              Job configuration
            </button>
          </div>
          <div className={classes.tabPanel}>
            <AnimatePresence mode="wait">
              {activeTab === "tile" ? tilePanel : jobPanel}
            </AnimatePresence>
          </div>
        </Sheet>
      )}
      {error && (
        <Sheet className={classes.div} variant="outlined">
          <Stack spacing={2}>
            <Typography level="h3">Something went wrong...</Typography>
            <Typography>{error}</Typography>
            <div className={classes.actions}>
              <Button onClick={() => setIsConfigReady(false)}>
                Back to configuration
              </Button>
            </div>
          </Stack>
        </Sheet>
      )}
      {showChart && (
        <CandlestickChartWrapper
          index={index + 1}
          tileIndex={index}
          loading={loading}
          transformedData={transformedData}
          tradeMarkers={tradeMarkers}
          handleBackToTileConfig={handleBackToTileConfig}
        />
      )}
      {!loading && !error && showChart && isConfigReady && (
        <>
          <StrategyPerformanceOverview
            transformedData={transformedData}
            strategyData={strategyData}
            strategy={strategy}
            className={classes.div}
          />
          <StrategyConsoleCollapsible
            consoleOutput={consoleOutput}
            className={classes.div}
          />
        </>
      )}
    </>
  );
};

export default ChartSection;
