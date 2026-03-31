package cz.vko.stockstrategy.model;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
public class Strategy {

    private Long id;
    private String name;
    private String description;
    private String code;
    private String configuration;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}