package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.model.Strategy;
import cz.vko.stockstrategy.strategy.BuiltInStrategyCatalog;
import lombok.AllArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
@AllArgsConstructor
public class BuiltInStrategySeeder implements ApplicationRunner {

    private final StrategyDao strategyDao;

    @Override
    public void run(ApplicationArguments args) {
        for (var definition : BuiltInStrategyCatalog.all()) {
            var existingOpt = strategyDao.findByName(definition.name());
            if (existingOpt.isEmpty()) {
                strategyDao.save(definition.toStrategy());
                continue;
            }

            Strategy existing = existingOpt.get();
            if (!BuiltInStrategyCatalog.SYSTEM_OWNER_EMAIL.equals(existing.getOwnerEmail())) {
                continue;
            }

            Strategy template = definition.toStrategy();
            if (Objects.equals(existing.getCode(), template.getCode())
                    && Objects.equals(existing.getDescription(), template.getDescription())
                    && Objects.equals(existing.getConfiguration(), template.getConfiguration())) {
                continue;
            }

            existing.setDescription(template.getDescription());
            existing.setCode(template.getCode());
            existing.setConfiguration(template.getConfiguration());
            strategyDao.save(existing);
        }
    }
}
