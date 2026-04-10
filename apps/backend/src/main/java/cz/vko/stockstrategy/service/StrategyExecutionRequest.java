package cz.vko.stockstrategy.service;

import java.nio.file.Path;

public record StrategyExecutionRequest(
        Path workspaceDir,
        Path sourceFile,
        Path configFile,
        Path stockDataFile,
        Path jobContextFile,
        Long jobId,
        Long strategyId
) {
}
