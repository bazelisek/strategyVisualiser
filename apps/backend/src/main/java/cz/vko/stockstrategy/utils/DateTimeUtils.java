package cz.vko.stockstrategy.utils;

import org.ta4j.core.Indicator;
import org.ta4j.core.num.Num;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import static java.time.temporal.ChronoUnit.DAYS;

public class DateTimeUtils {
	private static final String GMT_ZONE = "GMT";
	private static final String PRAGUE_EUROPE_ZONE = "Europe/Prague";

	//private static DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd HHmmss");;
	private static DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd HHmmss");
	;
	private static DateTimeFormatter formatter2 = DateTimeFormatter.ofPattern("yyyy-MM-dd HHmmss");
	;
	private static DateTimeFormatter formatter_date = DateTimeFormatter.ofPattern("yyyy.MM.dd");

	private static DateTimeFormatter formatter_date_compact = DateTimeFormatter.ofPattern("yyyyMMdd");

	public static ZonedDateTime toDate(String dateTimeStr) {
		if (dateTimeStr.contains("-")) {
			return toDate2(dateTimeStr);
		}
		if (dateTimeStr.length() == 8) {
			dateTimeStr = dateTimeStr + " 000000";
		}
		LocalDateTime ldt = LocalDateTime.parse(dateTimeStr, formatter);
		ZonedDateTime gmtZonedDateTime = ldt.atZone(ZoneId.of(GMT_ZONE));
		return gmtZonedDateTime.withZoneSameInstant(ZoneId.of(PRAGUE_EUROPE_ZONE)).truncatedTo(DAYS);
	}

	public static ZonedDateTime toDate2(String dateTimeStr) {
		if (dateTimeStr.length() == 10) {
			dateTimeStr = dateTimeStr + " 000000";
		}
		LocalDateTime ldt = LocalDateTime.parse(dateTimeStr, formatter2);
		ZonedDateTime gmtZonedDateTime = ldt.atZone(ZoneId.of(GMT_ZONE));
		return gmtZonedDateTime.withZoneSameInstant(ZoneId.of(PRAGUE_EUROPE_ZONE)).truncatedTo(DAYS);
	}


	public static String getDate(Indicator<Num> close, int index) {
		ZonedDateTime date = close.getBarSeries().getBar(index).getEndTime().atZone(ZoneId.systemDefault());
		return formatter_date.format(date);
	}

	public static String getDate(ZonedDateTime date) {
		return formatter_date.format(date);
	}

	public static String getDateCompact(ZonedDateTime date) {
		return formatter_date_compact.format(date);
	}

}
