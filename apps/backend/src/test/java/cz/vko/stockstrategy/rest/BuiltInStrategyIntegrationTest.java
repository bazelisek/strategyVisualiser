package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.dto.StrategyDTO;
import cz.vko.stockstrategy.model.Strategy;
import cz.vko.stockstrategy.strategy.BuiltInStrategyCatalog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class BuiltInStrategyIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private StrategyDao strategyDao;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void applicationStartupSeedsBuiltInStrategies() {
        Strategy movingAverage = strategyDao.findByName(BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME)
                .orElseThrow(() -> new AssertionError("Built-in strategy was not seeded"));
        Strategy superTrend = strategyDao.findByName(BuiltInStrategyCatalog.SUPER_TREND_NAME)
                .orElseThrow(() -> new AssertionError("SuperTrend built-in strategy was not seeded"));

        assertThat(movingAverage.getOwnerEmail()).isEqualTo(BuiltInStrategyCatalog.SYSTEM_OWNER_EMAIL);
        assertThat(movingAverage.getIsPublic()).isTrue();
        assertThat(movingAverage.getConfiguration()).contains("\"maRange1\"");
        assertThat(movingAverage.getConfiguration()).contains("\"maRange2\"");
        assertThat(movingAverage.getCode()).contains("class StrategyMain");

        assertThat(superTrend.getOwnerEmail()).isEqualTo(BuiltInStrategyCatalog.SYSTEM_OWNER_EMAIL);
        assertThat(superTrend.getIsPublic()).isTrue();
        assertThat(superTrend.getConfiguration()).contains("\"supertrendPeriod\"");
        assertThat(superTrend.getConfiguration()).contains("\"supertrendMultiplier\"");
        assertThat(superTrend.getConfiguration()).contains("\"buyThresholdPercent\"");
        assertThat(superTrend.getConfiguration()).contains("\"sellThresholdPercent\"");
        assertThat(superTrend.getCode()).contains("class StrategyMain");

        ResponseEntity<StrategyDTO[]> response = restTemplate.getForEntity(
                "http://localhost:" + port + "/api/strategies",
                StrategyDTO[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(Arrays.stream(response.getBody()))
                .extracting(StrategyDTO::getName)
                .contains(
                        BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME,
                        BuiltInStrategyCatalog.SUPER_TREND_NAME
                );
    }
}
