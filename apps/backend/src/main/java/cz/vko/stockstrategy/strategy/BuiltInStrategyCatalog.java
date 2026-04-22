package cz.vko.stockstrategy.strategy;

import cz.vko.stockstrategy.model.Strategy;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

public final class BuiltInStrategyCatalog {

    public static final String SYSTEM_OWNER_EMAIL = "system@strategy.local";
    public static final String MOVING_AVERAGE_CROSSOVER_NAME = "Moving Average Crossover";
    public static final String SUPER_TREND_NAME = "SuperTrend";
    public static final String EMA_ADX_TREND_NAME = "EMA ADX Trend";
    private static final String NO_REQUIREMENTS = "{}";

    private static final String MOVING_AVERAGE_CROSSOVER_SOURCE_PATH =
            "built-in-strategies/moving-average-crossover/StrategyMain.java";
    private static final String MOVING_AVERAGE_CROSSOVER_CONFIGURATION_PATH =
            "built-in-strategies/moving-average-crossover/configuration.json";
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

    private static final BuiltInStrategyDefinition MOVING_AVERAGE_CROSSOVER = new BuiltInStrategyDefinition(
            MOVING_AVERAGE_CROSSOVER_NAME,
            "Buys when the shorter-period SMA crosses above the longer-period SMA while the longer SMA is "
                    + "trending up; exits on cross back below or when the longer SMA is flat or falling.",
            readResource(MOVING_AVERAGE_CROSSOVER_SOURCE_PATH),
            readResource(MOVING_AVERAGE_CROSSOVER_CONFIGURATION_PATH),
            NO_REQUIREMENTS,
            SYSTEM_OWNER_EMAIL,
            true
    );
    private static final BuiltInStrategyDefinition SUPER_TREND = new BuiltInStrategyDefinition(
            SUPER_TREND_NAME,
            "Computes SuperTrend with JavaScript-parity ATR, band, and state transitions, then opens and closes "
                    + "a single long position when the raw SuperTrend value moves above or below configured thresholds.",
            readResource(SUPER_TREND_SOURCE_PATH),
            readResource(SUPER_TREND_CONFIGURATION_PATH),
            NO_REQUIREMENTS,
            SYSTEM_OWNER_EMAIL,
            true
    );
    private static final BuiltInStrategyDefinition EMA_ADX_TREND = new BuiltInStrategyDefinition(
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
        return List.of(MOVING_AVERAGE_CROSSOVER, SUPER_TREND, EMA_ADX_TREND);
    }

    public static BuiltInStrategyDefinition movingAverageCrossover() {
        return MOVING_AVERAGE_CROSSOVER;
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

    public record BuiltInStrategyDefinition(
            String name,
            String description,
            String code,
            String configuration,
            String requirements,
            String ownerEmail,
            boolean isPublic
    ) {
        public Strategy toStrategy() {
            Strategy strategy = new Strategy();
            strategy.setName(name);
            strategy.setDescription(description);
            strategy.setCode(code);
            strategy.setConfiguration(configuration);
            strategy.setRequirements(requirements);
            strategy.setOwnerEmail(ownerEmail);
            strategy.setIsPublic(isPublic);
            return strategy;
        }
    }
}
