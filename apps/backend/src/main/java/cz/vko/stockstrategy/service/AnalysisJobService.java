package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.AnalysisJobDao;
import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.dto.AnalysisJobDTO;
import cz.vko.stockstrategy.model.AnalysisJob;
import cz.vko.stockstrategy.model.Strategy;
import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@AllArgsConstructor
public class AnalysisJobService {

    private final AnalysisJobDao analysisJobDao;
    private final StrategyDao strategyDao;

    public AnalysisJob createAnalysisJob(Long strategyId) {
        // Verify strategy exists
        Optional<Strategy> strategy = strategyDao.findById(strategyId);
        if (strategy.isEmpty()) {
            throw new IllegalArgumentException("Strategy not found: " + strategyId);
        }

        AnalysisJob job = new AnalysisJob();
        job.setStrategyId(strategyId);
        job.setStatus("pending");
        job.setCreatedAt(LocalDateTime.now());

        return analysisJobDao.save(job);
    }

    public Optional<AnalysisJobDTO> getJobById(Long jobId) {
        return analysisJobDao.findById(jobId)
                .map(this::convertToDTO);
    }

    @Async
    public void executeAnalysisJob(Long jobId) {
        Optional<AnalysisJob> jobOpt = analysisJobDao.findById(jobId);
        if (jobOpt.isEmpty()) {
            return;
        }

        AnalysisJob job = jobOpt.get();

        try {
            // Update status to running
            job.setStatus("running");
            job.setStartedAt(LocalDateTime.now());
            analysisJobDao.save(job);

            // TODO: Implement actual analysis logic here
            // For now, just simulate some processing
            Thread.sleep(5000); // Simulate 5 seconds of processing

            // Set result
            job.setStatus("completed");
            job.setResult("{\"performance\": 0.15, \"trades\": 42, \"winRate\": 0.65}");
            job.setCompletedAt(LocalDateTime.now());

        } catch (Exception e) {
            job.setStatus("failed");
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(LocalDateTime.now());
        }

        analysisJobDao.save(job);
    }

    private AnalysisJobDTO convertToDTO(AnalysisJob job) {
        AnalysisJobDTO dto = new AnalysisJobDTO();
        dto.setId(job.getId());
        dto.setStrategyId(job.getStrategyId());
        dto.setStatus(job.getStatus());
        dto.setResult(job.getResult());
        dto.setErrorMessage(job.getErrorMessage());
        dto.setCreatedAt(job.getCreatedAt());
        dto.setStartedAt(job.getStartedAt());
        dto.setCompletedAt(job.getCompletedAt());
        return dto;
    }
}