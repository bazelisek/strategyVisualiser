package cz.vko.stockstrategy.service;

import java.nio.file.Path;

public record StrategyExecutionRequest(
        Path workspaceDir,
        Path entrySourceFile,
        String runtime,
        String javaMainClass,
        Path configFile,
        Path stockDataFile,
        Path jobContextFile,
        Long jobId,
        Long strategyId
) {
}
