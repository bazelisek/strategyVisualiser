package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.model.Strategy;
import cz.vko.stockstrategy.strategy.BuiltInStrategyCatalog;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuiltInStrategySeederTest {

    @Mock
    private StrategyDao strategyDao;

    @InjectMocks
    private BuiltInStrategySeeder seeder;

    @Test
    void seedsBuiltInStrategiesWhenMissing() throws Exception {
        when(strategyDao.findByName(anyString()))
                .thenReturn(Optional.empty());

        seeder.run(new DefaultApplicationArguments(new String[0]));

        ArgumentCaptor<Strategy> captor = ArgumentCaptor.forClass(Strategy.class);
        verify(strategyDao, times(BuiltInStrategyCatalog.all().size())).save(captor.capture());

        assertThat(captor.getAllValues())
                .extracting(Strategy::getName)
                .containsExactlyInAnyOrder(
                        BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME,
                        BuiltInStrategyCatalog.SUPER_TREND_NAME
                );

        Strategy movingAverage = captor.getAllValues().stream()
                .filter(strategy -> BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME.equals(strategy.getName()))
                .findFirst()
                .orElseThrow();
        assertThat(movingAverage.getOwnerEmail()).isEqualTo(BuiltInStrategyCatalog.SYSTEM_OWNER_EMAIL);
        assertThat(movingAverage.getIsPublic()).isTrue();
        assertThat(movingAverage.getConfiguration()).contains("\"maRange1\"");
        assertThat(movingAverage.getConfiguration()).contains("\"maRange2\"");
        assertThat(movingAverage.getCode()).contains("class StrategyMain");

        Strategy superTrend = captor.getAllValues().stream()
                .filter(strategy -> BuiltInStrategyCatalog.SUPER_TREND_NAME.equals(strategy.getName()))
                .findFirst()
                .orElseThrow();
        assertThat(superTrend.getOwnerEmail()).isEqualTo(BuiltInStrategyCatalog.SYSTEM_OWNER_EMAIL);
        assertThat(superTrend.getIsPublic()).isTrue();
        assertThat(superTrend.getConfiguration()).contains("\"supertrendPeriod\"");
        assertThat(superTrend.getConfiguration()).contains("\"buyThresholdPercent\"");
        assertThat(superTrend.getConfiguration()).contains("\"sellThresholdPercent\"");
        assertThat(superTrend.getCode()).contains("class StrategyMain");
    }

    @Test
    void doesNotUpdateMovingAverageCrossoverWhenCatalogMatches() throws Exception {
        Strategy existing = BuiltInStrategyCatalog.movingAverageCrossover().toStrategy();
        existing.setId(5L);
        when(strategyDao.findByName(BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME))
                .thenReturn(Optional.of(existing));
        when(strategyDao.findByName(BuiltInStrategyCatalog.SUPER_TREND_NAME))
                .thenReturn(Optional.of(BuiltInStrategyCatalog.superTrend().toStrategy()));

        seeder.run(new DefaultApplicationArguments(new String[0]));

        verify(strategyDao, never()).save(any());
    }

    @Test
    void updatesMovingAverageCrossoverWhenSystemTemplateDriftedFromCatalog() throws Exception {
        Strategy existing = BuiltInStrategyCatalog.movingAverageCrossover().toStrategy();
        existing.setId(12L);
        existing.setCode("// stale built-in snapshot");
        when(strategyDao.findByName(BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME))
                .thenReturn(Optional.of(existing));
        when(strategyDao.findByName(BuiltInStrategyCatalog.SUPER_TREND_NAME))
                .thenReturn(Optional.of(BuiltInStrategyCatalog.superTrend().toStrategy()));

        seeder.run(new DefaultApplicationArguments(new String[0]));

        ArgumentCaptor<Strategy> captor = ArgumentCaptor.forClass(Strategy.class);
        verify(strategyDao).save(captor.capture());

        Strategy updated = captor.getValue();
        assertThat(updated.getId()).isEqualTo(12L);
        assertThat(updated.getCode()).contains("class StrategyMain");
        assertThat(updated.getDescription()).contains("longer-period SMA");
    }
}
