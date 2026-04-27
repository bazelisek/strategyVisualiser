package cz.vko.stockstrategy.dto;

import cz.vko.stockstrategy.model.StrategySourceFile;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class StrategyCreateDTO {

    private String name;
    private String description;
    private String code;
    private List<StrategySourceFile> sourceFiles;
    private String entryFile;
    private String runtime;
    private String configuration;
    private String ownerEmail;
    private Boolean isPublic;
    private String requirements;
}
