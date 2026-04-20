package cz.vko.stockstrategy.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StrategyCreateDTO {

    private String name;
    private String description;
    private String code;
    private String configuration;
    private String ownerEmail;
    private Boolean isPublic;
    private String requirements;
}