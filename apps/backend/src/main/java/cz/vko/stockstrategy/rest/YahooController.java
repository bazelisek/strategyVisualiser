package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.service.YahooFinanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/yahoo")
@AllArgsConstructor
@Tag(name = "Yahoo", description = "Read market data directly from Yahoo Finance.")
public class YahooController {

    private final YahooFinanceService service;

    @GetMapping("/{symbol}")
    @Operation(summary = "Get Yahoo stock data", description = "Fetches stock data from Yahoo Finance for a symbol, date range, and Yahoo-supported interval.")
    List<StockData> getStockData(@Parameter(description = "Ticker symbol") @PathVariable String symbol,
                                 @Parameter(description = "Yahoo interval such as 1m, 5m, 1h, or 1d. Defaults to 1d.") @RequestParam(required = false) String interval,
                                 @Parameter(description = "Start date in ISO format") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                 @Parameter(description = "End date in ISO format") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        return service.getStockData(symbol, interval, from, to);
    }

}
