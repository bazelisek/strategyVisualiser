package cz.vko.stockstrategy.dao;

import cz.vko.stockstrategy.model.AnalysisJob;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class AnalysisJobDao {

    private final JdbcTemplate jdbcTemplate;

    public AnalysisJobDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<AnalysisJob> JOB_MAPPER = new RowMapper<>() {
        @Override
        public AnalysisJob mapRow(@NonNull ResultSet rs, int rowNum) throws SQLException {
            AnalysisJob job = new AnalysisJob();
            job.setId(rs.getLong("id"));
            job.setStrategyId(rs.getLong("strategy_id"));
            job.setStatus(rs.getString("status"));
            job.setResult(rs.getString("result"));
            job.setErrorMessage(rs.getString("error_message"));
            job.setConfigSignature(rs.getString("config_signature"));
            job.setConfigPayload(rs.getString("config_payload"));
            if (rs.getDate("range_start") != null) {
                job.setRangeStart(rs.getDate("range_start").toLocalDate());
            }
            if (rs.getDate("range_end") != null) {
                job.setRangeEnd(rs.getDate("range_end").toLocalDate());
            }
            long reusedFromJobId = rs.getLong("reused_from_job_id");
            if (!rs.wasNull()) {
                job.setReusedFromJobId(reusedFromJobId);
            }
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

    public Optional<AnalysisJob> findCompletedByExactRange(Long strategyId, String configSignature, java.time.LocalDate rangeStart, java.time.LocalDate rangeEnd) {
        String sql = """
            SELECT * FROM analysis_jobs
            WHERE strategy_id = ?
              AND status = 'completed'
              AND config_signature = ?
              AND (
                    (? IS NULL AND range_start IS NULL)
                    OR range_start = ?
                  )
              AND (
                    (? IS NULL AND range_end IS NULL)
                    OR range_end = ?
                  )
            ORDER BY completed_at DESC
            LIMIT 1
            """;
        List<AnalysisJob> results = jdbcTemplate.query(sql, JOB_MAPPER, strategyId, configSignature, rangeStart, rangeStart, rangeEnd, rangeEnd);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<AnalysisJob> findCompletedContainingRange(Long strategyId, String configSignature, java.time.LocalDate rangeStart, java.time.LocalDate rangeEnd) {
        String sql = """
            SELECT * FROM analysis_jobs
            WHERE strategy_id = ?
              AND status = 'completed'
              AND config_signature = ?
              AND (? IS NULL OR range_start IS NULL OR range_start <= ?)
              AND (? IS NULL OR range_end IS NULL OR range_end >= ?)
            ORDER BY completed_at DESC
            LIMIT 1
            """;
        List<AnalysisJob> results = jdbcTemplate.query(sql, JOB_MAPPER, strategyId, configSignature, rangeStart, rangeStart, rangeEnd, rangeEnd);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    private AnalysisJob insert(AnalysisJob job) {
        String sql = """
            INSERT INTO analysis_jobs (
                strategy_id, status, result, error_message, config_signature, config_payload, range_start, range_end, reused_from_job_id, created_at, started_at, completed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, job.getStrategyId());
            ps.setString(2, job.getStatus());
            ps.setString(3, job.getResult());
            ps.setString(4, job.getErrorMessage());
            ps.setString(5, job.getConfigSignature());
            ps.setString(6, job.getConfigPayload());
            if (job.getRangeStart() != null) {
                ps.setDate(7, java.sql.Date.valueOf(job.getRangeStart()));
            } else {
                ps.setNull(7, Types.DATE);
            }
            if (job.getRangeEnd() != null) {
                ps.setDate(8, java.sql.Date.valueOf(job.getRangeEnd()));
            } else {
                ps.setNull(8, Types.DATE);
            }
            if (job.getReusedFromJobId() != null) {
                ps.setLong(9, job.getReusedFromJobId());
            } else {
                ps.setNull(9, Types.BIGINT);
            }
            if (job.getStartedAt() != null) {
                ps.setTimestamp(10, java.sql.Timestamp.valueOf(job.getStartedAt()));
            } else {
                ps.setTimestamp(10, null);
            }
            if (job.getCompletedAt() != null) {
                ps.setTimestamp(11, java.sql.Timestamp.valueOf(job.getCompletedAt()));
            } else {
                ps.setTimestamp(11, null);
            }
            return ps;
        }, keyHolder);

        Map<String, Object> generatedKeys = keyHolder.getKeys();
        Number generatedId = generatedKeys != null ? (Number) generatedKeys.get("id") : null;
        if (generatedId == null) {
            throw new IllegalStateException("Insert analysis job did not return a generated id.");
        }

        return findById(generatedId.longValue())
                .orElseThrow(() -> new IllegalStateException("Inserted analysis job could not be loaded."));
    }

    private AnalysisJob update(AnalysisJob job) {
        String sql = """
            UPDATE analysis_jobs
            SET strategy_id = ?, status = ?, result = ?, error_message = ?, config_signature = ?, config_payload = ?, range_start = ?, range_end = ?, reused_from_job_id = ?, started_at = ?, completed_at = ?
            WHERE id = ?
            """;

        jdbcTemplate.update(sql,
                job.getStrategyId(),
                job.getStatus(),
                job.getResult(),
                job.getErrorMessage(),
                job.getConfigSignature(),
                job.getConfigPayload(),
                job.getRangeStart(),
                job.getRangeEnd(),
                job.getReusedFromJobId(),
                job.getStartedAt() != null ? java.sql.Timestamp.valueOf(job.getStartedAt()) : null,
                job.getCompletedAt() != null ? java.sql.Timestamp.valueOf(job.getCompletedAt()) : null,
                job.getId());

        return job;
    }
}
