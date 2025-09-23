-- Quick fix for missing user_sessions table
-- Run this if you get "relation user_sessions does not exist" error

-- Create session table for express-session if it doesn't exist
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);

-- Grant permissions if needed (adjust username as needed)
GRANT ALL PRIVILEGES ON TABLE user_sessions TO CURRENT_USER;

-- Verify table was created
SELECT 'user_sessions table created successfully' AS status
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_sessions'
);