package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.model.StockData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;


@Service
@Slf4j
public class YahooFinanceService {

    private final RestTemplate restTemplate = new RestTemplate();

    private final ObjectMapper objectMapper;

    private static final ZoneId ZONE_ID = ZoneId.of("UTC");

    public YahooFinanceService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<StockData> getStockData(String symbol, String interval, LocalDate dateFrom, LocalDate dateTo) {
        if (symbol == null || symbol.isBlank()) {
            throw new IllegalArgumentException("Symbol is required.");
        }
        if (dateFrom == null || dateTo == null) {
            throw new IllegalArgumentException("Both from and to dates are required.");
        }
        if (dateFrom.isAfter(dateTo)) {
            throw new IllegalArgumentException("from date must be on or before to date.");
        }

        String requestedInterval = (interval == null || interval.isBlank()) ? "1d" : interval;
        long periodFrom = dateFrom.atStartOfDay(ZONE_ID).toEpochSecond();
        long periodTo = dateTo.plusDays(1).atStartOfDay(ZONE_ID).toEpochSecond();
        log.info("Fetching Yahoo data for symbol={}, interval={}, periodFrom={}, periodTo={}",
                symbol, requestedInterval, periodFrom, periodTo);

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = UriComponentsBuilder
                .fromHttpUrl("https://query1.finance.yahoo.com/v8/finance/chart/{symbol}")
                .queryParam("interval", requestedInterval)
                .queryParam("period1", periodFrom)
                .queryParam("period2", periodTo)
                .buildAndExpand(symbol)
                .toUriString();
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            log.info("HTTP code: {}", response.getStatusCode());
            return parse(symbol, response.getBody(), response.getStatusCode()).stream()
                    .filter(row -> isWithinRequestedDateRange(row, dateFrom, dateTo))
                    .sorted(Comparator.comparing(StockData::getTradeDate)
                            .thenComparing(StockData::getTradeTime))
                    .collect(Collectors.toList());
        } catch (HttpStatusCodeException exception) {
            String errorBody = exception.getResponseBodyAsString();
            String errorMessage = extractYahooErrorMessage(errorBody);
            throw new IllegalArgumentException(
                    errorMessage != null
                            ? errorMessage
                            : "Yahoo Finance request failed for symbol " + symbol + ".",
                    exception
            );
        }
    }

    private List<StockData> parse(String symbol, String yahooResponse, HttpStatusCode statusCode) {
        List<StockData> list = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(yahooResponse);
            JsonNode chartNode = root.path("chart");
            JsonNode errorNode = chartNode.path("error");
            if (!errorNode.isMissingNode() && !errorNode.isNull()) {
                throw new IllegalArgumentException(extractYahooErrorMessage(errorNode));
            }

            JsonNode resultArray = chartNode.path("result");
            if (!resultArray.isArray() || resultArray.isEmpty()) {
                throw new IllegalArgumentException("No Yahoo Finance data found for symbol " + symbol + ".");
            }

            JsonNode resultNode = resultArray.get(0);

            String ticker = resultNode.path("meta").path("symbol").asText(symbol);
            String period = resultNode.path("meta").path("dataGranularity").asText("");
            if (period == null || period.isBlank()) {
                period = "1d";
            }

            JsonNode timestamps = resultNode.path("timestamp");
            JsonNode quoteArray = resultNode
                    .path("indicators")
                    .path("quote");
            if (!timestamps.isArray() || timestamps.isEmpty() || !quoteArray.isArray() || quoteArray.isEmpty()) {
                throw new IllegalArgumentException("No Yahoo Finance candles found for symbol " + ticker + ".");
            }
            JsonNode quote = quoteArray.get(0);

            JsonNode open = quote.path("open");
            JsonNode high = quote.path("high");
            JsonNode low = quote.path("low");
            JsonNode close = quote.path("close");
            JsonNode volume = quote.path("volume");

            for (int i = 0; i < timestamps.size(); i++) {
                JsonNode openNode = open.path(i);
                JsonNode highNode = high.path(i);
                JsonNode lowNode = low.path(i);
                JsonNode closeNode = close.path(i);
                JsonNode volumeNode = volume.path(i);
                if (openNode.isMissingNode()
                        || highNode.isMissingNode()
                        || lowNode.isMissingNode()
                        || closeNode.isMissingNode()
                        || openNode.isNull()
                        || highNode.isNull()
                        || lowNode.isNull()
                        || closeNode.isNull()) {
                    continue;
                }

                Instant instant = Instant.ofEpochSecond(timestamps.get(i).asLong());

                StockData stock = new StockData();
                stock.setTicker(ticker);
                stock.setPeriod(period);
                stock.setTradeDate(LocalDate.ofInstant(instant, ZONE_ID));
                stock.setTradeTime(LocalTime.ofInstant(instant, ZONE_ID));

                stock.setOpen(BigDecimal.valueOf(openNode.asDouble()));
                stock.setHigh(BigDecimal.valueOf(highNode.asDouble()));
                stock.setLow(BigDecimal.valueOf(lowNode.asDouble()));
                stock.setClose(BigDecimal.valueOf(closeNode.asDouble()));
                stock.setVolume(volumeNode.isMissingNode() || volumeNode.isNull() ? 0L : volumeNode.asLong());

                list.add(stock);
            }

        } catch (JsonProcessingException e) {
            log.error("Error parsing response from Yahoo Finance: {}", e.getMessage());
            throw new RuntimeException(e);
        }

        if (list.isEmpty()) {
            throw new IllegalArgumentException("No Yahoo Finance candles found for symbol "
                    + symbol
                    + " (HTTP "
                    + statusCode.value()
                    + ").");
        }

        return list;
    }

    private String extractYahooErrorMessage(String yahooResponse) {
        if (yahooResponse == null || yahooResponse.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(yahooResponse);
            return extractYahooErrorMessage(root.path("chart").path("error"));
        } catch (JsonProcessingException ignored) {
            return null;
        }
    }

    private String extractYahooErrorMessage(JsonNode errorNode) {
        if (errorNode == null || errorNode.isMissingNode() || errorNode.isNull()) {
            return null;
        }
        String description = errorNode.path("description").asText("");
        if (!description.isBlank()) {
            return description;
        }
        String code = errorNode.path("code").asText("");
        return code.isBlank() ? null : code;
    }

    private boolean isWithinRequestedDateRange(StockData row, LocalDate dateFrom, LocalDate dateTo) {
        LocalDate tradeDate = row.getTradeDate();
        if (tradeDate == null) {
            return false;
        }
        return !tradeDate.isBefore(dateFrom) && !tradeDate.isAfter(dateTo);
    }
}
