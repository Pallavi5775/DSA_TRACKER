-- Run once against your PostgreSQL database to add hint support
ALTER TABLE dsa.questions
    ADD COLUMN IF NOT EXISTS hint TEXT;

ALTER TABLE dsa.practice_logs
    ADD COLUMN IF NOT EXISTS hint_used BOOLEAN NOT NULL DEFAULT FALSE;
