package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.model.StrategySourceFile;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StrategySourceFilesTest {

    @Test
    void resolveInfersPythonRuntimeForSingleSourceFile() {
        StrategySourceFiles.ResolvedStrategySources resolved = StrategySourceFiles.resolve(
                List.of(new StrategySourceFile("main.py", "print('ok')")),
                null,
                null,
                null
        );

        assertThat(resolved.runtime()).isEqualTo(StrategySourceFiles.PYTHON_RUNTIME);
        assertThat(resolved.entryFile()).isEqualTo("main.py");
        assertThat(resolved.code()).isEqualTo("print('ok')");
    }

    @Test
    void resolveUsesConventionEntryFileForMultipleJavaSources() {
        StrategySourceFiles.ResolvedStrategySources resolved = StrategySourceFiles.resolve(
                List.of(
                        new StrategySourceFile("StrategyMain.java", "public class StrategyMain {}"),
                        new StrategySourceFile("IndicatorUtils.java", "class IndicatorUtils {}")
                ),
                null,
                null,
                null
        );

        assertThat(resolved.runtime()).isEqualTo(StrategySourceFiles.JAVA_RUNTIME);
        assertThat(resolved.entryFile()).isEqualTo("StrategyMain.java");
    }

    @Test
    void resolveRejectsMixedRuntimes() {
        assertThatThrownBy(() -> StrategySourceFiles.resolve(
                List.of(
                        new StrategySourceFile("StrategyMain.java", "public class StrategyMain {}"),
                        new StrategySourceFile("main.py", "print('nope')")
                ),
                null,
                null,
                null
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("same runtime");
    }

    @Test
    void javaMainClassIncludesPackageName() {
        assertThat(StrategySourceFiles.javaMainClass(
                "src/com/acme/StrategyMain.java",
                """
                package com.acme;

                public class StrategyMain {
                }
                """
        )).isEqualTo("com.acme.StrategyMain");
    }
}
