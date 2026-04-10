package cz.vko.stockstrategy.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class StrategyExecutionService {

    public String execute(StrategyExecutionRequest request) throws IOException, InterruptedException {
        String containerRuntime = System.getenv().getOrDefault("STRATEGY_CONTAINER_RUNTIME", "docker");
        String containerImage = System.getenv().getOrDefault("STRATEGY_CONTAINER_IMAGE", "strategy-runner");
        String workspaceVolume = request.workspaceDir().toAbsolutePath() + ":/opt/strategy/workspace"
                + ("podman".equalsIgnoreCase(containerRuntime) ? ":Z" : "");

        List<String> command = new ArrayList<>(List.of(
                containerRuntime, "run", "--rm",
                "--network=none",
                "--cpus=1",
                "--memory=512m",
                "--pids-limit=128",
                "--read-only",
                "--tmpfs", "/opt/strategy/tmp:rw,noexec,nosuid,size=512m"
        ));
        if ("podman".equalsIgnoreCase(containerRuntime)) {
            command.add("--user");
            command.add("0");
        }
        command.addAll(List.of(
                "-e", "STRATEGY_CONFIG_FILE=/opt/strategy/workspace/" + request.configFile().getFileName(),
                "-e", "STRATEGY_STOCK_DATA_FILE=/opt/strategy/workspace/" + request.stockDataFile().getFileName(),
                "-e", "STRATEGY_JOB_CONTEXT_FILE=/opt/strategy/workspace/" + request.jobContextFile().getFileName(),
                "-e", "STRATEGY_JOB_ID=" + request.jobId(),
                "-e", "STRATEGY_ID=" + request.strategyId(),
                "-v", workspaceVolume,
                containerImage,
                request.sourceFile().getFileName().toString()
        ));

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();
        String output;
        try (var reader = process.inputReader()) {
            output = reader.lines().reduce("", (left, right) ->
                    left.isEmpty() ? right : left + System.lineSeparator() + right);
        }
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new IOException("Strategy container failed with exit code " + exitCode
                    + (output.isBlank() ? "" : System.lineSeparator() + output));
        }

        return output;
    }
}
