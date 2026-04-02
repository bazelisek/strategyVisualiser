package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.service.YahooFinanceService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(YahooController.class)
class YahooControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private YahooFinanceService yahooFinanceService;

    @Test
    void getStockDataReturnsYahooRows() throws Exception {
        StockData stockData = new StockData();
        stockData.setTicker("MSFT");
        stockData.setPeriod("1h");
        stockData.setTradeDate(LocalDate.of(2026, 4, 1));
        stockData.setTradeTime(LocalTime.of(15, 30));
        stockData.setOpen(new BigDecimal("385.10"));
        stockData.setClose(new BigDecimal("387.45"));

        when(yahooFinanceService.getStockData(
                "MSFT",
                "1h",
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 2)
        )).thenReturn(List.of(stockData));

        mockMvc.perform(get("/api/yahoo/MSFT")
                        .param("interval", "1h")
                        .param("from", "2026-04-01")
                        .param("to", "2026-04-02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ticker").value("MSFT"))
                .andExpect(jsonPath("$[0].period").value("1h"))
                .andExpect(jsonPath("$[0].tradeDate").value("2026-04-01"))
                .andExpect(jsonPath("$[0].tradeTime").value("15:30:00"))
                .andExpect(jsonPath("$[0].close").value(387.45));

        verify(yahooFinanceService).getStockData(
                "MSFT",
                "1h",
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 2)
        );
    }

    @Test
    void getStockDataPassesNullIntervalWhenOmitted() throws Exception {
        when(yahooFinanceService.getStockData(
                "AAPL",
                null,
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 2)
        )).thenReturn(List.of());

        mockMvc.perform(get("/api/yahoo/AAPL")
                        .param("from", "2026-04-01")
                        .param("to", "2026-04-02"))
                .andExpect(status().isOk());

        verify(yahooFinanceService).getStockData(
                "AAPL",
                null,
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 2)
        );
    }
}
