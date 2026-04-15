package cz.vko.stockstrategy.strategy;

import cz.vko.stockstrategy.model.Strategy;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

public final class BuiltInStrategyCatalog {

    public static final String SYSTEM_OWNER_EMAIL = "system@strategy.local";
    public static final String MOVING_AVERAGE_CROSSOVER_NAME = "Moving Average Crossover";

    private static final String MOVING_AVERAGE_CROSSOVER_SOURCE_PATH =
            "built-in-strategies/moving-average-crossover/StrategyMain.java";
    private static final String MOVING_AVERAGE_CROSSOVER_CONFIGURATION_PATH =
            "built-in-strategies/moving-average-crossover/configuration.json";

    private static final BuiltInStrategyDefinition MOVING_AVERAGE_CROSSOVER = new BuiltInStrategyDefinition(
            MOVING_AVERAGE_CROSSOVER_NAME,
            "Buys when MA Range 1 crosses above MA Range 2 and sells when it crosses below.",
            readResource(MOVING_AVERAGE_CROSSOVER_SOURCE_PATH),
            readResource(MOVING_AVERAGE_CROSSOVER_CONFIGURATION_PATH),
            SYSTEM_OWNER_EMAIL,
            true
    );

    private BuiltInStrategyCatalog() {
    }

    public static List<BuiltInStrategyDefinition> all() {
        return List.of(MOVING_AVERAGE_CROSSOVER);
    }

    public static BuiltInStrategyDefinition movingAverageCrossover() {
        return MOVING_AVERAGE_CROSSOVER;
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
            String ownerEmail,
            boolean isPublic
    ) {
        public Strategy toStrategy() {
            Strategy strategy = new Strategy();
            strategy.setName(name);
            strategy.setDescription(description);
            strategy.setCode(code);
            strategy.setConfiguration(configuration);
            strategy.setOwnerEmail(ownerEmail);
            strategy.setIsPublic(isPublic);
            return strategy;
        }
    }
}
