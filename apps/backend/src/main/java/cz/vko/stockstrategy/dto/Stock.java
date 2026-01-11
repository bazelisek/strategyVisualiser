package cz.vko.stockstrategy.dto;

import lombok.Getter;
import lombok.Setter;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;
import org.ta4j.core.indicators.ATRIndicator;
import org.ta4j.core.indicators.CCIIndicator;
import org.ta4j.core.indicators.averages.EMAIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.num.Num;

import java.time.ZoneId;
import java.time.ZonedDateTime;

@Getter
@Setter
public class Stock {
    private BarSeries barSeries;
    private ZonedDateTime date;
    private ATRIndicator atrIndicator;
    private CCIIndicator cciIndicator;
    private CCIIndicator cciLongIndicator;
    private EMAIndicator emaIndicator;
    private EMAIndicator emaLongIndicator;

    private int index;
    private int firstIndex;

    public Stock(BarSeries barSeries, int atrBarCount, int emaPeriod, int emaLongPeriod) {
        firstIndex = atrBarCount - 1;

        this.barSeries = barSeries;
        this.date = barSeries.getBar(firstIndex).getEndTime().atZone(ZoneId.systemDefault());
        this.atrIndicator = new ATRIndicator(this.barSeries, atrBarCount);
        this.emaIndicator = new EMAIndicator(new ClosePriceIndicator(barSeries), emaPeriod);
        this.emaLongIndicator = new EMAIndicator(new ClosePriceIndicator(barSeries), emaLongPeriod);

        this.index = firstIndex;
    }

    public boolean next() {
        if (index < barSeries.getEndIndex()) {
            this.index++;
            this.date = barSeries.getBar(index).getEndTime().atZone(ZoneId.systemDefault());
            return true;
        }
        return false;
    }

    public Bar getBar() {
        return barSeries.getBar(index);
    }

    public Num getAtr() {
        return atrIndicator.getValue(index);
    }

    public String getName() {
        return this.barSeries.getName();
    }

    public void initializeIndex() {
        this.index = this.firstIndex;
        this.date = this.barSeries.getBar(this.firstIndex).getEndTime().atZone(ZoneId.systemDefault());
    }
}
