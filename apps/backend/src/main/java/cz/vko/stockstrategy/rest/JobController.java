package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.dto.AnalysisJobDTO;
import cz.vko.stockstrategy.service.AnalysisJobService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/jobs")
@AllArgsConstructor
public class JobController {

    private final AnalysisJobService analysisJobService;

    @GetMapping("/{jobId}")
    public ResponseEntity<AnalysisJobDTO> getJobStatus(@PathVariable Long jobId) {
        Optional<AnalysisJobDTO> job = analysisJobService.getJobById(jobId);
        return job.map(ResponseEntity::ok)
                 .orElse(ResponseEntity.notFound().build());
    }
}