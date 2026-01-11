package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.service.StockDataService;
import cz.vko.stockstrategy.service.StockImportService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@AllArgsConstructor
public class StockDataController {


    private final StockDataService service;
    private final StockImportService stockImportService;


    @GetMapping("/{symbol}")
    public List<StockData> getStockData(
            @PathVariable String symbol,
            @RequestParam String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.getStockData(symbol, period, from, to);
    }

    @GetMapping("/import")
    public String importStocks() {
        stockImportService.importFromDirectory();
        return "OK";
    }

}
