package cz.vko.stockstrategy.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.dto.StrategyCreateDTO;
import cz.vko.stockstrategy.dto.UserStrategiesDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class StrategyControllerPrivacyTests {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String API_BASE = "/api/strategies";

    @BeforeEach
    void setUp() {
        // Clean up test data
        jdbcTemplate.update("DELETE FROM strategy_sharing");
        jdbcTemplate.update("DELETE FROM strategies");
    }

    @Test
    void getPublicStrategies_ReturnsOnlyPublicStrategies() {
        // Arrange
        createStrategy("Public 1", "user1@example.com", true);
        createStrategy("Public 2", "user2@example.com", true);
        createStrategy("Private", "user1@example.com", false);

        // Act
        ResponseEntity<List> response = restTemplate.getForEntity(API_BASE, List.class);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
    }

    @Test
    void getUserStrategies_ReturnsSeparatePrivateAndPublic() {
        // Arrange
        String userEmail = "user1@example.com";
        createStrategy("User1 Private", userEmail, false);
        createStrategy("Public 1", userEmail, true);
        createStrategy("Public 2", "user2@example.com", true);

        // Act
        ResponseEntity<UserStrategiesDTO> response = restTemplate.getForEntity(
                API_BASE + "/users/" + userEmail,
                UserStrategiesDTO.class
        );

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        
        // User1 should have 1 private strategy
        assertThat(response.getBody().getPrivateStrategies()).hasSize(1);
        assertThat(response.getBody().getPrivateStrategies().get(0).getName())
                .isEqualTo("User1 Private");
        
        // Should see all 2 public strategies
        assertThat(response.getBody().getPublicStrategies()).hasSize(2);
    }

    @Test
    void getUserOwnershipList_ReturnsAllUserStrategies() {
        // Arrange
        String userEmail = "user1@example.com";
        createStrategy("Strategy 1", userEmail, true);
        createStrategy("Strategy 2", userEmail, false);
        createStrategy("Other User Strategy", "user2@example.com", true);

        // Act
        ResponseEntity<List> response = restTemplate.getForEntity(
                API_BASE + "/users/" + userEmail + "/ownership",
                List.class
        );

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
    }

    @Test
    void createStrategy_WithOwnerEmailAndVisibility() {
        // Arrange
        StrategyCreateDTO dto = new StrategyCreateDTO();
        dto.setName("New Strategy");
        dto.setDescription("Test strategy");
        dto.setCode("test code");
        dto.setConfiguration("config");
        dto.setOwnerEmail("owner@example.com");
        dto.setIsPublic(false);

        // Act
        ResponseEntity<Map> response = restTemplate.postForEntity(
                API_BASE,
                dto,
                Map.class
        );

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).containsKeys("id", "name", "ownerEmail", "isPublic");
        assertThat(response.getBody().get("ownerEmail")).isEqualTo("owner@example.com");
        assertThat(response.getBody().get("isPublic")).isEqualTo(false);
    }

    @Test
    void getPublicStrategiesEndpoint_ExcludesPrivateStrategies() {
        // Arrange
        createStrategy("Private Strategy", "user1@example.com", false);

        // Act
        ResponseEntity<List> response = restTemplate.getForEntity(API_BASE, List.class);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void getUserStrategies_WithSharedPrivateStrategies() {
        // Arrange
        String user1Email = "user1@example.com";
        String user2Email = "user2@example.com";

        Map<String, Object> user1PrivateResp = createStrategy("User1 Private", user1Email, false);
        Map<String, Object> user2PrivateSharedResp = createStrategy("User2 Private Shared", user2Email, false);
        
        Long user2PrivateSharedId = ((Number) user2PrivateSharedResp.get("id")).longValue();

        // Share user2's private strategy with user1
        shareStrategy(user2PrivateSharedId, user1Email);

        // Act
        ResponseEntity<UserStrategiesDTO> response = restTemplate.getForEntity(
                API_BASE + "/users/" + user1Email,
                UserStrategiesDTO.class
        );

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getPrivateStrategies()).hasSize(2);
    }

    @Test
    void createStrategy_DefaultsToPublicWhenNotSpecified() {
        // Arrange
        StrategyCreateDTO dto = new StrategyCreateDTO();
        dto.setName("Default Public Strategy");
        dto.setDescription("Test strategy");
        dto.setCode("test code");
        dto.setConfiguration("config");
        dto.setOwnerEmail("owner@example.com");
        // isPublic not specified, should default to true

        // Act
        ResponseEntity<Map> response = restTemplate.postForEntity(
                API_BASE,
                dto,
                Map.class
        );

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("isPublic")).isEqualTo(true);
    }

    @Test
    void userStrategiesDto_StructureIsCorrect() {
        // Arrange
        String userEmail = "user1@example.com";
        createStrategy("Private", userEmail, false);
        createStrategy("Public1", "user2@example.com", true);
        createStrategy("Public2", "user3@example.com", true);

        // Act
        ResponseEntity<UserStrategiesDTO> response = restTemplate.getForEntity(
                API_BASE + "/users/" + userEmail,
                UserStrategiesDTO.class
        );

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        UserStrategiesDTO body = response.getBody();
        
        assertThat(body).hasFieldOrProperty("privateStrategies");
        assertThat(body).hasFieldOrProperty("publicStrategies");
        assertThat(body.getPrivateStrategies()).isNotNull().hasSize(1);
        assertThat(body.getPublicStrategies()).isNotNull().hasSize(2);
    }

    // Helper methods
    private Map<String, Object> createStrategy(String name, String ownerEmail, boolean isPublic) {
        StrategyCreateDTO dto = new StrategyCreateDTO();
        dto.setName(name);
        dto.setDescription("Test description");
        dto.setCode("test code");
        dto.setConfiguration("config");
        dto.setOwnerEmail(ownerEmail);
        dto.setIsPublic(isPublic);

        ResponseEntity<Map> response = restTemplate.postForEntity(API_BASE, dto, Map.class);
        return response.getBody();
    }

    private void shareStrategy(Long strategyId, String sharedWithEmail) {
        String sql = "INSERT INTO strategy_sharing (strategy_id, shared_with_email, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)";
        jdbcTemplate.update(sql, strategyId, sharedWithEmail);
    }
}
