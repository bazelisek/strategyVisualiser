package cz.vko.stockstrategy.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Map;

@Getter
@Setter
public class AnalyzeStrategyRequestDTO {

    private Map<String, Object> config;
    private String symbol;
    private LocalDate fromDate;
    private LocalDate toDate;
}
