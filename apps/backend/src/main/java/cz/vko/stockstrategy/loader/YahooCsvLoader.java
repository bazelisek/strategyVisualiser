package cz.vko.stockstrategy.loader;

import cz.vko.stockstrategy.dto.Feed;
import cz.vko.stockstrategy.utils.DateTimeUtils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseBar;
import org.ta4j.core.BaseBarSeriesBuilder;
import yahoofinance.Stock;
import yahoofinance.YahooFinance;
import yahoofinance.histquotes.HistoricalQuote;
import yahoofinance.histquotes.Interval;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static java.time.temporal.ChronoUnit.DAYS;

/**
 * Data loader for https://finance.yahoo.com/quote/ sources
 */
@Service
@Configuration
@Slf4j
public class YahooCsvLoader {

	private static final String DELIMITER = ",";

	private static final String HEADER = "<TICKER>,<PER>,<DATE>,<TIME>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>,<OPENINT>";

	private static final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd");

	@Value("${loader.dataDirPath}")
	private String dataDirPath;

	@Value("${loader.downloadMissingData}")
	private boolean downloadMissingData;

	@Value("${loader.downloadMissingBeforeData}")
	private boolean downloadMissingBeforeData;

	@Value("${loader.downloadMissingAfterData}")
	private boolean downloadMissingAfterData;

	private DecimalFormat df;


	@PostConstruct
	public void init() {
		df = new DecimalFormat();
		DecimalFormatSymbols dfSymbols = new DecimalFormatSymbols();
		dfSymbols.setDecimalSeparator('.');
		df.setDecimalFormatSymbols(dfSymbols);
	}

	public Map<String, BarSeries> loadBarSeriesStockData(String ticker, ZonedDateTime from, ZonedDateTime to) {
		Map<String, BarSeries> seriesList = new HashMap<>();
		BarSeries barSeries;

		try (Scanner scanner = new Scanner(new File(dataDirPath + "/" + ticker + ".csv"));) {
			while (scanner.hasNextLine()) {
				String line = scanner.nextLine();
				if (line.startsWith("<TICKER>") || line.startsWith("Ticker")) {
					continue;
				}
				Feed feed = getFeedFromLine(line);

				// skip empty feed and feeds out of interval
				if ( feed == null
						|| from != null && from.isAfter(feed.getEndTime())
						|| to != null && to.isBefore(feed.getEndTime()) ) {
					continue;
				}
				if (seriesList.containsKey(feed.getTicker())) {
					barSeries = seriesList.get(feed.getTicker());
				} else {
					barSeries = new BaseBarSeriesBuilder().withName(feed.getTicker()).build();
					seriesList.put(barSeries.getName(), barSeries);
				}
				//log.info("{} - {}", ticker, feed);
				barSeries.addBar(barSeries.barBuilder()
                                .timePeriod(Duration.ofDays(1))
                                .endTime(feed.getEndTime().toInstant())
                                .openPrice(feed.getOpen())
                                .highPrice(feed.getHigh())
                                .lowPrice(feed.getLow())
                                .closePrice(feed.getClose())
                                .volume(feed.getVolume())
                                .build());
			}
		} catch (FileNotFoundException e) {
			log.error("File for ticker {} not found", ticker);
		}

		return seriesList;
	}

	public BarSeries loadAndUpdateBarSeriesStockData(String ticker, ZonedDateTime from, ZonedDateTime to) {
		BarSeries barSeries;
		List<Feed> feedList;

		barSeries = new BaseBarSeriesBuilder().withName(ticker).build();
		feedList = loadFeeds(ticker, from, to);

		feedList.forEach( f -> {
            barSeries.addBar(barSeries.barBuilder()
                    .timePeriod(Duration.ofDays(1))
                    .endTime(f.getEndTime().toInstant())
                    .openPrice(f.getOpen())
                    .highPrice(f.getHigh())
                    .lowPrice(f.getLow())
                    .closePrice(f.getClose())
                    .volume(f.getVolume())
                    .build());
		});

		return barSeries;
	}

    private List<Feed> loadFeeds(String ticker, ZonedDateTime from, ZonedDateTime to) {
		List<Feed> feedList = new ArrayList<>();
		try (Scanner scanner = new Scanner(new File(dataDirPath + "/" + ticker + ".csv"));) {
			while (scanner.hasNextLine()) {
				String line = scanner.nextLine();
				if (line.startsWith("<TICKER>") || line.startsWith("Ticker")) {
					continue;
				}
				Feed feed = getFeedFromLine(line);
				// skip empty feed and feeds out of interval
				if ( feed == null
						|| from != null && from.isAfter(feed.getEndTime())
						|| to != null && to.isBefore(feed.getEndTime()) ) {
					continue;
				}

				feedList.add(feed);
			}
		} catch (FileNotFoundException e) {
			log.error("File for ticker {} not found", ticker);
		}
		feedList = updateMissingValuesFromYahoo(ticker, feedList, from, to);
		return feedList;
	}


	private List<Feed> updateMissingValuesFromYahoo(String symbol, List<Feed> feedFileList,  ZonedDateTime from, ZonedDateTime to) {
		ZonedDateTime minDate = feedFileList.isEmpty() ? null : feedFileList.get(0).getEndTime();
		ZonedDateTime maxDate = feedFileList.isEmpty() ? null : feedFileList.get(feedFileList.size()-1).getEndTime();
		List<Feed> feedBeforeList = new ArrayList<>();
		List<Feed> feedAfterList = new ArrayList<>();
		List<Feed> feedList = new ArrayList<>();

		if (!downloadMissingData) {
			return feedFileList;
		}

		from.truncatedTo(DAYS);
		to.truncatedTo(DAYS);

		if (feedFileList.isEmpty()) {
			feedList = downloadFeeds(symbol, toCalendar(from), toCalendar(to));
		} else {
//			log.info("=============");
//			log.info("from={}", from);
//			log.info("to={}", to);
//			log.info("minDate={}", minDate);
//			log.info("maxDate={}", maxDate);
			if (downloadMissingBeforeData && from.isBefore(minDate)) {
				feedBeforeList = downloadFeeds(symbol, toCalendar(from.minusDays(5)), toCalendar(minDate.plusDays(5)));
			}
			if (downloadMissingAfterData && maxDate.isBefore(to)) {
				feedAfterList = downloadFeeds(symbol, toCalendar(maxDate.minusDays(5)), toCalendar(to.plusDays(5)));
			}
			for (Feed feed: feedBeforeList) {
				if (feed.getEndTime().isAfter(from) || feed.getEndTime().isEqual(from)) {
					feedList.add(feed);
				}
			};
			for (Feed feed: feedFileList) {
				if (feedList.isEmpty()) {
					feedList.add(feed);
				}
				if (feed.getEndTime().isAfter(feedList.get(feedList.size()-1).getEndTime())) {
					feedList.add(feed);
				}
			}
			for (Feed feed: feedAfterList) {
				if (feed.getEndTime().isAfter(to)) {
					break;
				}
				if (feed.getEndTime().isAfter(feedList.get(feedList.size()-1).getEndTime())) {
					feedList.add(feed);
				}
			}
		}

		saveFeeds(symbol,feedList);

		return feedList;
	}

	private Calendar toCalendar(ZonedDateTime zonedDateTime) {
		return GregorianCalendar.from(zonedDateTime);
	}

	private List<Feed> downloadFeeds(String symbol, Calendar from, Calendar to) {
		List<Feed> feedList = new ArrayList<>();
		try {
			log.info("... Load {} date from {} to {}", symbol, from.toInstant(), to.toInstant());
			Stock data = YahooFinance.get(symbol, from, to, Interval.DAILY);
			if (data != null) {
				feedList = getFeedFromQuote(symbol, data.getHistory());
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
		return feedList;
	}


	private List<Feed> getFeedFromQuote(String ticker, List<HistoricalQuote> quotes) {
		List<Feed> feedList = new ArrayList<>();

		for (HistoricalQuote quote: quotes) {
			if (quote.getClose() == null || quote.getLow() == null || quote.getHigh() == null || quote.getOpen() == null || quote.getVolume() == null ) {
				continue;
			}
			Feed feed = new Feed();
			feed.setTicker(ticker);
			feed.setEndTime(quote.getDate().toInstant().atZone(ZoneId.systemDefault()).truncatedTo(DAYS));
			feed.setOpen(quote.getOpen().doubleValue());
			feed.setHigh(quote.getHigh().doubleValue());
			feed.setLow(quote.getLow().doubleValue());
			feed.setClose(quote.getClose().doubleValue());
			feed.setVolume(quote.getVolume().doubleValue());
			feedList.add(feed);
		}

		return feedList;
	}

	private void saveFeeds(String symbol, List<Feed> feedList) {
		String pathStr = "data/yahoo/" + symbol + ".csv";
		Path path = Paths.get(pathStr);
		DateTimeFormatter format = DateTimeFormatter.ofPattern("yyyyMMdd");

		List<String> lines = new ArrayList<>();
		lines.add(HEADER);

		//<TICKER>,<PER>,<DATE>,<TIME>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>,<OPENINT>
		//AAXJ.US,D,20080815,000000,42.297,42.297,42.297,42.297,120,0
		feedList.forEach( f -> {
			StringBuffer line = new StringBuffer();
			line
					.append(f.getTicker())
					.append(",")
					.append("D")
					.append(",")
					.append(f.getEndTime().toLocalDate().format(format))
					.append(",")
					.append("000000")
					.append(",")
					.append(f.getOpen())
					.append(",")
					.append(f.getHigh())
					.append(",")
					.append(f.getLow())
					.append(",")
					.append(f.getClose())
					.append(",")
					.append(f.getVolume())
					.append(",")
					.append("0");
			lines.add(line.toString());
		});
		try {
			Files.deleteIfExists(path);
			Files.write(path, lines);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private Feed getFeedFromLine(String line) {
		String ticker;
		List<String> values = new ArrayList<String>();
		try (Scanner rowScanner = new Scanner(line)) {
			rowScanner.useDelimiter(DELIMITER);
			while (rowScanner.hasNext()) {
				values.add(rowScanner.next());
			}
		}
		// <TICKER>,<PER>,<DATE>,<TIME>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>,<OPENINT>
		// ATVI.US,D,20050225,000000,5.58,5.6344,5.5527,5.6075,8300918,0
		// ATVI.US,D,20050228,000000,5.5891,5.6801,5.571,5.5891,8125636,0
		// ATVI.US,D,20050301,000000,5.6163,5.7345,5.5891,5.7254,10154870,0
		// ATVI.US,D,20050302,000000,5.7437,5.8617,5.6708,5.8345,7692478,0

		// Parse ticker
		ticker = values.get(0);
		if (values.get(0).contains(".")) {
			ticker = values.get(0).substring(0, values.get(0).indexOf("."));
		}
		if (values.get(4) == null || values.get(4).contains("null")) {
			return null;
		}

		Feed feed = new Feed();
		feed.setTicker(ticker);
		feed.setEndTime(DateTimeUtils.toDate(values.get(2) + " " + values.get(3)));
		feed.setOpen(toDouble(values.get(4)));
		feed.setHigh(toDouble(values.get(5)));
		feed.setLow(toDouble(values.get(6)));
		feed.setClose(toDouble(values.get(7)));
		feed.setVolume(toDouble(values.get(8)));

		return feed;
	}

	private Double toDouble(String doubleStr) {
		try {
			return df.parse(doubleStr).doubleValue();
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return null;
	}
}
