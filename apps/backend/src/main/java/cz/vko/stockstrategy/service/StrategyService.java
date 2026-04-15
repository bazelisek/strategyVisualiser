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

    /**
     * Get all public strategies - used for /strategies endpoint
     */
    public List<StrategyDTO> getPublicStrategies() {
        return strategyDao.findAllPublic().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all strategies (legacy method, kept for backward compatibility)
     */
    public List<StrategyDTO> getAllStrategies() {
        return strategyDao.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all strategies owned by a user (both public and private)
     */
    public List<StrategyDTO> getOwnershipList(String ownerEmail) {
        return strategyDao.findByOwnerEmail(ownerEmail).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get user's private strategies + strategies shared with them
     */
    public List<StrategyDTO> getPrivateStrategies(String userEmail) {
        return strategyDao.findPrivateAndSharedWithUser(userEmail).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get only user's private strategies (not shared ones)
     */
    public List<StrategyDTO> getPrivateStrategiesByOwner(String ownerEmail) {
        return strategyDao.findPrivateByOwnerEmail(ownerEmail).stream()
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
        strategy.setOwnerEmail(dto.getOwnerEmail());
        strategy.setIsPublic(dto.getIsPublic() != null ? dto.getIsPublic() : true);

        return strategyDao.save(strategy);
    }

    public Optional<Strategy> updateStrategy(Long id, StrategyCreateDTO dto) {
        Optional<Strategy> existingStrategy = strategyDao.findById(id);
        if (existingStrategy.isEmpty()) {
            return Optional.empty();
        }

        Strategy strategy = existingStrategy.get();
        if (dto.getName() != null) {
            strategy.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            strategy.setDescription(dto.getDescription());
        }
        if (dto.getCode() != null) {
            strategy.setCode(dto.getCode());
        }
        if (dto.getConfiguration() != null) {
            strategy.setConfiguration(dto.getConfiguration());
        }
        if (dto.getOwnerEmail() != null) {
            strategy.setOwnerEmail(dto.getOwnerEmail());
        }
        if (dto.getIsPublic() != null) {
            strategy.setIsPublic(dto.getIsPublic());
        }

        return Optional.of(strategyDao.save(strategy));
    }

    public void deleteStrategy(Long id) {
        strategyDao.deleteById(id);
    }

    private StrategyDTO convertToDTO(Strategy strategy) {
        StrategyDTO dto = new StrategyDTO();
        dto.setId(strategy.getId());
        dto.setName(strategy.getName());
        dto.setDescription(strategy.getDescription());
        dto.setOwnerEmail(strategy.getOwnerEmail());
        dto.setIsPublic(strategy.getIsPublic());
        dto.setCreatedAt(strategy.getCreatedAt());
        dto.setUpdatedAt(strategy.getUpdatedAt());
        return dto;
    }
}