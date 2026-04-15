package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.StockDataDao;
import cz.vko.stockstrategy.model.StockData;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class StockDataService {

    private final StockDataDao dao;

    public StockDataService(StockDataDao dao) {
        this.dao = dao;
    }

    public List<StockData> getStockData(String symbol, String period, LocalDate from, LocalDate to) {
        return dao.findByTickerAndPeriodAndDateRange(symbol, period, from, to);
    }

    public List<StockData> getStockData(String symbol) {
        return dao.findByTicker(symbol);
    }

    public void saveIfMissing(List<StockData> rows) {
        for (StockData row : rows) {
            if (row == null) {
                continue;
            }
            String ticker = row.getTicker();
            String period = normalizePeriod(row.getPeriod());
            LocalDate tradeDate = row.getTradeDate();
            LocalTime tradeTime = row.getTradeTime();
            if (ticker == null || period == null || tradeDate == null || tradeTime == null) {
                continue;
            }
            row.setPeriod(period);
            if (!dao.exists(ticker, period, tradeDate, tradeTime)) {
                dao.insert(row);
            }
        }
    }

    private String normalizePeriod(String period) {
        if (period == null || period.isBlank()) {
            return null;
        }
        String trimmed = period.trim();
        if (trimmed.length() == 1) {
            return trimmed.toUpperCase();
        }
        char last = trimmed.charAt(trimmed.length() - 1);
        if (Character.isLetter(last)) {
            return String.valueOf(Character.toUpperCase(last));
        }
        return String.valueOf(Character.toUpperCase(trimmed.charAt(0)));
    }
}
