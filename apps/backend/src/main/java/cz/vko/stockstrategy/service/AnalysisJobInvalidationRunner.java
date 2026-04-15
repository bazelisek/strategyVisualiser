package cz.vko.stockstrategy.service;

import cz.vko.stockstrategy.dao.AnalysisJobDao;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@AllArgsConstructor
public class AnalysisJobInvalidationRunner implements ApplicationRunner {

    private final AnalysisJobDao analysisJobDao;

    @Override
    public void run(ApplicationArguments args) {
        int deletedJobs = analysisJobDao.deleteAll();
        if (deletedJobs > 0) {
            log.info("Invalidated {} cached analysis jobs on startup.", deletedJobs);
        }
    }
}
