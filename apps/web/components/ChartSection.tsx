"use client";
import { useChartData } from "@/hooks/useChartData";
import { getTradeMarkers } from "@/util/markers";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import CandlestickChartWrapper from "./Chart/CandlestickChartWrapper";
import classes from "./ChartSection.module.css";
import StrategyPerformanceOverview from "./StrategyPerformanceOverview";
import { useTiles } from "@/hooks/useTiles";
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
import {
  ConfigOption,
  buildStrategyConfiguration,
  isConfigOptions,
} from "@/util/strategies/configuration";
import { parseStrategyId } from "@/util/strategies/strategyId";
import ChartLoading from "./common/ChartLoading";

interface ChartSectionProps {
  children?: ReactNode;
  index: number;
}

const ChartSection: React.FC<ChartSectionProps> = ({ index }) => {
  const { tiles } = useTiles();
  const tile = tiles[index];
  const symbol = tile?.symbol;
  const interval = tile?.interval;
  const period1 = tile?.period1;
  const period2 = tile?.period2;
  const strategy = tile?.strategy;

  const period1Num = Number(period1);
  const period2Num = Number(period2);
  const strategyId = parseStrategyId(strategy ?? "");
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([]);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [configError, setConfigError] = useState("");
  const [isConfigReady, setIsConfigReady] = useState(false);

  if (
    !symbol ||
    !interval ||
    !strategy ||
    !Number.isFinite(period1Num) ||
    !Number.isFinite(period2Num)
  ) {
    throw new Error("period is not a  number");
  }
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
    {
      symbol,
      interval,
      period1: period1Num,
      period2: period2Num,
      strategy,
    },
    "/"
  );
  const tradeMarkers = getTradeMarkers(strategyData);
  console.log("Trade markers " + JSON.stringify(tradeMarkers));

  useEffect(() => {
    let isActive = true;
    async function loadConfig() {
      if (!strategyId) {
        setConfigError("Strategy is invalid.");
        return;
      }
      try {
        const res = await fetch(`/api/strategies/${strategyId}`);
        if (!res.ok) {
          throw new Error("Failed to load strategy configuration.");
        }
        const strategyResponse = await res.json();
        const parsed = JSON.parse(strategyResponse.configuration ?? "[]") as unknown;
        const mergedOptions = isConfigOptions(parsed)
          ? parsed.some((option) => option.id === "universe")
            ? parsed
            : buildStrategyConfiguration(parsed)
          : buildStrategyConfiguration([]);
        if (!isActive) return;
        setConfigOptions(mergedOptions);
        setFormValues(
          mergedOptions.reduce<Record<string, unknown>>((acc, option) => {
            acc[option.id] = option.defaultValue ?? (option.type === "multi-select" ? [] : "");
            return acc;
          }, {})
        );
      } catch (e) {
        if (!isActive) return;
        setConfigError(e instanceof Error ? e.message : "Failed to load strategy configuration.");
      }
    }
    void loadConfig();
    return () => {
      isActive = false;
    };
  }, [strategyId]);

  const validationErrors = useMemo(() => {
    return configOptions
      .filter((option) => option.required)
      .filter((option) => {
        const value = formValues[option.id];
        if (option.type === "multi-select") {
          return !Array.isArray(value) || value.length === 0;
        }
        return value === undefined || value === null || value === "";
      })
      .map((option) => option.label);
  }, [configOptions, formValues]);

  const canCalculate = validationErrors.length === 0 && configOptions.length > 0 && !loading;

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
          setFormValues((prev) => ({ ...prev, [option.id]: event.target.value }))
        }
      />
    );
  };

  const showChart = stage === "success" && !error;

  return (
    <>
      {!showChart && (
        <Sheet className={classes.div} variant="outlined">
          <Stack spacing={2} width="100%">
            <div>
              <Typography level="h3">Configure strategy run</Typography>
              <Typography level="body-sm">
                Review the inputs below, then run the strategy on the selected
                chart data.
              </Typography>
            </div>
            {configError && (
              <Typography color="danger">{configError}</Typography>
            )}
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
            {stage === "running" && (
              <div className={classes.consolePanel}>
                <Typography level="title-sm">Strategy console</Typography>
                <pre className={classes.consoleOutput}>
                  {consoleOutput || "Preparing stock data for strategy..."}
                </pre>
              </div>
            )}
          </Stack>
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
        />
      )}
      {!loading && !error && showChart && isConfigReady && (
        <StrategyPerformanceOverview
          transformedData={transformedData} 
          strategyData={strategyData}
          strategy={strategy}
          className={classes.div}
        />
      )}
    </>
  );
};

export default ChartSection;
