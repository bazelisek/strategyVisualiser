package cz.vko.stockstrategy.model;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
public class AnalysisJob {

    private Long id;
    private Long strategyId;
    private String status; // pending, running, completed, failed
    private String result;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

}