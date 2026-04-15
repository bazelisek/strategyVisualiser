package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.AnalysisJobDao;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalysisJobInvalidationRunnerTest {

    @Mock
    private AnalysisJobDao analysisJobDao;

    @InjectMocks
    private AnalysisJobInvalidationRunner runner;

    @Test
    void invalidatesAllCachedAnalysisJobsOnStartup() throws Exception {
        when(analysisJobDao.deleteAll()).thenReturn(3);

        runner.run(new DefaultApplicationArguments(new String[0]));

        verify(analysisJobDao).deleteAll();
    }
}
