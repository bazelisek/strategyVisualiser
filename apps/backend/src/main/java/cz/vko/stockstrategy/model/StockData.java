package cz.vko.stockstrategy.model;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@ToString
public class StockData {

    private Long id;
    private String ticker;
    private String period;
    private LocalDate tradeDate;
    private LocalTime tradeTime;
    private BigDecimal open;
    private BigDecimal high;
    private BigDecimal low;
    private BigDecimal close;
    private Long volume;
    private Long openInterest;

}

