import logging


LOGGER = logging.getLogger(__name__)


def read_positive_int(config: dict, field_name: str) -> int:
    value = config.get(field_name)
    if value is None:
        raise ValueError(f"Missing numeric config field: {field_name}")

    try:
        normalized = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"Invalid numeric config field: {field_name}") from error

    if normalized <= 0:
        raise ValueError(f"{field_name} must be greater than zero.")
    return normalized


def emit_trades(symbol: str, bars: list, ma_range_1: int, ma_range_2: int, slope_lookback: int) -> list[dict]:
    short_period = min(ma_range_1, ma_range_2)
    long_period = max(ma_range_1, ma_range_2)
    closes = [bar.close for bar in bars]
    short_sma = rolling_sma(closes, short_period)
    long_sma = rolling_sma(closes, long_period)

    start_index = max(short_period - 1, long_period - 1 + slope_lookback)
    in_position = False
    emitted_times: set[int] = set()
    trades: list[dict] = []

    LOGGER.debug(
        "Evaluating %s bars for %s with short_period=%s long_period=%s slope_lookback=%s",
        len(bars),
        symbol,
        short_period,
        long_period,
        slope_lookback,
    )

    for index in range(start_index, len(bars)):
        current_short = short_sma[index]
        current_long = long_sma[index]
        previous_short = short_sma[index - 1]
        previous_long = long_sma[index - 1]
        long_before_slope = long_sma[index - slope_lookback]

        if any(value is None for value in (current_short, current_long, previous_short, previous_long, long_before_slope)):
            continue

        crossed_up = previous_short <= previous_long and current_short > current_long
        crossed_down = previous_short >= previous_long and current_short < current_long
        long_rising = current_long > long_before_slope
        long_flat_or_falling = not long_rising

        time = bars[index].epoch_seconds
        if not in_position and crossed_up and long_rising and time not in emitted_times:
            emitted_times.add(time)
            trades.append({"symbol": symbol, "time": time, "amount": 1})
            in_position = True
            LOGGER.debug("BUY %s at index=%s time=%s close=%.4f", symbol, index, time, bars[index].close)
            continue

        if in_position and (crossed_down or long_flat_or_falling) and time not in emitted_times:
            emitted_times.add(time)
            trades.append({"symbol": symbol, "time": time, "amount": -1})
            in_position = False
            LOGGER.debug("SELL %s at index=%s time=%s close=%.4f", symbol, index, time, bars[index].close)

    LOGGER.debug("Produced %s trades for %s", len(trades), symbol)
    return trades


def rolling_sma(values: list[float], period: int) -> list[float | None]:
    if period <= 0:
        raise ValueError("period must be greater than zero")

    result: list[float | None] = [None] * len(values)
    window_sum = 0.0

    for index, value in enumerate(values):
        window_sum += value
        if index >= period:
            window_sum -= values[index - period]
        if index >= period - 1:
            result[index] = window_sum / period

    return result
