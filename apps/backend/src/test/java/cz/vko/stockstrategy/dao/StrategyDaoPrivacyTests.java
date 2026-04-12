package cz.vko.stockstrategy.dao;

import cz.vko.stockstrategy.model.Strategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class StrategyDaoPrivacyTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StrategyDao strategyDao;

    @BeforeEach
    void setUp() {
        // Clear the strategies table before each test
        jdbcTemplate.update("DELETE FROM strategy_sharing");
        jdbcTemplate.update("DELETE FROM strategies");
    }

    @Test
    void findAllPublic_ReturnsOnlyPublicStrategies() {
        // Arrange
        Strategy publicStrategy1 = createAndSaveStrategy("Public Strategy 1", "user1@example.com", true);
        Strategy publicStrategy2 = createAndSaveStrategy("Public Strategy 2", "user2@example.com", true);
        Strategy privateStrategy = createAndSaveStrategy("Private Strategy", "user1@example.com", false);

        // Act
        List<Strategy> result = strategyDao.findAllPublic();

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).extracting(Strategy::getName)
                .containsExactlyInAnyOrder("Public Strategy 1", "Public Strategy 2");
        assertThat(result).extracting(Strategy::getIsPublic)
                .containsOnly(true);
    }

    @Test
    void findByOwnerEmail_ReturnsAllStrategiesOwnedByUser() {
        // Arrange
        Strategy strategy1 = createAndSaveStrategy("Strategy 1", "user1@example.com", true);
        Strategy strategy2 = createAndSaveStrategy("Strategy 2", "user1@example.com", false);
        createAndSaveStrategy("Strategy 3", "user2@example.com", true);

        // Act
        List<Strategy> result = strategyDao.findByOwnerEmail("user1@example.com");

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).extracting(Strategy::getOwnerEmail)
                .containsOnly("user1@example.com");
        assertThat(result).extracting(Strategy::getName)
                .containsExactlyInAnyOrder("Strategy 1", "Strategy 2");
    }

    @Test
    void findByOwnerEmail_ReturnsEmptyListWhenNoStrategies() {
        // Arrange
        createAndSaveStrategy("Strategy 1", "user1@example.com", true);

        // Act
        List<Strategy> result = strategyDao.findByOwnerEmail("user2@example.com");

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void findPrivateByOwnerEmail_ReturnsOnlyPrivateStrategies() {
        // Arrange
        createAndSaveStrategy("Public Strategy", "user1@example.com", true);
        Strategy private1 = createAndSaveStrategy("Private 1", "user1@example.com", false);
        Strategy private2 = createAndSaveStrategy("Private 2", "user1@example.com", false);
        createAndSaveStrategy("Other User Private", "user2@example.com", false);

        // Act
        List<Strategy> result = strategyDao.findPrivateByOwnerEmail("user1@example.com");

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).extracting(Strategy::getIsPublic)
                .containsOnly(false);
        assertThat(result).extracting(Strategy::getName)
                .containsExactlyInAnyOrder("Private 1", "Private 2");
    }

    @Test
    void findPrivateAndSharedWithUser_ReturnsUserPrivateAndSharedStrategies() {
        // Arrange
        String userEmail = "user1@example.com";
        String otherUserEmail = "user2@example.com";

        // User1's private strategies
        Strategy user1Private1 = createAndSaveStrategy("User1 Private 1", userEmail, false);
        Strategy user1Private2 = createAndSaveStrategy("User1 Private 2", userEmail, false);

        // User2's private strategy (will be shared with User1)
        Strategy user2PrivateShared = createAndSaveStrategy("User2 Private Shared", otherUserEmail, false);

        // User2's public strategy (not shared, but still private)
        createAndSaveStrategy("User2 Public", otherUserEmail, true);

        // Share user2's private strategy with user1
        shareStrategy(user2PrivateShared.getId(), userEmail);

        // Act
        List<Strategy> result = strategyDao.findPrivateAndSharedWithUser(userEmail);

        // Assert
        assertThat(result).hasSize(3);
        assertThat(result).extracting(Strategy::getId)
                .containsExactlyInAnyOrder(user1Private1.getId(), user1Private2.getId(), user2PrivateShared.getId());
        assertThat(result).extracting(Strategy::getIsPublic)
                .containsOnly(false);
    }

    @Test
    void findPrivateAndSharedWithUser_DoesNotReturnPublicStrategies() {
        // Arrange
        String userEmail = "user1@example.com";

        createAndSaveStrategy("User1 Public", userEmail, true);
        createAndSaveStrategy("Other User Public", "user2@example.com", true);

        // Act
        List<Strategy> result = strategyDao.findPrivateAndSharedWithUser(userEmail);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void strategyPreservesPrivacyFieldsOnSave() {
        // Arrange
        Strategy strategy = new Strategy();
        strategy.setName("Test Strategy");
        strategy.setDescription("Test Description");
        strategy.setCode("test code");
        strategy.setConfiguration("config");
        strategy.setOwnerEmail("owner@example.com");
        strategy.setIsPublic(false);

        // Act
        Strategy saved = strategyDao.save(strategy);

        // Assert
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getOwnerEmail()).isEqualTo("owner@example.com");
        assertThat(saved.getIsPublic()).isFalse();
    }

    @Test
    void strategyPreservesPrivacyFieldsOnUpdate() {
        // Arrange
        Strategy strategy = createAndSaveStrategy("Original", "user1@example.com", true);
        Long strategyId = strategy.getId();

        // Act
        strategy.setName("Updated");
        strategy.setIsPublic(false);
        strategyDao.save(strategy);

        // Assert
        Optional<Strategy> updated = strategyDao.findById(strategyId);
        assertThat(updated).isPresent();
        assertThat(updated.get().getName()).isEqualTo("Updated");
        assertThat(updated.get().getIsPublic()).isFalse();
        assertThat(updated.get().getOwnerEmail()).isEqualTo("user1@example.com");
    }

    // Helper methods
    private Strategy createAndSaveStrategy(String name, String ownerEmail, boolean isPublic) {
        Strategy strategy = new Strategy();
        strategy.setName(name);
        strategy.setDescription("Test description");
        strategy.setCode("test code");
        strategy.setConfiguration("config");
        strategy.setOwnerEmail(ownerEmail);
        strategy.setIsPublic(isPublic);
        return strategyDao.save(strategy);
    }

    private void shareStrategy(Long strategyId, String sharedWithEmail) {
        String sql = "INSERT INTO strategy_sharing (strategy_id, shared_with_email, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)";
        jdbcTemplate.update(sql, strategyId, sharedWithEmail);
    }
}
