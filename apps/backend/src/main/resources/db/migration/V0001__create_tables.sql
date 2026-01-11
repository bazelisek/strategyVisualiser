CREATE TABLE stock_data (
                            id SERIAL PRIMARY KEY,
                            ticker VARCHAR(10) NOT NULL,           -- Stock symbol (e.g., AAPL)
                            period CHAR(1) NOT NULL,               -- Period indicator (e.g., D for daily)
                            trade_date DATE NOT NULL,              -- Trading date
                            trade_time TIME DEFAULT '00:00:00',    -- Trading time (usually 000000 for daily)
                            open NUMERIC(12,6),                    -- Opening price
                            high NUMERIC(12,6),                    -- Highest price
                            low NUMERIC(12,6),                     -- Lowest price
                            close NUMERIC(12,6),                   -- Closing price
                            volume BIGINT,                         -- Trade volume
                            open_interest BIGINT DEFAULT 0,        -- Open interest (often 0 for stocks)
                            CONSTRAINT uq_stock_data UNIQUE (ticker, trade_date, trade_time)
);

