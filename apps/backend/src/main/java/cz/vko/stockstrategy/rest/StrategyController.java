package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.dto.StrategyCreateDTO;
import cz.vko.stockstrategy.dto.StrategyDTO;
import cz.vko.stockstrategy.model.Strategy;
import cz.vko.stockstrategy.service.AnalysisJobService;
import cz.vko.stockstrategy.service.StrategyService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/strategies")
@AllArgsConstructor
public class StrategyController {

    private final StrategyService strategyService;
    private final AnalysisJobService analysisJobService;

    @GetMapping
    public List<StrategyDTO> getAllStrategies() {
        return strategyService.getAllStrategies();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Strategy createStrategy(@RequestBody StrategyCreateDTO dto) {
        return strategyService.createStrategy(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Strategy> getStrategy(@PathVariable Long id) {
        Optional<Strategy> strategy = strategyService.getStrategyById(id);
        return strategy.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStrategy(@PathVariable Long id) {
        Optional<Strategy> strategy = strategyService.getStrategyById(id);
        if (strategy.isPresent()) {
            strategyService.deleteStrategy(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<Map<String, Object>> analyzeStrategy(@PathVariable Long id) {
        try {
            var job = analysisJobService.createAnalysisJob(id);
            analysisJobService.executeAnalysisJob(job.getId());

            return ResponseEntity.accepted()
                    .body(Map.of("job_id", job.getId(), "status", "accepted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}