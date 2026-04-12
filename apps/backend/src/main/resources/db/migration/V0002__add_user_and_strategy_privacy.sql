-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add columns to strategies table
ALTER TABLE strategies ADD COLUMN owner_email VARCHAR(255);
ALTER TABLE strategies ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Create strategy_sharing table for sharing private strategies
CREATE TABLE strategy_sharing (
    id SERIAL PRIMARY KEY,
    strategy_id BIGINT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    shared_with_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for performance
CREATE INDEX idx_strategies_owner_email ON strategies(owner_email);
CREATE INDEX idx_strategies_is_public ON strategies(is_public);
CREATE INDEX idx_strategy_sharing_strategy_id ON strategy_sharing(strategy_id);
CREATE INDEX idx_strategy_sharing_shared_with_email ON strategy_sharing(shared_with_email);
CREATE INDEX idx_users_email ON users(email);
