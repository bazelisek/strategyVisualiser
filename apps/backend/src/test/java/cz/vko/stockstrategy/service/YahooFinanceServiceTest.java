package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.model.StockData;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class YahooFinanceServiceTest {

    private final YahooFinanceService yahooFinanceService = new YahooFinanceService(new ObjectMapper());

    @Test
    void parseBuildsStockDataAndSkipsNullCandles() {
        String response = """
                {
                  "chart": {
                    "result": [
                      {
                        "meta": {
                          "symbol": "AAPL",
                          "dataGranularity": "1d"
                        },
                        "timestamp": [1712001600, 1712088000],
                        "indicators": {
                          "quote": [
                            {
                              "open": [171.5, null],
                              "high": [173.0, 174.0],
                              "low": [170.4, 170.8],
                              "close": [172.2, 173.6],
                              "volume": [1234567, 7654321]
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
                """;

        @SuppressWarnings("unchecked")
        List<StockData> result = (List<StockData>) ReflectionTestUtils.invokeMethod(
                yahooFinanceService,
                "parse",
                "AAPL",
                response,
                HttpStatus.OK
        );

        assertThat(result).hasSize(1);
        StockData stockData = result.getFirst();
        assertThat(stockData.getTicker()).isEqualTo("AAPL");
        assertThat(stockData.getPeriod()).isEqualTo("1d");
        assertThat(stockData.getTradeDate()).hasToString("2024-04-01");
        assertThat(stockData.getTradeTime()).hasToString("20:00");
        assertThat(stockData.getOpen()).hasToString("171.5");
        assertThat(stockData.getClose()).hasToString("172.2");
        assertThat(stockData.getVolume()).isEqualTo(1234567L);
    }

    @Test
    void parseThrowsHelpfulExceptionWhenYahooReturnsAnError() {
        String response = """
                {
                  "chart": {
                    "result": null,
                    "error": {
                      "code": "Not Found",
                      "description": "No data found, symbol may be delisted"
                    }
                  }
                }
                """;

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(
                yahooFinanceService,
                "parse",
                "BAD-USD",
                response,
                HttpStatus.NOT_FOUND
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No data found");
    }

    @Test
    void getStockDataTrimsDailyBoundaryRowsPastRequestedEndDate() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        ReflectionTestUtils.setField(yahooFinanceService, "restTemplate", restTemplate);

        String response = """
                {
                  "chart": {
                    "result": [
                      {
                        "meta": {
                          "symbol": "BTC-USD",
                          "dataGranularity": "1d",
                          "timezone": "UTC"
                        },
                        "timestamp": [1776729600, 1776816000],
                        "indicators": {
                          "quote": [
                            {
                              "open": [86000.0, 87000.0],
                              "high": [86500.0, 87500.0],
                              "low": [85000.0, 86000.0],
                              "close": [86200.0, 87200.0],
                              "volume": [1000, 2000]
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
                """;

        when(restTemplate.exchange(
                contains("/BTC-USD"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok(response));

        List<StockData> result = yahooFinanceService.getStockData(
                "BTC-USD",
                "1d",
                LocalDate.parse("2026-04-21"),
                LocalDate.parse("2026-04-21")
        );

        assertThat(result).singleElement().satisfies(row -> {
            assertThat(row.getTradeDate()).isEqualTo(LocalDate.parse("2026-04-21"));
            assertThat(row.getTradeTime()).hasToString("00:00");
            assertThat(row.getClose()).hasToString("86200.0");
        });
    }
}
