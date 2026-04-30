package cz.vko.stockstrategy.strategy;

import cz.vko.stockstrategy.model.Strategy;
import cz.vko.stockstrategy.model.StrategySourceFile;
import cz.vko.stockstrategy.service.StrategySourceFiles;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

public final class BuiltInStrategyCatalog {

    public static final String SYSTEM_OWNER_EMAIL = "system@strategy.local";
    public static final String MOVING_AVERAGE_CROSSOVER_NAME = "Moving Average Crossover";
    public static final String PYTHON_MOVING_AVERAGE_CROSSOVER_NAME = "Python Moving Average Crossover";
    public static final String SUPER_TREND_NAME = "SuperTrend";
    public static final String EMA_ADX_TREND_NAME = "EMA ADX Trend";
    public static final String HYBRID_TREND_REVERSION_NAME = "Hybrid Trend Reversion";
    private static final String NO_REQUIREMENTS = "{}";

    private static final String MOVING_AVERAGE_CROSSOVER_SOURCE_PATH =
            "built-in-strategies/moving-average-crossover/StrategyMain.java";
    private static final String MOVING_AVERAGE_CROSSOVER_CONFIGURATION_PATH =
            "built-in-strategies/moving-average-crossover/configuration.json";
    private static final String PYTHON_MOVING_AVERAGE_CROSSOVER_MAIN_PATH =
            "built-in-strategies/python-moving-average-crossover/main.py";
    private static final String PYTHON_MOVING_AVERAGE_CROSSOVER_LOGIC_PATH =
            "built-in-strategies/python-moving-average-crossover/strategy_logic.py";
    private static final String PYTHON_MOVING_AVERAGE_CROSSOVER_IO_PATH =
            "built-in-strategies/python-moving-average-crossover/workspace_io.py";
    private static final String PYTHON_MOVING_AVERAGE_CROSSOVER_CONFIGURATION_PATH =
            "built-in-strategies/python-moving-average-crossover/configuration.json";
    private static final String PYTHON_MOVING_AVERAGE_CROSSOVER_REQUIREMENTS_PATH =
            "built-in-strategies/python-moving-average-crossover/requirements.json";
    private static final String HYBRID_TREND_REVERSION_MAIN_PATH =
            "built-in-strategies/hybrid-trend-reversion/main.py";
    private static final String HYBRID_TREND_REVERSION_LOGIC_PATH =
            "built-in-strategies/hybrid-trend-reversion/strategy_logic.py";
    private static final String HYBRID_TREND_REVERSION_IO_PATH =
            "built-in-strategies/hybrid-trend-reversion/workspace_io.py";
    private static final String HYBRID_TREND_REVERSION_CONFIGURATION_PATH =
            "built-in-strategies/hybrid-trend-reversion/configuration.json";
    private static final String HYBRID_TREND_REVERSION_REQUIREMENTS_PATH =
            "built-in-strategies/hybrid-trend-reversion/requirements.json";
    private static final String SUPER_TREND_SOURCE_PATH =
            "built-in-strategies/supertrend/StrategyMain.java";
    private static final String SUPER_TREND_CONFIGURATION_PATH =
            "built-in-strategies/supertrend/configuration.json";
    private static final String EMA_ADX_TREND_SOURCE_PATH =
            "built-in-strategies/ema-adx-trend/StrategyMain.java";
    private static final String EMA_ADX_TREND_CONFIGURATION_PATH =
            "built-in-strategies/ema-adx-trend/configuration.json";
    private static final String EMA_ADX_TREND_REQUIREMENTS_PATH =
            "built-in-strategies/ema-adx-trend/requirements.json";

    private static final BuiltInStrategyDefinition MOVING_AVERAGE_CROSSOVER = BuiltInStrategyDefinition.javaSingleFile(
            MOVING_AVERAGE_CROSSOVER_NAME,
            "Buys when the shorter-period SMA crosses above the longer-period SMA while the longer SMA is "
                    + "trending up; exits on cross back below or when the longer SMA is flat or falling.",
            readResource(MOVING_AVERAGE_CROSSOVER_SOURCE_PATH),
            readResource(MOVING_AVERAGE_CROSSOVER_CONFIGURATION_PATH),
            NO_REQUIREMENTS,
            SYSTEM_OWNER_EMAIL,
            true
    );
    private static final BuiltInStrategyDefinition PYTHON_MOVING_AVERAGE_CROSSOVER = BuiltInStrategyDefinition.of(
            PYTHON_MOVING_AVERAGE_CROSSOVER_NAME,
            "Runs the built-in moving average crossover strategy on the Python runtime using multiple source files, "
                    + "with debug logging for config loading, stock-data parsing, and trade decisions.",
            List.of(
                    sourceFile("main.py", PYTHON_MOVING_AVERAGE_CROSSOVER_MAIN_PATH),
                    sourceFile("strategy_logic.py", PYTHON_MOVING_AVERAGE_CROSSOVER_LOGIC_PATH),
                    sourceFile("workspace_io.py", PYTHON_MOVING_AVERAGE_CROSSOVER_IO_PATH)
            ),
            "main.py",
            StrategySourceFiles.PYTHON_RUNTIME,
            readResource(PYTHON_MOVING_AVERAGE_CROSSOVER_CONFIGURATION_PATH),
            readResource(PYTHON_MOVING_AVERAGE_CROSSOVER_REQUIREMENTS_PATH),
            SYSTEM_OWNER_EMAIL,
            true
    );
    private static final BuiltInStrategyDefinition HYBRID_TREND_REVERSION = BuiltInStrategyDefinition.of(
            HYBRID_TREND_REVERSION_NAME,
            "A hybrid strategy that combines trend-following (EMA/ADX) and mean-reversion (RSI/Bollinger Bands) "
                    + "logic. It enters trends during high volatility and reverts to the mean during sideways markets, "
                    + "utilizing ATR-based trailing stops for risk management.",
            List.of(
                    sourceFile("main.py", HYBRID_TREND_REVERSION_MAIN_PATH),
                    sourceFile("strategy_logic.py", HYBRID_TREND_REVERSION_LOGIC_PATH),
                    sourceFile("workspace_io.py", HYBRID_TREND_REVERSION_IO_PATH)
            ),
            "main.py",
            StrategySourceFiles.PYTHON_RUNTIME,
            readResource(HYBRID_TREND_REVERSION_CONFIGURATION_PATH),
            readResource(HYBRID_TREND_REVERSION_REQUIREMENTS_PATH),
            SYSTEM_OWNER_EMAIL,
            true
    );
    private static final BuiltInStrategyDefinition SUPER_TREND = BuiltInStrategyDefinition.javaSingleFile(
            SUPER_TREND_NAME,
            "Computes SuperTrend with JavaScript-parity ATR, band, and state transitions, then opens and closes "
                    + "a single long position when the raw SuperTrend value moves above or below configured thresholds.",
            readResource(SUPER_TREND_SOURCE_PATH),
            readResource(SUPER_TREND_CONFIGURATION_PATH),
            NO_REQUIREMENTS,
            SYSTEM_OWNER_EMAIL,
            true
    );
    private static final BuiltInStrategyDefinition EMA_ADX_TREND = BuiltInStrategyDefinition.javaSingleFile(
            EMA_ADX_TREND_NAME,
            "Enters when price is above aligned fast and slow EMAs and ADX confirms a strong trend, then exits "
                    + "when momentum fades under the fast EMA, ADX weakens, or an ATR trailing stop is breached.",
            readResource(EMA_ADX_TREND_SOURCE_PATH),
            readResource(EMA_ADX_TREND_CONFIGURATION_PATH),
            readResource(EMA_ADX_TREND_REQUIREMENTS_PATH),
            SYSTEM_OWNER_EMAIL,
            true
    );

    private BuiltInStrategyCatalog() {
    }

    public static List<BuiltInStrategyDefinition> all() {
        return List.of(
                MOVING_AVERAGE_CROSSOVER,
                PYTHON_MOVING_AVERAGE_CROSSOVER,
                HYBRID_TREND_REVERSION,
                SUPER_TREND,
                EMA_ADX_TREND
        );
    }

    public static BuiltInStrategyDefinition movingAverageCrossover() {
        return MOVING_AVERAGE_CROSSOVER;
    }

    public static BuiltInStrategyDefinition pythonMovingAverageCrossover() {
        return PYTHON_MOVING_AVERAGE_CROSSOVER;
    }

    public static BuiltInStrategyDefinition hybridTrendReversion() {
        return HYBRID_TREND_REVERSION;
    }

    public static BuiltInStrategyDefinition superTrend() {
        return SUPER_TREND;
    }

    public static BuiltInStrategyDefinition emaAdxTrend() {
        return EMA_ADX_TREND;
    }

    private static String readResource(String resourcePath) {
        try (InputStream inputStream = BuiltInStrategyCatalog.class.getClassLoader().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new IllegalStateException("Missing built-in strategy resource: " + resourcePath);
            }
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to read built-in strategy resource: " + resourcePath, e);
        }
    }

    private static StrategySourceFile sourceFile(String path, String resourcePath) {
        return new StrategySourceFile(path, readResource(resourcePath));
    }

    public record BuiltInStrategyDefinition(
            String name,
            String description,
            List<StrategySourceFile> sourceFiles,
            String entryFile,
            String runtime,
            String configuration,
            String requirements,
            String ownerEmail,
            boolean isPublic
    ) {
        public static BuiltInStrategyDefinition javaSingleFile(
                String name,
                String description,
                String code,
                String configuration,
                String requirements,
                String ownerEmail,
                boolean isPublic
        ) {
            return of(
                    name,
                    description,
                    List.of(new StrategySourceFile(StrategySourceFiles.DEFAULT_JAVA_ENTRY_FILE, code)),
                    StrategySourceFiles.DEFAULT_JAVA_ENTRY_FILE,
                    StrategySourceFiles.JAVA_RUNTIME,
                    configuration,
                    requirements,
                    ownerEmail,
                    isPublic
            );
        }

        public static BuiltInStrategyDefinition of(
                String name,
                String description,
                List<StrategySourceFile> sourceFiles,
                String entryFile,
                String runtime,
                String configuration,
                String requirements,
                String ownerEmail,
                boolean isPublic
        ) {
            sourceFiles.stream()
                    .filter(sourceFile -> sourceFile.path().equals(entryFile))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Entry file " + entryFile + " is missing."));
            return new BuiltInStrategyDefinition(
                    name,
                    description,
                    List.copyOf(sourceFiles),
                    entryFile,
                    runtime,
                    configuration,
                    requirements,
                    ownerEmail,
                    isPublic
            );
        }

        public String code() {
            return sourceFiles.stream()
                    .filter(sourceFile -> sourceFile.path().equals(entryFile))
                    .findFirst()
                    .map(StrategySourceFile::content)
                    .orElseThrow(() -> new IllegalStateException("Built-in strategy entry file is missing: " + entryFile));
        }

        public Strategy toStrategy() {
            Strategy strategy = new Strategy();
            strategy.setName(name);
            strategy.setDescription(description);
            strategy.setCode(code());
            strategy.setSourceFiles(sourceFiles);
            strategy.setEntryFile(entryFile);
            strategy.setRuntime(runtime);
            strategy.setConfiguration(configuration);
            strategy.setRequirements(requirements);
            strategy.setOwnerEmail(ownerEmail);
            strategy.setIsPublic(isPublic);
            return strategy;
        }
    }
}
