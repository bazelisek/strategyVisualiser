package cz.vko.stockstrategy.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserStrategiesDTO {

    private List<StrategyDTO> privateStrategies;
    private List<StrategyDTO> publicStrategies;

    public UserStrategiesDTO() {
    }

    public UserStrategiesDTO(List<StrategyDTO> privateStrategies, List<StrategyDTO> publicStrategies) {
        this.privateStrategies = privateStrategies;
        this.publicStrategies = publicStrategies;
    }
}
