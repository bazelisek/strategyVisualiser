package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.dto.StrategyCreateDTO;
import cz.vko.stockstrategy.dto.StrategyDTO;
import cz.vko.stockstrategy.model.Strategy;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class StrategyService {

    private final StrategyDao strategyDao;

    public List<StrategyDTO> getAllStrategies() {
        return strategyDao.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<Strategy> getStrategyById(Long id) {
        return strategyDao.findById(id);
    }

    public Strategy createStrategy(StrategyCreateDTO dto) {
        Strategy strategy = new Strategy();
        strategy.setName(dto.getName());
        strategy.setDescription(dto.getDescription());
        strategy.setCode(dto.getCode());
        strategy.setConfiguration(dto.getConfiguration());

        return strategyDao.save(strategy);
    }

    public void deleteStrategy(Long id) {
        strategyDao.deleteById(id);
    }

    private StrategyDTO convertToDTO(Strategy strategy) {
        StrategyDTO dto = new StrategyDTO();
        dto.setId(strategy.getId());
        dto.setName(strategy.getName());
        dto.setDescription(strategy.getDescription());
        dto.setCreatedAt(strategy.getCreatedAt());
        dto.setUpdatedAt(strategy.getUpdatedAt());
        return dto;
    }
}