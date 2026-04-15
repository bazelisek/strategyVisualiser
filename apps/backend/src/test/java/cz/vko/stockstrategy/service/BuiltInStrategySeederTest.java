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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuiltInStrategySeederTest {

    @Mock
    private StrategyDao strategyDao;

    @InjectMocks
    private BuiltInStrategySeeder seeder;

    @Test
    void seedsMovingAverageCrossoverStrategyWhenMissing() throws Exception {
        when(strategyDao.findByName(BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME))
                .thenReturn(Optional.empty());

        seeder.run(new DefaultApplicationArguments(new String[0]));

        ArgumentCaptor<Strategy> captor = ArgumentCaptor.forClass(Strategy.class);
        verify(strategyDao).save(captor.capture());

        Strategy saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo(BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME);
        assertThat(saved.getOwnerEmail()).isEqualTo(BuiltInStrategyCatalog.SYSTEM_OWNER_EMAIL);
        assertThat(saved.getIsPublic()).isTrue();
        assertThat(saved.getConfiguration()).contains("\"maRange1\"");
        assertThat(saved.getConfiguration()).contains("\"maRange2\"");
        assertThat(saved.getCode()).contains("class StrategyMain");
    }

    @Test
    void doesNotSeedMovingAverageCrossoverStrategyWhenAlreadyPresent() throws Exception {
        when(strategyDao.findByName(BuiltInStrategyCatalog.MOVING_AVERAGE_CROSSOVER_NAME))
                .thenReturn(Optional.of(new Strategy()));

        seeder.run(new DefaultApplicationArguments(new String[0]));

        verify(strategyDao, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
