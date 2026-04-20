package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.dto.StrategyCreateDTO;
import cz.vko.stockstrategy.dto.StrategyDTO;
import cz.vko.stockstrategy.dto.UserStrategiesDTO;
import cz.vko.stockstrategy.dto.AnalyzeStrategyRequestDTO;
import cz.vko.stockstrategy.model.Strategy;
import cz.vko.stockstrategy.service.AnalysisJobService;
import cz.vko.stockstrategy.service.StrategyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Strategies", description = "Manage trading strategies and trigger analysis jobs.")
public class StrategyController {

    private final StrategyService strategyService;
    private final AnalysisJobService analysisJobService;

    @GetMapping
    @Operation(summary = "List public strategies", description = "Returns all public trading strategies.")
    public List<StrategyDTO> getPublicStrategies() {
        return strategyService.getPublicStrategies();
    }

    @GetMapping("/users/{email}")
    @Operation(summary = "Get strategies for user", description = "Returns private and public strategies for a specific user email. Returns private strategies owned by the user, shared private strategies, and all public strategies in separate arrays.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User strategies retrieved"),
    })
    public ResponseEntity<UserStrategiesDTO> getUserStrategies(
            @Parameter(description = "User email") @PathVariable String email) {
        List<StrategyDTO> privateStrategies = strategyService.getPrivateStrategies(email);
        List<StrategyDTO> publicStrategies = strategyService.getPublicStrategies();

        UserStrategiesDTO result = new UserStrategiesDTO(privateStrategies, publicStrategies);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/{email}/ownership")
    @Operation(summary = "Get ownership list for user", description = "Returns all strategies owned by the user (both public and private).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User ownership list retrieved"),
    })
    public List<StrategyDTO> getUserOwnershipList(
            @Parameter(description = "User email") @PathVariable String email) {
        return strategyService.getOwnershipList(email);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create strategy", description = "Creates a new trading strategy with user ownership.")
    @ApiResponse(responseCode = "201", description = "Strategy created")
    public Strategy createStrategy(@RequestBody StrategyCreateDTO dto) {
        return strategyService.createStrategy(dto);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get strategy", description = "Returns a single strategy by its id.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Strategy found"),
            @ApiResponse(responseCode = "404", description = "Strategy not found")
    })
    public ResponseEntity<Strategy> getStrategy(@Parameter(description = "Strategy id") @PathVariable Long id) {
        Optional<Strategy> strategy = strategyService.getStrategyById(id);
        return strategy.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update strategy", description = "Updates a strategy by its id.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Strategy updated"),
            @ApiResponse(responseCode = "404", description = "Strategy not found")
    })
    public ResponseEntity<Strategy> updateStrategy(
            @Parameter(description = "Strategy id") @PathVariable Long id,
            @RequestBody StrategyCreateDTO dto) {
        Optional<Strategy> updatedStrategy = strategyService.updateStrategy(id, dto);
        return updatedStrategy.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete strategy", description = "Deletes a strategy by its id.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Strategy deleted"),
            @ApiResponse(responseCode = "404", description = "Strategy not found")
    })
    public ResponseEntity<Void> deleteStrategy(@Parameter(description = "Strategy id") @PathVariable Long id) {
        Optional<Strategy> strategy = strategyService.getStrategyById(id);
        if (strategy.isPresent()) {
            strategyService.deleteStrategy(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/analyze")
    @Operation(summary = "Analyze strategy", description = "Creates and starts an analysis job for the selected strategy.")
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "Analysis job accepted"),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid strategy or request",
                    content = @Content(schema = @Schema(implementation = Map.class))
            )
    })
    public ResponseEntity<Map<String, Object>> analyzeStrategy(
            @Parameter(description = "Strategy id") @PathVariable Long id,
            @RequestBody(required = false) AnalyzeStrategyRequestDTO request
    ) {
        try {
            var job = analysisJobService.createAnalysisJob(id, request);
            analysisJobService.executeAnalysisJob(job.getId());

            return ResponseEntity.accepted()
                    .body(Map.of("job_id", job.getId(), "status", "accepted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
