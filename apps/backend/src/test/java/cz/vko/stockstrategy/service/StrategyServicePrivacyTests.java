package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.AnalysisJobDao;
import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.dto.StrategyDTO;
import cz.vko.stockstrategy.model.Strategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StrategyServicePrivacyTests {

    @Mock
    private StrategyDao strategyDao;

    @Mock
    private AnalysisJobDao analysisJobDao;

    @InjectMocks
    private StrategyService strategyService;

    private Strategy publicStrategy1;
    private Strategy publicStrategy2;
    private Strategy privateStrategy;
    private Strategy sharedPrivateStrategy;

    @BeforeEach
    void setUp() {
        // Setup test strategies
        publicStrategy1 = createStrategy(1L, "Public Strategy 1", "user1@example.com", true);
        publicStrategy2 = createStrategy(2L, "Public Strategy 2", "user2@example.com", true);
        privateStrategy = createStrategy(3L, "Private Strategy", "user1@example.com", false);
        sharedPrivateStrategy = createStrategy(4L, "Shared Private Strategy", "user2@example.com", false);
    }

    @Test
    void getPublicStrategies_ReturnsOnlyPublicStrategies() {
        // Arrange
        when(strategyDao.findAllPublic()).thenReturn(List.of(publicStrategy1, publicStrategy2));

        // Act
        List<StrategyDTO> result = strategyService.getPublicStrategies();

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).extracting(StrategyDTO::getName)
                .containsExactlyInAnyOrder("Public Strategy 1", "Public Strategy 2");
        assertThat(result).extracting(StrategyDTO::getIsPublic)
                .containsOnly(true);
    }

    @Test
    void getPublicStrategies_ExcludesPrivateStrategies() {
        // Arrange
        when(strategyDao.findAllPublic()).thenReturn(List.of(publicStrategy1, publicStrategy2));

        // Act
        List<StrategyDTO> result = strategyService.getPublicStrategies();

        // Assert
        assertThat(result).extracting(StrategyDTO::getName)
                .doesNotContain("Private Strategy");
    }

    @Test
    void getOwnershipList_ReturnsAllUserStrategies() {
        // Arrange
        String ownerEmail = "user1@example.com";
        when(strategyDao.findByOwnerEmail(ownerEmail))
                .thenReturn(List.of(publicStrategy1, privateStrategy));

        // Act
        List<StrategyDTO> result = strategyService.getOwnershipList(ownerEmail);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).extracting(StrategyDTO::getOwnerEmail)
                .containsOnly(ownerEmail);
        assertThat(result).extracting(StrategyDTO::getName)
                .containsExactlyInAnyOrder("Public Strategy 1", "Private Strategy");
    }

    @Test
    void getOwnershipList_IncludesBothPublicAndPrivate() {
        // Arrange
        String ownerEmail = "user1@example.com";
        when(strategyDao.findByOwnerEmail(ownerEmail))
                .thenReturn(List.of(publicStrategy1, privateStrategy));

        // Act
        List<StrategyDTO> result = strategyService.getOwnershipList(ownerEmail);

        // Assert
        assertThat(result).extracting(StrategyDTO::getIsPublic)
                .containsExactlyInAnyOrder(true, false);
    }

    @Test
    void getPrivateStrategies_ReturnsUserPrivateAndShared() {
        // Arrange
        String userEmail = "user1@example.com";
        when(strategyDao.findPrivateAndSharedWithUser(userEmail))
                .thenReturn(List.of(privateStrategy, sharedPrivateStrategy));

        // Act
        List<StrategyDTO> result = strategyService.getPrivateStrategies(userEmail);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).extracting(StrategyDTO::getIsPublic)
                .containsOnly(false);
        assertThat(result).extracting(StrategyDTO::getName)
                .containsExactlyInAnyOrder("Private Strategy", "Shared Private Strategy");
    }

    @Test
    void getPrivateStrategiesByOwner_ReturnsOnlyUserOwnedPrivate() {
        // Arrange
        String ownerEmail = "user1@example.com";
        when(strategyDao.findPrivateByOwnerEmail(ownerEmail))
                .thenReturn(List.of(privateStrategy));

        // Act
        List<StrategyDTO> result = strategyService.getPrivateStrategiesByOwner(ownerEmail);

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Private Strategy");
        assertThat(result.get(0).getIsPublic()).isFalse();
    }

    @Test
    void dtoConversionIncludesPrivacyFields() {
        // Arrange
        String ownerEmail = "owner@example.com";
        Strategy strategy = createStrategy(3L, "Private Strategy", ownerEmail, false);
        strategy.setRequirements("{\"symbol\":{\"whitelist\":[\"AAPL\"]}}");
        
        when(strategyDao.findByOwnerEmail(ownerEmail))
                .thenReturn(List.of(strategy));

        // Act
        List<StrategyDTO> result = strategyService.getOwnershipList(ownerEmail);

        // Assert
        assertThat(result).hasSize(1);
        StrategyDTO dto = result.get(0);
        assertThat(dto.getOwnerEmail()).isEqualTo(ownerEmail);
        assertThat(dto.getIsPublic()).isFalse();
        assertThat(dto.getId()).isEqualTo(3L);
        assertThat(dto.getName()).isEqualTo("Private Strategy");
        assertThat(dto.getRequirements()).isEqualTo("{\"symbol\":{\"whitelist\":[\"AAPL\"]}}");
    }

    @Test
    void updateStrategyInvalidatesExistingAnalysisJobs() {
        Strategy existing = createStrategy(7L, "Existing Strategy", "owner@example.com", true);
        when(strategyDao.findById(7L)).thenReturn(java.util.Optional.of(existing));
        when(strategyDao.save(org.mockito.ArgumentMatchers.any(Strategy.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        cz.vko.stockstrategy.dto.StrategyCreateDTO dto = new cz.vko.stockstrategy.dto.StrategyCreateDTO();
        dto.setCode("updated code");

        java.util.Optional<Strategy> updated = strategyService.updateStrategy(7L, dto);

        assertThat(updated).isPresent();
        assertThat(updated.get().getCode()).isEqualTo("updated code");
        org.mockito.Mockito.verify(analysisJobDao).deleteByStrategyId(7L);
    }

    // Helper method
    private Strategy createStrategy(Long id, String name, String ownerEmail, boolean isPublic) {
        Strategy strategy = new Strategy();
        strategy.setId(id);
        strategy.setName(name);
        strategy.setDescription("Test description");
        strategy.setCode("test code");
        strategy.setConfiguration("config");
        strategy.setOwnerEmail(ownerEmail);
        strategy.setIsPublic(isPublic);
        strategy.setCreatedAt(LocalDateTime.now());
        strategy.setUpdatedAt(LocalDateTime.now());
        return strategy;
    }
}
