-- Migration: Add google_file_name column if it doesn't exist
-- This fixes the error: column "google_file_name" does not exist

DO $$
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'upload_history'
        AND column_name = 'google_file_name'
    ) THEN
        ALTER TABLE upload_history
        ADD COLUMN google_file_name TEXT;

        RAISE NOTICE 'Column google_file_name added to upload_history table';
    ELSE
        RAISE NOTICE 'Column google_file_name already exists';
    END IF;
END $$;
