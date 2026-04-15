package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.dao.AnalysisJobDao;
import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.dto.AnalyzeStrategyRequestDTO;
import cz.vko.stockstrategy.model.AnalysisJob;
import cz.vko.stockstrategy.model.Strategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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
    private StrategyExecutionService strategyExecutionService;

    private AnalysisJobService analysisJobService;

    @BeforeEach
    void setUp() {
        analysisJobService = new AnalysisJobService(
                analysisJobDao,
                strategyDao,
                stockDataService,
                strategyExecutionService,
                new ObjectMapper()
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

    @Test
    void createAnalysisJobUsesContainedRangeWhenExactMissing() {
        Strategy strategy = strategyWithConfiguration();
        when(strategyDao.findById(9L)).thenReturn(Optional.of(strategy));
        when(analysisJobDao.findCompletedByExactRange(eq(9L), any(), any(), any())).thenReturn(Optional.empty());

        AnalysisJob existing = completedJob(222L, "sig-2", LocalDate.parse("2023-01-01"), LocalDate.parse("2024-12-31"));
        when(analysisJobDao.findCompletedContainingRange(eq(9L), any(), eq(LocalDate.parse("2024-01-01")), eq(LocalDate.parse("2024-01-31"))))
                .thenReturn(Optional.of(existing));
        when(analysisJobDao.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AnalyzeStrategyRequestDTO request = new AnalyzeStrategyRequestDTO();
        request.setFromDate(LocalDate.parse("2024-01-01"));
        request.setToDate(LocalDate.parse("2024-01-31"));
        request.setConfig(Map.of("lookback", 42));

        AnalysisJob created = analysisJobService.createAnalysisJob(9L, request);
        assertThat(created.getStatus()).isEqualTo("completed");
        assertThat(created.getReusedFromJobId()).isEqualTo(222L);
    }

    @Test
    void createAnalysisJobCreatesPendingWhenNoReuseMatch() {
        Strategy strategy = strategyWithConfiguration();
        when(strategyDao.findById(9L)).thenReturn(Optional.of(strategy));
        when(analysisJobDao.findCompletedByExactRange(eq(9L), any(), any(), any())).thenReturn(Optional.empty());
        when(analysisJobDao.findCompletedContainingRange(eq(9L), any(), any(), any())).thenReturn(Optional.empty());
        when(analysisJobDao.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AnalyzeStrategyRequestDTO request = new AnalyzeStrategyRequestDTO();
        request.setConfig(Map.of("lookback", 8));

        analysisJobService.createAnalysisJob(9L, request);

        ArgumentCaptor<AnalysisJob> captor = ArgumentCaptor.forClass(AnalysisJob.class);
        verify(analysisJobDao).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("pending");
        assertThat(captor.getValue().getConfigPayload()).contains("\"lookback\":8");
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
