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
import org.springframework.boot.ApplicationArguments;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuiltInStrategySeederTest {

    @Mock
    private StrategyDao strategyDao;

    @InjectMocks
    private BuiltInStrategySeeder builtInStrategySeeder;

    @Test
    void runUpdatesExistingSystemOwnedBuiltInWhenOnlyRequirementsDiffer() {
        Strategy existing = BuiltInStrategyCatalog.movingAverageCrossover().toStrategy();
        existing.setId(1L);
        existing.setRequirements(null);

        when(strategyDao.findByName(BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME))
                .thenReturn(Optional.of(existing));
        when(strategyDao.findByName(BuiltInStrategyCatalog.SUPER_TREND_NAME))
                .thenReturn(Optional.of(BuiltInStrategyCatalog.superTrend().toStrategy()));
        when(strategyDao.findByName(BuiltInStrategyCatalog.EMA_ADX_TREND_NAME))
                .thenReturn(Optional.of(BuiltInStrategyCatalog.emaAdxTrend().toStrategy()));
        when(strategyDao.save(any(Strategy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        builtInStrategySeeder.run(mock(ApplicationArguments.class));

        ArgumentCaptor<Strategy> strategyCaptor = ArgumentCaptor.forClass(Strategy.class);
        verify(strategyDao, atLeastOnce()).save(strategyCaptor.capture());

        assertThat(strategyCaptor.getAllValues())
                .anySatisfy(strategy -> {
                    assertThat(strategy.getId()).isEqualTo(1L);
                    assertThat(strategy.getRequirements()).isEqualTo("{}");
                });
    }
}
