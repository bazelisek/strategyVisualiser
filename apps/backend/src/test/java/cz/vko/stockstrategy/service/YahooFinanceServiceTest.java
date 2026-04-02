package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.model.StockData;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

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
                response
        );

        assertThat(result).hasSize(1);
        StockData stockData = result.getFirst();
        assertThat(stockData.getTicker()).isEqualTo("AAPL");
        assertThat(stockData.getPeriod()).isEqualTo("1d");
        assertThat(stockData.getOpen()).hasToString("171.5");
        assertThat(stockData.getClose()).hasToString("172.2");
        assertThat(stockData.getVolume()).isEqualTo(1234567L);
    }
}
