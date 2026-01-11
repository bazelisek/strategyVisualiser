package cz.vko.stockstrategy.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.ZonedDateTime;

@Getter
@Setter
@ToString
public class Feed {
    private String ticker;
	private ZonedDateTime endTime;
	private Double open;
	private Double high;
	private Double low;
	private Double close;
	private Double volume;
	private Double openInt;
}
