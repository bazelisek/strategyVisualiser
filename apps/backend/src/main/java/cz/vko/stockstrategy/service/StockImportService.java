package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.StockDataDao;
import cz.vko.stockstrategy.model.StockData;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Service
@Slf4j
public class StockImportService {

    @Value("${loader.dataDirPath}")
    private String dataDir;

    private final StockDataDao dao;

    public StockImportService(StockDataDao dao) {
        this.dao = dao;
    }

    public void importFromDirectory() {
        try {
            Path dir = Paths.get(dataDir);
            if (!Files.exists(dir) || !Files.isDirectory(dir)) {
                throw new IllegalArgumentException("Invalid directory: " + dataDir);
            }

            Files.walk(dir)
                    .filter(path -> path.toString().endsWith(".csv"))
                    .forEach(this::importFromFile);

        } catch (IOException e) {
            throw new RuntimeException("Error reading directory: " + dataDir, e);
        }
    }

    private void importFromFile(Path filePath) {
        log.info("Processing file: " + filePath.getFileName());
        try (BufferedReader reader = Files.newBufferedReader(filePath)) {
            String header = reader.readLine(); // skip header line
            if (header == null || !header.startsWith("Ticker")) {
                log.info("Skipping file with invalid header: " + filePath);
                return;
            }

            String line;
            while ((line = reader.readLine()) != null) {
                StockData record = parseLine(line);
                if (record == null) continue;

                if (!dao.exists(record.getTicker(), record.getPeriod(), record.getTradeDate(), record.getTradeTime())) {
                    dao.insert(record);
                }
            }

        } catch (IOException e) {
            log.error("Error reading file: " + filePath + " - " + e.getMessage());
        }
    }

    private StockData parseLine(String line) {
        try {
            String[] parts = line.split(",");
            if (parts.length < 9) return null;

            StockData s = new StockData();
            s.setTicker(parts[0]);
            s.setPeriod(parts[1]);
            s.setTradeDate(LocalDate.parse(parts[2], java.time.format.DateTimeFormatter.ISO_LOCAL_DATE));
            s.setTradeTime(LocalTime.ofSecondOfDay(0)); // “000000” is midnight
            s.setOpen(new BigDecimal(parts[4]));
            s.setHigh(new BigDecimal(parts[5]));
            s.setLow(new BigDecimal(parts[6]));
            s.setClose(new BigDecimal(parts[7]));
            s.setVolume(Long.parseLong(parts[8]));

            return s;
        } catch (Exception e) {
            log.error("Failed to parse line: " + line + " -> " + e.getMessage());
            return null;
        }
    }
}

