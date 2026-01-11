package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.model.StockData;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@SpringBootTest
@Slf4j
public class YahooFinanceServiceTest {

    @Autowired
    private YahooFinanceService yahooFinanceService;

    @Test
    void getStockData() {
//        Long startTime = 1945800L; // 9:30
//        String fromTimeStr = "09:30";
//        String toTimeStr = "22:00";
//        String dateFromStr = "2025-09-30";
//        String dateToStr = "2025-10-23";
//
//        log.info("1759269600 = {}", Instant.ofEpochSecond(1759269600));
//        log.info("1761256800L = {}", Instant.ofEpochSecond(1761256800L));
//
//        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
//        LocalDateTime dateFrom = LocalDateTime.parse(dateFromStr + " " + fromTimeStr, formatter);
//        LocalDateTime dateTo = LocalDateTime.parse(dateToStr + " " + toTimeStr, formatter);
//
//        ZoneId zone = ZoneId.of("UTC");
//        // ZoneId zone = ZoneId.systemDefault();
//
//        //ZoneId zone = ZoneId.of("America/New_York");
//
//        long periodFrom = dateFrom.atZone(zone).toEpochSecond();
//        long periodTo = dateTo.atZone(zone).toEpochSecond();
//        log.info("periodFrom:{}, periodTo:{}", periodFrom, periodTo);

        String dateFromStr = "2025-09-30";
        String dateToStr = "2025-10-23";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        LocalDate dateFrom = LocalDate.parse(dateFromStr, formatter);
        LocalDate dateTo = LocalDate.parse(dateToStr, formatter);

        //List<StockData> stockDataList = yahooFinanceService.getStockData("AAPL", "1d", 1759269600, 1761256800);
        List<StockData> stockDataList = yahooFinanceService.getStockDataDaily("AAPL", dateFrom, dateTo);
        log.info("stockDataList={}", stockDataList);
        for (StockData stock : stockDataList) {
            log.info("stock={}", stock);
        }
        assert(stockDataList != null);
    }
}
