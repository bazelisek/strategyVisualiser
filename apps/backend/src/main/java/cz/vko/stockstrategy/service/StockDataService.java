package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.StockDataDao;
import cz.vko.stockstrategy.model.StockData;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
}
