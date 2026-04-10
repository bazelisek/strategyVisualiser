package cz.vko.stockstrategy.containerService;
import java.nio.file.Paths;
import java.nio.file.Files;
import cz.vko.stockstrategy.model.AnalysisJob;

public class StartContainerService {
    public static void startAnalysisContainer(AnalysisJob job) {
        try {
            Files.createDirectories(Paths.get("/opt/strategy/workspace"));
        } catch (Exception e) {
            throw new RuntimeException("Failed to create container directories", e);
        }
        try {
            Files.deleteIfExists(Paths.get("/opt/strategy/workspace/MyStrategy.java"));
        }
        catch (Exception e) {
            throw new RuntimeException("Failed to clean up container workspace", e);
        }
    }
}
