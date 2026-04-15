package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.strategy.BuiltInStrategyCatalog;
import lombok.AllArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class BuiltInStrategySeeder implements ApplicationRunner {

    private final StrategyDao strategyDao;

    @Override
    public void run(ApplicationArguments args) {
        for (var definition : BuiltInStrategyCatalog.all()) {
            if (strategyDao.findByName(definition.name()).isPresent()) {
                continue;
            }
            strategyDao.save(definition.toStrategy());
        }
    }
}
