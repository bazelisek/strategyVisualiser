package cz.vko.stockstrategy.dao;

import cz.vko.stockstrategy.model.Strategy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class StrategyDao {

    private final JdbcTemplate jdbcTemplate;

    public StrategyDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<Strategy> STRATEGY_MAPPER = new RowMapper<>() {
        @Override
        public Strategy mapRow(ResultSet rs, int rowNum) throws SQLException {
            Strategy s = new Strategy();
            s.setId(rs.getLong("id"));
            s.setName(rs.getString("name"));
            s.setDescription(rs.getString("description"));
            s.setCode(rs.getString("code"));
            s.setConfiguration(rs.getString("configuration"));
            s.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            s.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
            return s;
        }
    };

    public List<Strategy> findAll() {
        String sql = "SELECT * FROM strategies ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, STRATEGY_MAPPER);
    }

    public Optional<Strategy> findById(Long id) {
        String sql = "SELECT * FROM strategies WHERE id = ?";
        List<Strategy> results = jdbcTemplate.query(sql, STRATEGY_MAPPER, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Strategy save(Strategy strategy) {
        if (strategy.getId() == null) {
            return insert(strategy);
        } else {
            return update(strategy);
        }
    }

    private Strategy insert(Strategy strategy) {
        String sql = """
            INSERT INTO strategies (name, description, code, configuration, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, strategy.getName());
            ps.setString(2, strategy.getDescription());
            ps.setString(3, strategy.getCode());
            ps.setString(4, strategy.getConfiguration());
            return ps;
        }, keyHolder);

        Map<String, Object> generatedKeys = keyHolder.getKeys();
        Number generatedId = generatedKeys != null ? (Number) generatedKeys.get("id") : null;
        if (generatedId == null) {
            throw new IllegalStateException("Insert strategy did not return a generated id.");
        }

        return findById(generatedId.longValue())
                .orElseThrow(() -> new IllegalStateException("Inserted strategy could not be loaded."));
    }

    private Strategy update(Strategy strategy) {
        String sql = """
            UPDATE strategies
            SET name = ?, description = ?, code = ?, configuration = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """;

        jdbcTemplate.update(sql,
                strategy.getName(),
                strategy.getDescription(),
                strategy.getCode(),
                strategy.getConfiguration(),
                strategy.getId());

        strategy.setUpdatedAt(LocalDateTime.now());
        return strategy;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM strategies WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}
