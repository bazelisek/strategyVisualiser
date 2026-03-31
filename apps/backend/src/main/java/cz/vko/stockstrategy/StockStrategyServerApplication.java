package cz.vko.stockstrategy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class StockStrategyServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(StockStrategyServerApplication.class, args);
	}

}
