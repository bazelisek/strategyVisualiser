package cz.vko.stockstrategy.dao;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.model.Strategy;
import cz.vko.stockstrategy.service.StrategySourceFiles;
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
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RowMapper<Strategy> strategyMapper = this::mapStrategy;

    public StrategyDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Strategy> findAll() {
        String sql = "SELECT * FROM strategies ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, strategyMapper);
    }

    public List<Strategy> findAllPublic() {
        String sql = "SELECT * FROM strategies WHERE is_public = true ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, strategyMapper);
    }

    public List<Strategy> findByOwnerEmail(String ownerEmail) {
        String sql = "SELECT * FROM strategies WHERE owner_email = ? ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, strategyMapper, ownerEmail);
    }

    public List<Strategy> findPrivateByOwnerEmail(String ownerEmail) {
        String sql = "SELECT * FROM strategies WHERE owner_email = ? AND is_public = false ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, strategyMapper, ownerEmail);
    }

    public List<Strategy> findPrivateAndSharedWithUser(String userEmail) {
        String sql = """
            SELECT DISTINCT s.* FROM strategies s
            LEFT JOIN strategy_sharing ss ON s.id = ss.strategy_id
            WHERE (s.owner_email = ? AND s.is_public = false)
               OR (ss.shared_with_email = ? AND s.is_public = false)
            ORDER BY s.created_at DESC
            """;
        return jdbcTemplate.query(sql, strategyMapper, userEmail, userEmail);
    }

    public Optional<Strategy> findById(Long id) {
        String sql = "SELECT * FROM strategies WHERE id = ?";
        List<Strategy> results = jdbcTemplate.query(sql, strategyMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<Strategy> findByName(String name) {
        String sql = "SELECT * FROM strategies WHERE name = ? ORDER BY created_at DESC";
        List<Strategy> results = jdbcTemplate.query(sql, strategyMapper, name);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<Long> findIdsMissingSourceMetadata() {
        String sql = "SELECT id FROM strategies WHERE source_files IS NULL OR entry_file IS NULL OR runtime IS NULL";
        return jdbcTemplate.queryForList(sql, Long.class);
    }

    public Strategy save(Strategy strategy) {
        normalizeSourceMetadata(strategy);
        if (strategy.getId() == null) {
            return insert(strategy);
        } else {
            return update(strategy);
        }
    }

    private Strategy insert(Strategy strategy) {
        String sql = """
            INSERT INTO strategies (name, description, code, source_files, entry_file, runtime, configuration, owner_email, is_public, requirements, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, strategy.getName());
            ps.setString(2, strategy.getDescription());
            ps.setString(3, strategy.getCode());
            ps.setString(4, StrategySourceFiles.serialize(objectMapper, strategy.getSourceFiles()));
            ps.setString(5, strategy.getEntryFile());
            ps.setString(6, strategy.getRuntime());
            ps.setString(7, strategy.getConfiguration());
            ps.setString(8, strategy.getOwnerEmail());
            ps.setBoolean(9, strategy.getIsPublic() != null ? strategy.getIsPublic() : true);
            ps.setString(10, strategy.getRequirements());
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
            SET name = ?, description = ?, code = ?, source_files = ?, entry_file = ?, runtime = ?, configuration = ?, requirements = ?, owner_email = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """;

        jdbcTemplate.update(sql,
                strategy.getName(),
                strategy.getDescription(),
                strategy.getCode(),
                StrategySourceFiles.serialize(objectMapper, strategy.getSourceFiles()),
                strategy.getEntryFile(),
                strategy.getRuntime(),
                strategy.getConfiguration(),
                strategy.getRequirements(),
                strategy.getOwnerEmail(),
                strategy.getIsPublic() != null ? strategy.getIsPublic() : true,
                strategy.getId());

        strategy.setUpdatedAt(LocalDateTime.now());
        return strategy;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM strategies WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    private Strategy mapStrategy(ResultSet rs, int rowNum) throws SQLException {
        Strategy strategy = new Strategy();
        strategy.setId(rs.getLong("id"));
        strategy.setName(rs.getString("name"));
        strategy.setDescription(rs.getString("description"));
        strategy.setConfiguration(rs.getString("configuration"));
        strategy.setRequirements(rs.getString("requirements"));
        strategy.setOwnerEmail(rs.getString("owner_email"));
        strategy.setIsPublic(rs.getBoolean("is_public"));
        strategy.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        strategy.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        strategy.setCode(rs.getString("code"));
        strategy.setEntryFile(rs.getString("entry_file"));
        strategy.setRuntime(rs.getString("runtime"));
        strategy.setSourceFiles(StrategySourceFiles.deserialize(objectMapper, rs.getString("source_files")));
        normalizeSourceMetadata(strategy);
        return strategy;
    }

    private void normalizeSourceMetadata(Strategy strategy) {
        StrategySourceFiles.ResolvedStrategySources resolved = StrategySourceFiles.resolve(
                strategy.getSourceFiles(),
                strategy.getCode(),
                strategy.getEntryFile(),
                strategy.getRuntime()
        );
        strategy.setSourceFiles(resolved.sourceFiles());
        strategy.setEntryFile(resolved.entryFile());
        strategy.setRuntime(resolved.runtime());
        strategy.setCode(resolved.code());
    }
}
