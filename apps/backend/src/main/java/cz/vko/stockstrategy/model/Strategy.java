package cz.vko.stockstrategy.model;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@ToString
public class Strategy {

    private Long id;
    private String name;
    private String description;
    private String code;
    private List<StrategySourceFile> sourceFiles;
    private String entryFile;
    private String runtime;
    private String configuration;
    private String ownerEmail;
    private String requirements;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
