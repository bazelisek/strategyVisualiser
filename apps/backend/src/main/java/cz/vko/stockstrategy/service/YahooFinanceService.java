package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.model.StockData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;


@Service
@Slf4j
public class YahooFinanceService {

    private final RestTemplate restTemplate = new RestTemplate();

    private final ObjectMapper objectMapper;

    private static final ZoneId ZONE_ID = ZoneId.of("America/New_York");

    public YahooFinanceService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<StockData> getStockDataDaily(String symbol, LocalDate dateFrom, LocalDate dateTo) {
        String interval = "1d";

        LocalTime timeFrom = LocalTime.of(9, 30);
        LocalTime timeTo = LocalTime.of(9, 30);

        LocalDateTime dateTimeFrom = dateFrom.atTime(LocalTime.of(9, 30));
        LocalDateTime dateTimeTo = dateTo.atTime(LocalTime.of(22, 0));

        ZoneId zone = ZoneId.of("UTC");

        long periodFrom = dateTimeFrom.atZone(zone).toEpochSecond();
        long periodTo = dateTimeTo.atZone(zone).toEpochSecond();
        log.info("periodFrom:{}, periodTo:{}", periodFrom, periodTo);

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = String.format("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=%s&period1=%d&period2=%d",symbol, interval, periodFrom, periodTo);
        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
        );
        log.info("HTTP code: {} ", response.getStatusCode());
        return parse(response.getBody());
    }

    private List<StockData> parse(String yahooResponse) {
        List<StockData> list = new ArrayList<>();

        JsonNode root = null;
        try {
            root = objectMapper.readTree(yahooResponse);

        JsonNode resultNode = root
                .path("chart")
                .path("result")
                .get(0);

        String ticker = resultNode.path("meta").path("symbol").asText();
        String period = resultNode.path("meta").path("dataGranularity").asText();

        JsonNode timestamps = resultNode.path("timestamp");
        JsonNode quote = resultNode
                .path("indicators")
                .path("quote")
                .get(0);

        JsonNode open = quote.path("open");
        JsonNode high = quote.path("high");
        JsonNode low = quote.path("low");
        JsonNode close = quote.path("close");
        JsonNode volume = quote.path("volume");

        for (int i = 0; i < timestamps.size(); i++) {

            // Yahoo sometimes returns null candles → skip safely
            if (open.get(i).isNull()) {
                continue;
            }

            Instant instant = Instant.ofEpochSecond(timestamps.get(i).asLong());

            StockData stock = new StockData();
            stock.setTicker(ticker);
            stock.setPeriod(period);
            stock.setTradeDate(LocalDate.ofInstant(instant, ZONE_ID));
            stock.setTradeTime(LocalTime.ofInstant(instant, ZONE_ID));

            stock.setOpen(BigDecimal.valueOf(open.get(i).asDouble()));
            stock.setHigh(BigDecimal.valueOf(high.get(i).asDouble()));
            stock.setLow(BigDecimal.valueOf(low.get(i).asDouble()));
            stock.setClose(BigDecimal.valueOf(close.get(i).asDouble()));
            stock.setVolume(volume.get(i).asLong());

            list.add(stock);
        }

        } catch (JsonProcessingException e) {
            log.error("Error parsing response from Yahoo Finance: {}", e.getMessage());
            throw new RuntimeException(e);
        }

        return list;
    }
}
