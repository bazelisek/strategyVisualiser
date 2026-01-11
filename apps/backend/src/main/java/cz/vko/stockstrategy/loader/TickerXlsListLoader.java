package cz.vko.stockstrategy.loader;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Scanner;

@Service
@Configuration
public class TickerXlsListLoader {

    @Value("${loader.symbolXlsxPath}")
    private String symbolXlsxPath;

    @Value("${loader.symbolTxtPath}")
    private String symbolTxtPath;

    public List<String> loadSymbols() {
        List<String> symbols = new ArrayList<>();
        try {
            FileInputStream excelFile = new FileInputStream(new File(symbolXlsxPath));
            Workbook workbook = new XSSFWorkbook(excelFile);
            Sheet datatypeSheet = workbook.getSheet("Data");
            Iterator<Row> rows = datatypeSheet.iterator();
            while (rows.hasNext()) {
                Row currentRow = rows.next();
                if (currentRow.getRowNum() == 0) {
                    continue;
                }
                Iterator<Cell> cells = currentRow.iterator();
                if (cells.hasNext()) {
                    Cell currentCell = cells.next();
                    if (currentCell.getCellType() == CellType.STRING) {
                        symbols.add(currentCell.getStringCellValue());
                    }
                }
            }
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return symbols;
    }


    public List<String> loadSymbolsTxt() {
        List<String> symbols = new ArrayList<>();
        Scanner scanner = null;
        try {
            scanner = new Scanner(new File(symbolTxtPath));
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine();
                symbols.add(line);
            }
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
        return symbols;
    }
}
