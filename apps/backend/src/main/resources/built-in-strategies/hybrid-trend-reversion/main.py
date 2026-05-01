import json
import logging
import sys
from workspace_io import load_bars, load_config
from strategy_logic import emit_trades

def configure_logging() -> None:
    logging.basicConfig(
        level=logging.DEBUG,
        format="[hybrid-strategy] %(levelname)s %(message)s",
        stream=sys.stdout,
    )

def main() -> None:
    configure_logging()
    logger = logging.getLogger(__name__)

    try:
        config = load_config()
        logger.debug("Config loaded: %s", config)
        
        bars_by_symbol = load_bars()
        all_trades = emit_trades(bars_by_symbol, config)
            
        # Ensure trades are sorted by time
        all_trades.sort(key=lambda x: (x['time'], x['symbol']))
        
        result = {
            "status": "ok",
            "strategy": "Hybrid Trend Reversion",
            "runtime": "python",
            "tradeCount": len(all_trades),
            "trades": all_trades,
        }
        
        logger.debug("Emitting final result with %s trades", len(all_trades))
        # Print exactly one JSON object on the last line
        print(json.dumps(result))
        
    except Exception as e:
        logger.exception("Strategy failed: %s", e)
        print(json.dumps({"status": "failed", "errorMessage": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
