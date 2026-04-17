package cz.vko.stockstrategy.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

@Service
public class StrategyExecutionService {

    public String execute(StrategyExecutionRequest request) throws IOException, InterruptedException {
        return execute(request, null);
    }

    public String execute(StrategyExecutionRequest request, Consumer<String> outputListener) throws IOException, InterruptedException {
        String containerRuntime = System.getenv().getOrDefault("STRATEGY_CONTAINER_RUNTIME", "docker");
        String containerImage = System.getenv().getOrDefault("STRATEGY_CONTAINER_IMAGE", "strategy-runner");
        boolean runAsRoot = Boolean.parseBoolean(System.getenv().getOrDefault("STRATEGY_CONTAINER_RUN_AS_ROOT", "false"));
        String workspaceVolume = request.workspaceDir().toAbsolutePath() + ":/opt/strategy/workspace"
                + ("podman".equalsIgnoreCase(containerRuntime) ? ":Z" : "");

        List<String> command = new ArrayList<>(List.of(
                containerRuntime, "run", "--rm",
                "--network=none",
                "--cpus=1",
                "--memory=512m",
                "--pids-limit=128",
                "--read-only",
                "--tmpfs", "/opt/strategy/tmp:rw,noexec,nosuid,size=512m",
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=512m"
        ));
        if ("podman".equalsIgnoreCase(containerRuntime) || runAsRoot) {
            command.add("--user");
            command.add("0");
        }
        command.addAll(List.of(
                "-e", "STRATEGY_CONFIG_FILE=/opt/strategy/workspace/" + request.configFile().getFileName(),
                "-e", "STRATEGY_STOCK_DATA_FILE=/opt/strategy/workspace/" + request.stockDataFile().getFileName(),
                "-e", "STRATEGY_JOB_CONTEXT_FILE=/opt/strategy/workspace/" + request.jobContextFile().getFileName(),
                "-e", "STRATEGY_TMP_DIR=/tmp",
                "-e", "STRATEGY_JOB_ID=" + request.jobId(),
                "-e", "STRATEGY_ID=" + request.strategyId(),
                "-v", workspaceVolume,
                containerImage,
                request.sourceFile().getFileName().toString()
        ));

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = process.inputReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (output.length() > 0) {
                    output.append(System.lineSeparator());
                }
                output.append(line);
                if (outputListener != null) {
                    outputListener.accept(line);
                }
            }
        }
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new IOException("Strategy container failed with exit code " + exitCode
                    + (output.isEmpty() ? "" : System.lineSeparator() + output));
        }

        return output.toString();
    }
}
