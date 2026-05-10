package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.model.StockData;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AnalysisJobPriceValidationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AnalysisJobService analysisJobService = new AnalysisJobService(null, null, null, null, null, objectMapper);

    @Test
    void validateStrategyResultAcceptsValidPriceWithEpsilon() throws IOException {
        String result = """
                {
                  "status": "ok",
                  "trades": [
                    {"symbol": "AAPL", "time": 1704067200, "price": 148.9999999995, "amount": 1}
                  ]
                }
                """;
        List<StockData> stockData = List.of(
                createStockData("AAPL", LocalDate.parse("2024-01-01"), LocalTime.MIDNIGHT, 150.0, 151.0, 149.0, 150.5)
        );

        // 148.9999999995 is within 1e-9 of 149.0
        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(analysisJobService, "validateStrategyResult", result, stockData));
    }

    @Test
    void validateStrategyResultRejectsPriceOutsideEpsilon() {
        String result = """
                {
                  "status": "ok",
                  "trades": [
                    {"symbol": "AAPL", "time": 1704067200, "price": 148.999999, "amount": 1}
                  ]
                }
                """;
        List<StockData> stockData = List.of(
                createStockData("AAPL", LocalDate.parse("2024-01-01"), LocalTime.MIDNIGHT, 150.0, 151.0, 149.0, 150.5)
        );

        // 148.999999 is more than 1e-9 away from 149.0
        assertThrows(RuntimeException.class, () -> ReflectionTestUtils.invokeMethod(analysisJobService, "validateStrategyResult", result, stockData));
    }

    @Test
    void validateStrategyResultRejectsPriceAboveHigh() {
        String result = """
                {
                  "status": "ok",
                  "trades": [
                    {"symbol": "AAPL", "time": 1704067200, "price": 152.0, "amount": 1}
                  ]
                }
                """;
        List<StockData> stockData = List.of(
                createStockData("AAPL", LocalDate.parse("2024-01-01"), LocalTime.MIDNIGHT, 150.0, 151.0, 149.0, 150.5)
        );

        assertThrows(RuntimeException.class, () -> ReflectionTestUtils.invokeMethod(analysisJobService, "validateStrategyResult", result, stockData));
    }

    @Test
    void validateStrategyResultRejectsPriceBelowLow() {
        String result = """
                {
                  "status": "ok",
                  "trades": [
                    {"symbol": "AAPL", "time": 1704067200, "price": 148.0, "amount": 1}
                  ]
                }
                """;
        List<StockData> stockData = List.of(
                createStockData("AAPL", LocalDate.parse("2024-01-01"), LocalTime.MIDNIGHT, 150.0, 151.0, 149.0, 150.5)
        );

        assertThrows(RuntimeException.class, () -> ReflectionTestUtils.invokeMethod(analysisJobService, "validateStrategyResult", result, stockData));
    }

    @Test
    void validateStrategyResultSkipsTradeWithoutPrice() throws IOException {
        String result = """
                {
                  "status": "ok",
                  "trades": [
                    {"symbol": "AAPL", "time": 1704067200, "amount": 1}
                  ]
                }
                """;
        List<StockData> stockData = List.of(
                createStockData("AAPL", LocalDate.parse("2024-01-01"), LocalTime.MIDNIGHT, 150.0, 151.0, 149.0, 150.5)
        );

        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(analysisJobService, "validateStrategyResult", result, stockData));
    }

    private StockData createStockData(String symbol, LocalDate date, LocalTime time, double open, double high, double low, double close) {
        StockData data = new StockData();
        data.setTicker(symbol);
        data.setTradeDate(date);
        data.setTradeTime(time);
        data.setOpen(BigDecimal.valueOf(open));
        data.setHigh(BigDecimal.valueOf(high));
        data.setLow(BigDecimal.valueOf(low));
        data.setClose(BigDecimal.valueOf(close));
        return data;
    }
}
