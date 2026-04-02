package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.dto.AnalysisJobDTO;
import cz.vko.stockstrategy.service.AnalysisJobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Jobs", description = "Read background analysis job state.")
public class JobController {

    private final AnalysisJobService analysisJobService;

    @GetMapping("/{jobId}")
    @Operation(summary = "Get job status", description = "Returns the current state of an analysis job.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Job found"),
            @ApiResponse(responseCode = "404", description = "Job not found")
    })
    public ResponseEntity<AnalysisJobDTO> getJobStatus(@Parameter(description = "Analysis job id") @PathVariable Long jobId) {
        Optional<AnalysisJobDTO> job = analysisJobService.getJobById(jobId);
        return job.map(ResponseEntity::ok)
                 .orElse(ResponseEntity.notFound().build());
    }
}
