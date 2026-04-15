ALTER TABLE analysis_jobs
    ADD COLUMN config_signature VARCHAR(128),
    ADD COLUMN config_payload TEXT,
    ADD COLUMN range_start DATE,
    ADD COLUMN range_end DATE,
    ADD COLUMN reused_from_job_id BIGINT REFERENCES analysis_jobs(id);

CREATE INDEX idx_analysis_jobs_strategy_signature ON analysis_jobs(strategy_id, config_signature);
CREATE INDEX idx_analysis_jobs_range_start_end ON analysis_jobs(range_start, range_end);
