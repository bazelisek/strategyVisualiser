package cz.vko.stockstrategy.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI stockStrategyOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Stock Strategy API")    
                        .description("REST API for managing trading strategies, market data, and analysis jobs.")
                        .version("v1")
                        .contact(new Contact().name("Stock Strategy Server")))
                .servers(List.of(new Server()
                        .url("http://localhost:8080")
                        .description("Local development server")));
    }
}
