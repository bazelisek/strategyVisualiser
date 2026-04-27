package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.AnalysisJobDao;
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
    private final AnalysisJobDao analysisJobDao;

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
        applySourceMetadata(strategy, dto, null);
        strategy.setConfiguration(dto.getConfiguration());
        strategy.setOwnerEmail(dto.getOwnerEmail());
        strategy.setIsPublic(dto.getIsPublic() != null ? dto.getIsPublic() : true);
        strategy.setRequirements(dto.getRequirements());

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
        applySourceMetadata(strategy, dto, existingStrategy.get());
        if (dto.getConfiguration() != null) {
            strategy.setConfiguration(dto.getConfiguration());
        }
        if (dto.getOwnerEmail() != null) {
            strategy.setOwnerEmail(dto.getOwnerEmail());
        }
        if (dto.getIsPublic() != null) {
            strategy.setIsPublic(dto.getIsPublic());
        }
        if (dto.getRequirements() != null) {
            strategy.setRequirements(dto.getRequirements());
        }

        Strategy saved = strategyDao.save(strategy);
        analysisJobDao.deleteByStrategyId(id);
        return Optional.of(saved);
    }

    public void deleteStrategy(Long id) {
        strategyDao.deleteById(id);
    }

    private StrategyDTO convertToDTO(Strategy strategy) {
        StrategyDTO dto = new StrategyDTO();
        dto.setId(strategy.getId());
        dto.setName(strategy.getName());
        dto.setDescription(strategy.getDescription());
        dto.setEntryFile(strategy.getEntryFile());
        dto.setRuntime(strategy.getRuntime());
        dto.setRequirements(strategy.getRequirements());
        dto.setOwnerEmail(strategy.getOwnerEmail());
        dto.setIsPublic(strategy.getIsPublic());
        dto.setCreatedAt(strategy.getCreatedAt());
        dto.setUpdatedAt(strategy.getUpdatedAt());
        return dto;
    }

    private void applySourceMetadata(Strategy target, StrategyCreateDTO dto, Strategy existingStrategy) {
        boolean hasSourceUpdate = dto.getSourceFiles() != null
                || dto.getCode() != null
                || dto.getEntryFile() != null
                || dto.getRuntime() != null
                || existingStrategy == null;

        if (!hasSourceUpdate) {
            return;
        }

        StrategySourceFiles.ResolvedStrategySources resolved = StrategySourceFiles.resolve(
                dto.getSourceFiles() != null
                        ? dto.getSourceFiles()
                        : existingStrategy != null ? existingStrategy.getSourceFiles() : null,
                dto.getCode() != null
                        ? dto.getCode()
                        : existingStrategy != null ? existingStrategy.getCode() : null,
                dto.getEntryFile() != null
                        ? dto.getEntryFile()
                        : existingStrategy != null ? existingStrategy.getEntryFile() : null,
                dto.getRuntime() != null
                        ? dto.getRuntime()
                        : existingStrategy != null ? existingStrategy.getRuntime() : null
        );

        target.setSourceFiles(resolved.sourceFiles());
        target.setEntryFile(resolved.entryFile());
        target.setRuntime(resolved.runtime());
        target.setCode(resolved.code());
    }
}
