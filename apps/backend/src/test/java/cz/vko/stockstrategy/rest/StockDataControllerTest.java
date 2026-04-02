package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.service.StockDataService;
import cz.vko.stockstrategy.service.StockImportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StockDataController.class)
class StockDataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StockDataService stockDataService;

    @MockBean
    private StockImportService stockImportService;

    @Test
    void getStockDataReturnsImportedRows() throws Exception {
        StockData stockData = new StockData();
        stockData.setId(1L);
        stockData.setTicker("AAPL");
        stockData.setPeriod("1d");
        stockData.setTradeDate(LocalDate.of(2026, 3, 31));
        stockData.setTradeTime(LocalTime.of(0, 0));
        stockData.setOpen(new BigDecimal("100.25"));
        stockData.setHigh(new BigDecimal("110.50"));
        stockData.setLow(new BigDecimal("99.75"));
        stockData.setClose(new BigDecimal("108.00"));
        stockData.setVolume(123456L);

        when(stockDataService.getStockData(
                "AAPL",
                "1d",
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31)
        )).thenReturn(List.of(stockData));

        mockMvc.perform(get("/api/stocks/AAPL")
                        .param("period", "1d")
                        .param("from", "2026-03-01")
                        .param("to", "2026-03-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ticker").value("AAPL"))
                .andExpect(jsonPath("$[0].period").value("1d"))
                .andExpect(jsonPath("$[0].tradeDate").value("2026-03-31"))
                .andExpect(jsonPath("$[0].close").value(108.00));
    }

    @Test
    void importStocksTriggersImportAndReturnsOk() throws Exception {
        mockMvc.perform(get("/api/stocks/import"))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        verify(stockImportService).importFromDirectory();
    }
}
