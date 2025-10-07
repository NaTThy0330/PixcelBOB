-- Schema for Render PostgreSQL (database already exists)

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
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create session table for express-session
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);

-- Create pending uploads table for temporary storage
CREATE TABLE IF NOT EXISTS pending_uploads (
    id SERIAL PRIMARY KEY,
    line_user_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    image_data BYTEA NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create upload history table
CREATE TABLE IF NOT EXISTS upload_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    line_message_id TEXT,
    google_file_id TEXT,
    file_name TEXT,
    file_size BIGINT,
    upload_status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create packages
CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  upload_limit INT NOT NULL,
  price INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_editable BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_packages (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  package_id INT REFERENCES packages(id),
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  is_trial BOOLEAN DEFAULT FALSE
);

-- Create indexes for upload_history
CREATE INDEX IF NOT EXISTS idx_upload_history_user_id ON upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_status ON upload_history(upload_status);
CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON upload_history(created_at);

-- Create trigger for pending_uploads
DROP TRIGGER IF EXISTS update_pending_uploads_updated_at ON pending_uploads;
CREATE TRIGGER update_pending_uploads_updated_at BEFORE UPDATE
    ON pending_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

