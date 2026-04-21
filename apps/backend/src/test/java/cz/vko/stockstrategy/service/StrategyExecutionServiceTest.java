package cz.vko.stockstrategy.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class StrategyExecutionServiceTest {

    @Test
    void containerWorkspacePathUsesMountedWorkspaceLocation() {
        Path hostSource = Path.of("/tmp/strategyVisualizer/job_42/StrategyMain.java");

        assertThat(StrategyExecutionService.containerWorkspacePath(hostSource))
                .isEqualTo("/opt/strategy/workspace/StrategyMain.java");
    }

    @Test
    void workspaceVolumeSuffixRelabelsForPodmanOrSelinux() {
        assertThat(StrategyExecutionService.workspaceVolumeSuffix("docker", false)).isEmpty();
        assertThat(StrategyExecutionService.workspaceVolumeSuffix("podman", false)).isEqualTo(":Z");
        assertThat(StrategyExecutionService.workspaceVolumeSuffix("docker", true)).isEqualTo(":Z");
    }

    @Test
    void entrypointResolvesRelativeSourceAgainstWorkspace() throws Exception {
        Path workspace = Files.createTempDirectory("strategy-runner-workspace");
        Path tmpDir = Files.createTempDirectory("strategy-runner-tmp");
        Path libDir = Files.createTempDirectory("strategy-runner-lib");
        Path sourceFile = workspace.resolve("StrategyMain.java");
        Path projectRoot = Path.of("").toAbsolutePath();
        Path entrypoint = projectRoot.resolve("docker/strategyContainer/entrypoint.sh");

        Files.writeString(sourceFile, """
                public class StrategyMain {
                    public static void main(String[] args) {
                        System.out.println("ok");
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
    }
}
