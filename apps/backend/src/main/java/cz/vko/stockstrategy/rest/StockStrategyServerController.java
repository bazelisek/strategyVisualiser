package cz.vko.stockstrategy.rest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StockStrategyServerController {
    @GetMapping("/api/health")
    public String healthCheck() {
        return "Trading API is running!";
    }
}
