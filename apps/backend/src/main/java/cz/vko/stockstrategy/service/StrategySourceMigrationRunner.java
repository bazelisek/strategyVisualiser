package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.StrategyDao;
import lombok.AllArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class StrategySourceMigrationRunner implements ApplicationRunner {

    private final StrategyDao strategyDao;

    @Override
    public void run(ApplicationArguments args) {
        for (Long strategyId : strategyDao.findIdsMissingSourceMetadata()) {
            strategyDao.findById(strategyId).ifPresent(strategyDao::save);
        }
    }
}
