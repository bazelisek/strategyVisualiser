ALTER TABLE strategies
ADD COLUMN source_files TEXT;

ALTER TABLE strategies
ADD COLUMN entry_file VARCHAR(255);

ALTER TABLE strategies
ADD COLUMN runtime VARCHAR(32);
