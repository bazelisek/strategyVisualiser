package cz.vko.stockstrategy.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Health", description = "Basic service health endpoint.")
public class StockStrategyServerController {

    @GetMapping("/api/health")
    @Operation(summary = "Health check", description = "Simple endpoint used to confirm the API is running.")
    public String healthCheck() {
        return "Trading API is running!";
    }
}
