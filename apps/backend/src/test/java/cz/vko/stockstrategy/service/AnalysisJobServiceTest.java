package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.dto.AnalysisJobDTO;
import cz.vko.stockstrategy.dao.AnalysisJobDao;
import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.dto.AnalyzeStrategyRequestDTO;
import cz.vko.stockstrategy.model.AnalysisJob;
import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.model.Strategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalysisJobServiceTest {

    @Mock
    private AnalysisJobDao analysisJobDao;

    @Mock
    private StrategyDao strategyDao;

    @Mock
    private StockDataService stockDataService;

    @Mock
    private YahooFinanceService yahooFinanceService;

    @Mock
    private StrategyExecutionService strategyExecutionService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AnalysisJobService analysisJobService;

    @BeforeEach
    void setUp() {
        analysisJobService = new AnalysisJobService(
                analysisJobDao,
                strategyDao,
                stockDataService,
                yahooFinanceService,
                strategyExecutionService,
                objectMapper
        );
    }

    @Test
    void createAnalysisJobReusesExactRangeMatch() {
        Strategy strategy = strategyWithConfiguration();
        when(strategyDao.findById(9L)).thenReturn(Optional.of(strategy));

        AnalysisJob existing = completedJob(111L, "sig-1", LocalDate.parse("2024-01-01"), LocalDate.parse("2024-02-01"));
        when(analysisJobDao.findCompletedByExactRange(eq(9L), any(), eq(LocalDate.parse("2024-01-01")), eq(LocalDate.parse("2024-02-01"))))
                .thenReturn(Optional.of(existing));
        when(analysisJobDao.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AnalyzeStrategyRequestDTO request = new AnalyzeStrategyRequestDTO();
        request.setFromDate(LocalDate.parse("2024-01-01"));
        request.setToDate(LocalDate.parse("2024-02-01"));
        request.setConfig(Map.of("lookback", 42));

        AnalysisJob created = analysisJobService.createAnalysisJob(9L, request);

        assertThat(created.getStatus()).isEqualTo("completed");
        assertThat(created.getReusedFromJobId()).isEqualTo(111L);
        assertThat(created.getResult()).isEqualTo(existing.getResult());
        verify(analysisJobDao, never()).findCompletedContainingRange(any(), any(), any(), any());
    }

    /**
     * A cached job whose stored range *contains* the requested range ran the strategy over more
     * data than the user asked for.  Its result therefore covers a wider interval and must NOT be
     * reused for a narrower request — doing so would return signals for dates outside the
     * requested window.  The service must create a fresh pending job instead.
     */
    @Test
    void createAnalysisJobCreatesPendingWhenOnlyContainingRangeExists() {
        Strategy strategy = strategyWithConfiguration();
        when(strategyDao.findById(9L)).thenReturn(Optional.of(strategy));
        when(analysisJobDao.findCompletedByExactRange(eq(9L), any(), any(), any())).thenReturn(Optional.empty());
        when(analysisJobDao.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AnalyzeStrategyRequestDTO request = new AnalyzeStrategyRequestDTO();
        request.setFromDate(LocalDate.parse("2024-01-01"));
        request.setToDate(LocalDate.parse("2024-01-31"));
        request.setConfig(Map.of("lookback", 42));

        AnalysisJob created = analysisJobService.createAnalysisJob(9L, request);

        // Must be a fresh pending job, not a reuse of the wider cached result
        assertThat(created.getStatus()).isEqualTo("pending");
        assertThat(created.getReusedFromJobId()).isNull();
        // findCompletedContainingRange must never be consulted
        verify(analysisJobDao, never()).findCompletedContainingRange(any(), any(), any(), any());
    }

    @Test
    void createAnalysisJobCreatesPendingWhenNoReuseMatch() {
        Strategy strategy = strategyWithConfiguration();
        when(strategyDao.findById(9L)).thenReturn(Optional.of(strategy));
        when(analysisJobDao.findCompletedByExactRange(eq(9L), any(), any(), any())).thenReturn(Optional.empty());
        when(analysisJobDao.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AnalyzeStrategyRequestDTO request = new AnalyzeStrategyRequestDTO();
        request.setConfig(Map.of("lookback", 8));

        analysisJobService.createAnalysisJob(9L, request);

        ArgumentCaptor<AnalysisJob> captor = ArgumentCaptor.forClass(AnalysisJob.class);
        verify(analysisJobDao).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("pending");
        assertThat(captor.getValue().getConfigPayload()).contains("\"lookback\"").contains("8");
        verify(analysisJobDao, never()).findCompletedContainingRange(any(), any(), any(), any());
    }

    @Test
    void getJobByIdFiltersTradeArraysBySymbol() throws Exception {
        AnalysisJob job = new AnalysisJob();
        job.setId(77L);
        job.setStrategyId(9L);
        job.setStatus("completed");
        job.setResult("""
                {"status":"ok","trades":[{"symbol":"AAPL","time":1704187800,"amount":1},{"symbol":"MSFT","time":1704187800,"amount":-1}]}
                """);

        when(analysisJobDao.findById(77L)).thenReturn(Optional.of(job));

        Optional<AnalysisJobDTO> filteredJobOpt = analysisJobService.getJobById(77L, "AAPL");

        assertThat(filteredJobOpt).isPresent();
        AnalysisJobDTO filteredJob = filteredJobOpt.orElseThrow();
        assertThat(filteredJob.getResult()).isNotBlank();

        @SuppressWarnings("unchecked")
        Map<String, Object> filteredResult = objectMapper.readValue(filteredJob.getResult(), Map.class);
        assertThat(filteredResult.get("trades")).isInstanceOf(Iterable.class);
        assertThat((Iterable<?>) filteredResult.get("trades"))
                .singleElement()
                .satisfies(trade -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> tradeMap = (Map<String, Object>) trade;
                    assertThat(tradeMap.get("symbol")).isEqualTo("AAPL");
                });
    }

    private Strategy strategyWithConfiguration() {
        Strategy strategy = new Strategy();
        strategy.setId(9L);
        strategy.setConfiguration("""
                [
                  {"id":"lookback","type":"number","defaultValue":20},
                  {"id":"universe","type":"multi-select","defaultValue":["AAPL","MSFT"]}
                ]
                """);
        return strategy;
    }

    private AnalysisJob completedJob(Long id, String signature, LocalDate from, LocalDate to) {
        AnalysisJob job = new AnalysisJob();
        job.setId(id);
        job.setStatus("completed");
        job.setResult("{\"status\":\"ok\"}");
        job.setConfigSignature(signature);
        job.setRangeStart(from);
        job.setRangeEnd(to);
        job.setCompletedAt(LocalDateTime.now());
        return job;
    }
}
