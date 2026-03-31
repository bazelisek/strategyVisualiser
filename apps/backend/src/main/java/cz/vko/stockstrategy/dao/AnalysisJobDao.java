package cz.vko.stockstrategy.dao;

import cz.vko.stockstrategy.model.AnalysisJob;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class AnalysisJobDao {

    private final JdbcTemplate jdbcTemplate;

    public AnalysisJobDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<AnalysisJob> JOB_MAPPER = new RowMapper<>() {
        @Override
        public AnalysisJob mapRow(ResultSet rs, int rowNum) throws SQLException {
            AnalysisJob job = new AnalysisJob();
            job.setId(rs.getLong("id"));
            job.setStrategyId(rs.getLong("strategy_id"));
            job.setStatus(rs.getString("status"));
            job.setResult(rs.getString("result"));
            job.setErrorMessage(rs.getString("error_message"));
            job.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());

            if (rs.getTimestamp("started_at") != null) {
                job.setStartedAt(rs.getTimestamp("started_at").toLocalDateTime());
            }
            if (rs.getTimestamp("completed_at") != null) {
                job.setCompletedAt(rs.getTimestamp("completed_at").toLocalDateTime());
            }

            return job;
        }
    };

    public Optional<AnalysisJob> findById(Long id) {
        String sql = "SELECT * FROM analysis_jobs WHERE id = ?";
        List<AnalysisJob> results = jdbcTemplate.query(sql, JOB_MAPPER, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public AnalysisJob save(AnalysisJob job) {
        if (job.getId() == null) {
            return insert(job);
        } else {
            return update(job);
        }
    }

    private AnalysisJob insert(AnalysisJob job) {
        String sql = """
            INSERT INTO analysis_jobs (strategy_id, status, result, error_message, created_at, started_at, completed_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, job.getStrategyId());
            ps.setString(2, job.getStatus());
            ps.setString(3, job.getResult());
            ps.setString(4, job.getErrorMessage());
            if (job.getStartedAt() != null) {
                ps.setTimestamp(5, java.sql.Timestamp.valueOf(job.getStartedAt()));
            } else {
                ps.setTimestamp(5, null);
            }
            if (job.getCompletedAt() != null) {
                ps.setTimestamp(6, java.sql.Timestamp.valueOf(job.getCompletedAt()));
            } else {
                ps.setTimestamp(6, null);
            }
            return ps;
        }, keyHolder);

        job.setId(keyHolder.getKey().longValue());
        job.setCreatedAt(LocalDateTime.now());
        return job;
    }

    private AnalysisJob update(AnalysisJob job) {
        String sql = """
            UPDATE analysis_jobs
            SET strategy_id = ?, status = ?, result = ?, error_message = ?, started_at = ?, completed_at = ?
            WHERE id = ?
            """;

        jdbcTemplate.update(sql,
                job.getStrategyId(),
                job.getStatus(),
                job.getResult(),
                job.getErrorMessage(),
                job.getStartedAt() != null ? java.sql.Timestamp.valueOf(job.getStartedAt()) : null,
                job.getCompletedAt() != null ? java.sql.Timestamp.valueOf(job.getCompletedAt()) : null,
                job.getId());

        return job;
    }
}