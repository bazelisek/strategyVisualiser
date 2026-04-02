package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.service.StockDataService;
import cz.vko.stockstrategy.service.StockImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@AllArgsConstructor
@Tag(name = "Stocks", description = "Access imported stock market data.")
public class StockDataController {


    private final StockDataService service;
    private final StockImportService stockImportService;

    @GetMapping("/{symbol}")
    @Operation(summary = "Get stock data", description = "Returns imported stock data for a symbol and date range.")
    public List<StockData> getStockData(
            @Parameter(description = "Ticker symbol") @PathVariable String symbol,
            @Parameter(description = "Period code, for example 1d") @RequestParam String period,
            @Parameter(description = "Start date in ISO format") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date in ISO format") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.getStockData(symbol, period, from, to);
    }

    @GetMapping("/import")
    @Operation(summary = "Import stock files", description = "Loads stock data from the configured local import directory.")
    public String importStocks() {
        stockImportService.importFromDirectory();
        return "OK";
    }

}
