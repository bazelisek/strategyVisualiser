package cz.vko.stockstrategy.rest;

import cz.vko.stockstrategy.dto.AnalysisJobDTO;
import cz.vko.stockstrategy.service.AnalysisJobService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(JobController.class)
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalysisJobService analysisJobService;

    @Test
    void getJobStatusReturnsJobWhenPresent() throws Exception {
        AnalysisJobDTO job = new AnalysisJobDTO();
        job.setId(3L);
        job.setStrategyId(8L);
        job.setStatus("completed");
        job.setResult("{\"performance\":0.12}");
        job.setCreatedAt(LocalDateTime.of(2026, 4, 2, 19, 0));

        when(analysisJobService.getJobById(3L, "AAPL")).thenReturn(Optional.of(job));

        mockMvc.perform(get("/api/jobs/3?symbol=AAPL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.strategyId").value(8))
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.result").value("{\"performance\":0.12}"));
    }

    @Test
    void getJobStatusReturnsNotFoundWhenMissing() throws Exception {
        when(analysisJobService.getJobById(4L, null)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/jobs/4"))
                .andExpect(status().isNotFound());
    }
}
