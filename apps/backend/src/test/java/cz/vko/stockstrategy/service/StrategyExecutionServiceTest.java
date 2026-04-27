package cz.vko.stockstrategy.service;

import org.junit.jupiter.api.Test;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class StrategyExecutionServiceTest {

    @Test
    void containerWorkspacePathUsesMountedWorkspaceLocation() {
        Path workspaceDir = Path.of("/tmp/strategyVisualizer/job_42");
        Path hostSource = workspaceDir.resolve("src/strategy/StrategyMain.java");

        assertThat(StrategyExecutionService.containerWorkspacePath(workspaceDir, hostSource))
                .isEqualTo("/opt/strategy/workspace/src/strategy/StrategyMain.java");
    }

    @Test
    void workspaceVolumeSuffixRelabelsForPodmanOrSelinux() {
        assertThat(StrategyExecutionService.workspaceVolumeSuffix("docker", false)).isEmpty();
        assertThat(StrategyExecutionService.workspaceVolumeSuffix("podman", false)).isEqualTo(":Z");
        assertThat(StrategyExecutionService.workspaceVolumeSuffix("docker", true)).isEqualTo(":Z");
    }

    @Test
    void entrypointCompilesAllJavaSourcesInWorkspace() throws Exception {
        Path workspace = Files.createTempDirectory("strategy-runner-workspace");
        Path tmpDir = Files.createTempDirectory("strategy-runner-tmp");
        Path libDir = Files.createTempDirectory("strategy-runner-lib");
        Path sourceFile = workspace.resolve("StrategyMain.java");
        Path helperFile = workspace.resolve("IndicatorUtils.java");
        Path projectRoot = Path.of("").toAbsolutePath();
        Path entrypoint = projectRoot.resolve("docker/strategyContainer/entrypoint.sh");

        Files.writeString(sourceFile, """
                public class StrategyMain {
                    public static void main(String[] args) {
                        System.out.println(IndicatorUtils.message());
                    }
                }
                """, StandardCharsets.UTF_8);
        Files.writeString(helperFile, """
                class IndicatorUtils {
                    static String message() {
                        return "ok";
                    }
                }
                """, StandardCharsets.UTF_8);

        ProcessBuilder processBuilder = new ProcessBuilder(
                "bash",
                entrypoint.toString(),
                "/opt/strategy/workspace/StrategyMain.java"
        );
        processBuilder.directory(projectRoot.resolve("src/test").toFile());
        processBuilder.redirectErrorStream(true);
        processBuilder.environment().put("STRATEGY_WORKDIR", workspace.toString());
        processBuilder.environment().put("STRATEGY_TMP_DIR", tmpDir.toString());
        processBuilder.environment().put("STRATEGY_LIB_DIR", libDir.toString());
        processBuilder.environment().put("COMPILE_ONLY", "true");
        processBuilder.environment().put("RUN_TIMEOUT_SECONDS", "30");

        Process process = processBuilder.start();

        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        assertThat(exitCode)
                .withFailMessage("Entrypoint should compile workspace source successfully:%n%s", output)
                .isZero();
        assertThat(output).contains("[strategy-runner] Compiling " + workspace.resolve("StrategyMain.java"));
        assertThat(tmpDir.resolve("classes/StrategyMain.class")).exists();
        assertThat(tmpDir.resolve("classes/IndicatorUtils.class")).exists();
    }

    @Test
    void entrypointRunsPythonSourcesFromWorkspace() throws Exception {
        Path workspace = Files.createTempDirectory("strategy-runner-python-workspace");
        Path tmpDir = Files.createTempDirectory("strategy-runner-python-tmp");
        Path libDir = Files.createTempDirectory("strategy-runner-python-lib");
        Path entryFile = workspace.resolve("main.py");
        Path helperFile = workspace.resolve("helpers.py");
        Path projectRoot = Path.of("").toAbsolutePath();
        Path entrypoint = projectRoot.resolve("docker/strategyContainer/entrypoint.sh");

        Files.writeString(helperFile, """
                def message():
                    return "python-ok"
                """, StandardCharsets.UTF_8);
        Files.writeString(entryFile, """
                from helpers import message

                print(message())
                """, StandardCharsets.UTF_8);

        ProcessBuilder processBuilder = new ProcessBuilder(
                "bash",
                entrypoint.toString(),
                "/opt/strategy/workspace/main.py"
        );
        processBuilder.directory(projectRoot.resolve("src/test").toFile());
        processBuilder.redirectErrorStream(true);
        processBuilder.environment().put("STRATEGY_WORKDIR", workspace.toString());
        processBuilder.environment().put("STRATEGY_TMP_DIR", tmpDir.toString());
        processBuilder.environment().put("STRATEGY_LIB_DIR", libDir.toString());
        processBuilder.environment().put("RUN_TIMEOUT_SECONDS", "30");

        Process process = processBuilder.start();

        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        assertThat(exitCode)
                .withFailMessage("Entrypoint should run python workspace source successfully:%n%s", output)
                .isZero();
        assertThat(output).contains("[strategy-runner] Starting main.py");
        assertThat(output).contains("python-ok");
    }

    @Test
    void liveStrategyRunnerImageProvidesPython3() throws Exception {
        assumeTrue(commandSucceeds("docker", "image", "inspect", "strategy-runner:latest"),
                "strategy-runner:latest image is required for this smoke test");

        Process process = new ProcessBuilder(
                "docker", "run", "--rm", "strategy-runner:latest",
                "sh", "-lc", "python3 --version"
        ).redirectErrorStream(true).start();

        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        assertThat(exitCode)
                .withFailMessage("strategy-runner image should provide python3:%n%s", output)
                .isZero();
        assertThat(output).contains("Python");
    }

    @Test
    void liveStrategyRunnerImageExecutesPythonWorkspaceStrategy() throws Exception {
        assumeTrue(commandSucceeds("docker", "image", "inspect", "strategy-runner:latest"),
                "strategy-runner:latest image is required for this smoke test");

        Path workspace = Files.createTempDirectory("strategy-runner-live-python-workspace");
        Path entryFile = workspace.resolve("main.py");
        Path helperFile = workspace.resolve("helpers.py");
        workspace.toFile().setReadable(true, false);
        workspace.toFile().setExecutable(true, false);

        Files.writeString(helperFile, """
                #!/usr/bin/env python3
                def message():
                    return "python-ok"
                """, StandardCharsets.UTF_8);
        Files.writeString(entryFile, """
                #!/usr/bin/env python3
                from helpers import message

                print(message())
                """, StandardCharsets.UTF_8);
        helperFile.toFile().setReadable(true, false);
        helperFile.toFile().setExecutable(true, false);
        entryFile.toFile().setReadable(true, false);
        entryFile.toFile().setExecutable(true, false);

        Process process = new ProcessBuilder(
                "docker", "run", "--rm",
                "--network=none",
                "--read-only",
                "--tmpfs", "/opt/strategy/tmp:rw,noexec,nosuid,size=128m",
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=128m",
                "-v", workspace.toAbsolutePath() + ":/opt/strategy/workspace",
                "strategy-runner:latest",
                "/opt/strategy/workspace/main.py"
        ).redirectErrorStream(true).start();

        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        assertThat(exitCode)
                .withFailMessage("strategy-runner image should execute python workspace sources:%n%s", output)
                .isZero();
        assertThat(output).contains("[strategy-runner] Starting main.py");
        assertThat(output).contains("python-ok");
    }

    private boolean commandSucceeds(String... command) throws Exception {
        Process process = new ProcessBuilder(command)
                .redirectErrorStream(true)
                .start();
        process.getInputStream().transferTo(OutputStream.nullOutputStream());
        return process.waitFor() == 0;
    }
}
