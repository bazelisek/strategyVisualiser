package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.service.YahooFinanceService;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/yahoo")
@AllArgsConstructor
public class YahooController {

    private final ZoneId zoneId = ZoneId.of("America/New_York");

    private final YahooFinanceService service;

    @GetMapping("/{symbol}")
    List<StockData> getStockData(@PathVariable String symbol,
                                 @RequestParam String period,
                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.getStockDataDaily(symbol, from, to);
    }

}
