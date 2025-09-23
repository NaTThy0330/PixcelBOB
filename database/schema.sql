-- Create database
CREATE DATABASE IF NOT EXISTS line_drive_db;

-- Use the database
\c line_drive_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    line_user_id TEXT UNIQUE,
    google_email TEXT,
    google_refresh_token TEXT,
    google_folder_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on line_user_id for faster lookups
CREATE INDEX idx_users_line_user_id ON users(line_user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create session table for express-session
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);

CREATE INDEX idx_user_sessions_expire ON user_sessions(expire);

-- Create pending uploads table for temporary storage
CREATE TABLE IF NOT EXISTS pending_uploads (
    id SERIAL PRIMARY KEY,
    line_user_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    image_data BYTEA NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pending_uploads_line_user_id ON pending_uploads(line_user_id);
CREATE INDEX idx_pending_uploads_processed ON pending_uploads(processed);

-- Create upload history table
CREATE TABLE IF NOT EXISTS upload_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    line_message_id TEXT,
    google_file_id TEXT,
    google_file_name TEXT,
    file_size INTEGER,
    upload_status TEXT CHECK (upload_status IN ('success', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_upload_history_user_id ON upload_history(user_id);
CREATE INDEX idx_upload_history_created_at ON upload_history(created_at);