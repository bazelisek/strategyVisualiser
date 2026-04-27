package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.model.StrategySourceFile;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class StrategySourceFiles {

    public static final String JAVA_RUNTIME = "java";
    public static final String PYTHON_RUNTIME = "python";
    public static final String DEFAULT_JAVA_ENTRY_FILE = "StrategyMain.java";
    private static final List<String> DEFAULT_PYTHON_ENTRY_FILES = List.of("main.py", "StrategyMain.py", "__main__.py");
    private static final Pattern JAVA_PACKAGE_PATTERN =
            Pattern.compile("(?m)^\\s*package\\s+([a-zA-Z_][\\w.]*)\\s*;");
    private static final TypeReference<List<StrategySourceFile>> SOURCE_FILE_LIST_TYPE = new TypeReference<>() {
    };

    private StrategySourceFiles() {
    }

    public static ResolvedStrategySources resolve(
            List<StrategySourceFile> sourceFiles,
            String legacyCode,
            String requestedEntryFile,
            String requestedRuntime
    ) {
        List<StrategySourceFile> normalizedFiles = normalizeFiles(sourceFiles, legacyCode);
        if (normalizedFiles.isEmpty()) {
            throw new IllegalArgumentException("At least one strategy source file is required.");
        }

        String runtime = normalizeRuntime(requestedRuntime);
        Set<String> detectedRuntimes = new LinkedHashSet<>();
        for (StrategySourceFile sourceFile : normalizedFiles) {
            detectedRuntimes.add(runtimeFromPath(sourceFile.path()));
        }
        if (detectedRuntimes.size() != 1) {
            throw new IllegalArgumentException("Strategy source files must all use the same runtime.");
        }

        String detectedRuntime = detectedRuntimes.iterator().next();
        if (runtime == null) {
            runtime = detectedRuntime;
        } else if (!Objects.equals(runtime, detectedRuntime)) {
            throw new IllegalArgumentException("Strategy runtime does not match the uploaded source files.");
        }

        String entryFile = inferEntryFile(normalizedFiles, runtime, requestedEntryFile);
        StrategySourceFile entrySourceFile = normalizedFiles.stream()
                .filter(file -> file.path().equals(entryFile))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Entry file was not found in the uploaded source files."));

        return new ResolvedStrategySources(
                runtime,
                entryFile,
                entrySourceFile.content(),
                List.copyOf(normalizedFiles)
        );
    }

    public static String javaMainClass(String entryFile, String entryFileContent) {
        String className = stripExtension(Path.of(entryFile).getFileName().toString());
        Matcher matcher = JAVA_PACKAGE_PATTERN.matcher(entryFileContent == null ? "" : entryFileContent);
        if (!matcher.find()) {
            return className;
        }
        return matcher.group(1) + "." + className;
    }

    public static String serialize(ObjectMapper objectMapper, List<StrategySourceFile> sourceFiles) {
        try {
            return objectMapper.writeValueAsString(sourceFiles == null ? List.of() : sourceFiles);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Unable to serialize strategy source files.", e);
        }
    }

    public static List<StrategySourceFile> deserialize(ObjectMapper objectMapper, String rawSourceFiles) {
        if (rawSourceFiles == null || rawSourceFiles.isBlank()) {
            return List.of();
        }

        try {
            List<StrategySourceFile> sourceFiles = objectMapper.readValue(rawSourceFiles, SOURCE_FILE_LIST_TYPE);
            return sourceFiles == null ? List.of() : sourceFiles;
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Unable to deserialize strategy source files.", e);
        }
    }

    private static List<StrategySourceFile> normalizeFiles(List<StrategySourceFile> sourceFiles, String legacyCode) {
        List<StrategySourceFile> effectiveFiles = new ArrayList<>();
        if (sourceFiles != null) {
            effectiveFiles.addAll(sourceFiles);
        }
        if (effectiveFiles.isEmpty() && legacyCode != null && !legacyCode.isBlank()) {
            effectiveFiles.add(new StrategySourceFile(DEFAULT_JAVA_ENTRY_FILE, legacyCode));
        }

        Map<String, StrategySourceFile> deduped = new LinkedHashMap<>();
        for (StrategySourceFile sourceFile : effectiveFiles) {
            if (sourceFile == null) {
                continue;
            }
            String normalizedPath = normalizePath(sourceFile.path());
            String normalizedContent = sourceFile.content() == null ? "" : sourceFile.content();
            if (deduped.putIfAbsent(normalizedPath, new StrategySourceFile(normalizedPath, normalizedContent)) != null) {
                throw new IllegalArgumentException("Duplicate strategy source file path: " + normalizedPath);
            }
        }
        return List.copyOf(deduped.values());
    }

    private static String inferEntryFile(
            List<StrategySourceFile> sourceFiles,
            String runtime,
            String requestedEntryFile
    ) {
        if (requestedEntryFile != null && !requestedEntryFile.isBlank()) {
            String normalizedRequestedEntryFile = normalizePath(requestedEntryFile);
            boolean exists = sourceFiles.stream().anyMatch(file -> file.path().equals(normalizedRequestedEntryFile));
            if (!exists) {
                throw new IllegalArgumentException("Entry file " + normalizedRequestedEntryFile + " was not uploaded.");
            }
            return normalizedRequestedEntryFile;
        }

        if (sourceFiles.size() == 1) {
            return sourceFiles.get(0).path();
        }

        List<String> candidates = sourceFiles.stream()
                .map(StrategySourceFile::path)
                .filter(path -> isDefaultEntryCandidate(runtime, path))
                .toList();
        if (candidates.size() == 1) {
            return candidates.get(0);
        }

        throw new IllegalArgumentException("Multiple source files were uploaded. Please provide an entry file.");
    }

    private static boolean isDefaultEntryCandidate(String runtime, String path) {
        String fileName = Path.of(path).getFileName().toString();
        if (JAVA_RUNTIME.equals(runtime)) {
            return DEFAULT_JAVA_ENTRY_FILE.equals(fileName);
        }
        return DEFAULT_PYTHON_ENTRY_FILES.contains(fileName);
    }

    private static String normalizePath(String rawPath) {
        if (rawPath == null) {
            throw new IllegalArgumentException("Strategy source file path is required.");
        }

        String normalized = rawPath.replace('\\', '/').trim();
        while (normalized.startsWith("./")) {
            normalized = normalized.substring(2);
        }
        if (normalized.isBlank() || normalized.startsWith("/")) {
            throw new IllegalArgumentException("Strategy source file path must be a relative file path.");
        }

        String[] segments = normalized.split("/");
        for (String segment : segments) {
            if (segment.isBlank() || ".".equals(segment) || "..".equals(segment)) {
                throw new IllegalArgumentException("Strategy source file path contains an invalid segment: " + rawPath);
            }
        }

        String runtime = runtimeFromPath(normalized);
        if (!JAVA_RUNTIME.equals(runtime) && !PYTHON_RUNTIME.equals(runtime)) {
            throw new IllegalArgumentException("Only .java and .py strategy files are supported.");
        }

        return normalized;
    }

    private static String normalizeRuntime(String runtime) {
        if (runtime == null || runtime.isBlank()) {
            return null;
        }

        String normalized = runtime.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case JAVA_RUNTIME -> JAVA_RUNTIME;
            case PYTHON_RUNTIME, "py" -> PYTHON_RUNTIME;
            default -> throw new IllegalArgumentException("Unsupported strategy runtime: " + runtime);
        };
    }

    private static String runtimeFromPath(String path) {
        String normalized = path.toLowerCase(Locale.ROOT);
        if (normalized.endsWith(".java")) {
            return JAVA_RUNTIME;
        }
        if (normalized.endsWith(".py")) {
            return PYTHON_RUNTIME;
        }
        throw new IllegalArgumentException("Unsupported strategy source file: " + path);
    }

    private static String stripExtension(String fileName) {
        int extensionIndex = fileName.lastIndexOf('.');
        return extensionIndex >= 0 ? fileName.substring(0, extensionIndex) : fileName;
    }

    public record ResolvedStrategySources(
            String runtime,
            String entryFile,
            String code,
            List<StrategySourceFile> sourceFiles
    ) {
    }
}
