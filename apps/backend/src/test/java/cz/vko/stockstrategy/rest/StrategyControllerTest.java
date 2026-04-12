package cz.vko.stockstrategy.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.dto.StrategyCreateDTO;
import cz.vko.stockstrategy.dto.StrategyDTO;
import cz.vko.stockstrategy.model.Strategy;
import cz.vko.stockstrategy.service.AnalysisJobService;
import cz.vko.stockstrategy.service.StrategyService;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StrategyController.class)
class StrategyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StrategyService strategyService;

    @MockBean
    private AnalysisJobService analysisJobService;

    @Test
    void getAllStrategiesReturnsDtos() throws Exception {
        StrategyDTO first = new StrategyDTO();
        first.setId(1L);
        first.setName("Momentum");
        first.setDescription("Trend following");
        first.setCreatedAt(LocalDateTime.of(2026, 4, 2, 18, 0));
        first.setUpdatedAt(LocalDateTime.of(2026, 4, 2, 18, 5));

        StrategyDTO second = new StrategyDTO();
        second.setId(2L);
        second.setName("Mean Reversion");
        second.setDescription("Counter-trend");
        second.setCreatedAt(LocalDateTime.of(2026, 4, 2, 18, 10));
        second.setUpdatedAt(LocalDateTime.of(2026, 4, 2, 18, 15));

        when(strategyService.getPublicStrategies()).thenReturn(List.of(first, second));

        mockMvc.perform(get("/api/strategies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Momentum"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].name").value("Mean Reversion"));
    }

    @Test
    void createStrategyReturnsCreatedStrategy() throws Exception {
        Strategy savedStrategy = new Strategy();
        savedStrategy.setId(42L);
        savedStrategy.setName("Momentum");
        savedStrategy.setDescription("Test strategy");
        savedStrategy.setCode("return true;");
        savedStrategy.setConfiguration("{\"window\":20}");
        savedStrategy.setCreatedAt(LocalDateTime.of(2026, 4, 2, 19, 30));
        savedStrategy.setUpdatedAt(LocalDateTime.of(2026, 4, 2, 19, 30));

        when(strategyService.createStrategy(any(StrategyCreateDTO.class))).thenReturn(savedStrategy);

        String payload = """
                {
                  "id": 999,
                  "name": "Momentum",
                  "description": "Test strategy",
                  "code": "return true;",
                  "configuration": "{\\"window\\":20}",
                  "createdAt": "2026-04-02T19:00:00",
                  "updatedAt": "2026-04-02T19:00:00"
                }
                """;

        mockMvc.perform(post("/api/strategies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.name").value("Momentum"))
                .andExpect(jsonPath("$.description").value("Test strategy"))
                .andExpect(jsonPath("$.code").value("return true;"))
                .andExpect(jsonPath("$.configuration").value("{\"window\":20}"));

        ArgumentCaptor<StrategyCreateDTO> captor = ArgumentCaptor.forClass(StrategyCreateDTO.class);
        verify(strategyService).createStrategy(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Momentum");
        assertThat(captor.getValue().getDescription()).isEqualTo("Test strategy");
        assertThat(captor.getValue().getCode()).isEqualTo("return true;");
        assertThat(captor.getValue().getConfiguration()).isEqualTo("{\"window\":20}");
    }

    @Test
    void getStrategyReturnsStrategyWhenPresent() throws Exception {
        Strategy strategy = new Strategy();
        strategy.setId(7L);
        strategy.setName("Breakout");
        strategy.setDescription("Breakout strategy");
        strategy.setCode("return close > high;");
        strategy.setConfiguration("{\"lookback\":10}");

        when(strategyService.getStrategyById(7L)).thenReturn(Optional.of(strategy));

        mockMvc.perform(get("/api/strategies/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.name").value("Breakout"))
                .andExpect(jsonPath("$.code").value("return close > high;"));
    }

    @Test
    void getStrategyReturnsNotFoundWhenMissing() throws Exception {
        when(strategyService.getStrategyById(9L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/strategies/9"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteStrategyReturnsNoContentWhenPresent() throws Exception {
        Strategy strategy = new Strategy();
        strategy.setId(11L);
        strategy.setName("Carry");

        when(strategyService.getStrategyById(11L)).thenReturn(Optional.of(strategy));

        mockMvc.perform(delete("/api/strategies/11"))
                .andExpect(status().isNoContent());

        verify(strategyService).deleteStrategy(11L);
    }

    @Test
    void deleteStrategyReturnsNotFoundWhenMissing() throws Exception {
        when(strategyService.getStrategyById(12L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/strategies/12"))
                .andExpect(status().isNotFound());

        verify(strategyService, never()).deleteStrategy(12L);
    }

    @Test
    @Disabled("Endpoint is not implemented yet; enable once analysis execution is fully supported.")
    void analyzeStrategyAcceptsAnalysisJob() throws Exception {
        mockMvc.perform(post("/api/strategies/5/analyze"))
                .andExpect(status().isAccepted());
    }
}
