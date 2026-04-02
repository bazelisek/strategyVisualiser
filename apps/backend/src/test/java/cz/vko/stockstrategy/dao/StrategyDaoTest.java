package cz.vko.stockstrategy.dao;

import cz.vko.stockstrategy.model.Strategy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.KeyHolder;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StrategyDaoTest {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);

    @Test
    void saveReadsGeneratedIdFromKeyMapWhenDriverReturnsMultipleColumns() {
        StrategyDao strategyDao = new StrategyDao(jdbcTemplate);

        Strategy insertedStrategy = new Strategy();
        insertedStrategy.setId(4L);
        insertedStrategy.setName("string");
        insertedStrategy.setDescription("string");
        insertedStrategy.setCode("string");
        insertedStrategy.setConfiguration("string");
        insertedStrategy.setCreatedAt(LocalDateTime.of(2026, 4, 2, 19, 8, 22));
        insertedStrategy.setUpdatedAt(LocalDateTime.of(2026, 4, 2, 19, 8, 22));

        doAnswer(invocation -> {
            KeyHolder keyHolder = invocation.getArgument(1);
            Map<String, Object> keys = new HashMap<>();
            keys.put("id", 4L);
            keys.put("name", "string");
            keys.put("description", "string");
            keys.put("code", "string");
            keys.put("configuration", "string");
            keys.put("created_at", java.sql.Timestamp.valueOf(insertedStrategy.getCreatedAt()));
            keys.put("updated_at", java.sql.Timestamp.valueOf(insertedStrategy.getUpdatedAt()));
            keyHolder.getKeyList().add(keys);
            return 1;
        }).when(jdbcTemplate).update(any(PreparedStatementCreator.class), any(KeyHolder.class));

        when(jdbcTemplate.query(eq("SELECT * FROM strategies WHERE id = ?"), any(RowMapper.class), eq(4L)))
                .thenReturn(List.of(insertedStrategy));

        Strategy newStrategy = new Strategy();
        newStrategy.setName("string");
        newStrategy.setDescription("string");
        newStrategy.setCode("string");
        newStrategy.setConfiguration("string");

        Strategy result = strategyDao.save(newStrategy);

        assertThat(result.getId()).isEqualTo(4L);
        assertThat(result.getName()).isEqualTo("string");
        assertThat(result.getCreatedAt()).isEqualTo(insertedStrategy.getCreatedAt());
        assertThat(result.getUpdatedAt()).isEqualTo(insertedStrategy.getUpdatedAt());
    }
}
