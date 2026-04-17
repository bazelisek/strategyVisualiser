package cz.vko.stockstrategy.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AnalysisJobDTO {

    private Long id;
    private Long strategyId;
    private String status;
    private String result;
    private String errorMessage;
    private String consoleOutput;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

}
