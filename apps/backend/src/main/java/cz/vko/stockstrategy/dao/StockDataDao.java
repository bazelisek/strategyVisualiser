package cz.vko.stockstrategy.dao;

import cz.vko.stockstrategy.model.StockData;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public class StockDataDao {

    private final JdbcTemplate jdbcTemplate;

    public StockDataDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<StockData> STOCK_DATA_MAPPER = new RowMapper<>() {
        @Override
        public StockData mapRow(ResultSet rs, int rowNum) throws SQLException {
            StockData s = new StockData();
            s.setId(rs.getLong("id"));
            s.setTicker(rs.getString("ticker"));
            s.setPeriod(rs.getString("period"));
            s.setTradeDate(rs.getDate("trade_date").toLocalDate());
            s.setTradeTime(rs.getTime("trade_time").toLocalTime());
            s.setOpen(rs.getBigDecimal("open"));
            s.setHigh(rs.getBigDecimal("high"));
            s.setLow(rs.getBigDecimal("low"));
            s.setClose(rs.getBigDecimal("close"));
            s.setVolume(rs.getLong("volume"));
            s.setOpenInterest(rs.getLong("open_interest"));
            return s;
        }
    };

    public List<StockData> findByTickerAndPeriodAndDateRange(
            String ticker, String period, LocalDate start, LocalDate end) {

        String sql = """
            SELECT * FROM stock_data
             WHERE ticker = ?
               AND period = ?
               AND trade_date BETWEEN ? AND ?
             ORDER BY trade_date, trade_time
        """;

        return jdbcTemplate.query(sql, STOCK_DATA_MAPPER, ticker, period, start, end);
    }

    public List<StockData> findByTicker(String ticker) {
        String sql = """
            SELECT * FROM stock_data
             WHERE ticker = ?
             ORDER BY trade_date, trade_time
        """;

        return jdbcTemplate.query(sql, STOCK_DATA_MAPPER, ticker);
    }

    public boolean exists(String ticker, String period, LocalDate tradeDate, LocalTime tradeTime) {
        String sql = """
            SELECT COUNT(*) FROM stock_data
             WHERE ticker = ? AND period = ? AND trade_date = ? AND trade_time = ?
        """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, ticker, period, tradeDate, tradeTime);
        return count != null && count > 0;
    }

    public void insert(StockData s) {
        String sql = """
            INSERT INTO stock_data (ticker, period, trade_date, trade_time,
                                    open, high, low, close, volume, open_interest)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        jdbcTemplate.update(sql,
                s.getTicker(),
                s.getPeriod(),
                s.getTradeDate(),
                s.getTradeTime(),
                s.getOpen(),
                s.getHigh(),
                s.getLow(),
                s.getClose(),
                s.getVolume(),
                s.getOpenInterest());
    }
}
