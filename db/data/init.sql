-- Improved Database Schema with Security Best Practices
-- Database initialization script

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS authdb;

-- Use the database
\c authdb;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For hash functions

-- Create function to generate consistent random 10-digit IDs
CREATE OR REPLACE FUNCTION generate_user_id()
RETURNS BIGINT AS $$
DECLARE
    new_id BIGINT;
BEGIN
    -- Generate random 10-digit number (1000000000 to 9999999999)
    new_id := floor(random() * 9000000000 + 1000000000)::BIGINT;
    
    -- Check if ID already exists in users table
    WHILE EXISTS (SELECT 1 FROM users WHERE id = new_id) LOOP
        new_id := floor(random() * 9000000000 + 1000000000)::BIGINT;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to hash session tokens
CREATE OR REPLACE FUNCTION hash_token(token TEXT)
RETURNS VARCHAR(255) AS $$
BEGIN
    -- Use SHA-256 hash for session tokens
    RETURN encode(digest(token, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for modified_at
CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create triggers for automatic modified_at update
DROP TRIGGER IF EXISTS update_users_modified_at ON users;
CREATE TRIGGER update_users_modified_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_modified_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_modified_at ON user_profiles;
CREATE TRIGGER update_user_profiles_modified_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_modified_at_column();

DROP TRIGGER IF EXISTS update_user_sessions_modified_at ON user_sessions;
CREATE TRIGGER update_user_sessions_modified_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_modified_at_column();

-- Create function to auto-create user profile when user is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (
        id, 
        user_id, 
        created_at, 
        created_by,
        modified_at,
        modified_by
    ) VALUES (
        NEW.id, 
        NEW.id, 
        NEW.created_at, 
        NEW.created_by,
        NEW.modified_at,
        NEW.modified_by
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS create_profile_on_user_insert ON users;
CREATE TRIGGER create_profile_on_user_insert
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to create session with hashed tokens
CREATE OR REPLACE FUNCTION create_user_session(
    p_user_id BIGINT,
    p_session_token TEXT,
    p_refresh_token TEXT DEFAULT NULL,
    p_device_info TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_expires_minutes INTEGER DEFAULT 30,
    p_refresh_expires_hours INTEGER DEFAULT 168 -- 7 days
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO user_sessions (
        user_id,
        session_token_hash,
        refresh_token_hash,
        device_info,
        ip_address,
        user_agent,
        expires_at,
        refresh_expires_at
    ) VALUES (
        p_user_id,
        hash_token(p_session_token),
        CASE WHEN p_refresh_token IS NOT NULL THEN hash_token(p_refresh_token) ELSE NULL END,
        p_device_info,
        p_ip_address,
        p_user_agent,
        CURRENT_TIMESTAMP + (p_session_expires_minutes || ' minutes')::INTERVAL,
        CASE WHEN p_refresh_token IS NOT NULL 
             THEN CURRENT_TIMESTAMP + (p_refresh_expires_hours || ' hours')::INTERVAL 
             ELSE NULL END
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate session token
CREATE OR REPLACE FUNCTION validate_session_token(p_session_token TEXT)
RETURNS TABLE(
    session_id UUID,
    user_id BIGINT,
    is_valid BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        (s.is_active AND s.expires_at > CURRENT_TIMESTAMP) as is_valid,
        s.expires_at
    FROM user_sessions s
    WHERE s.session_token_hash = hash_token(p_session_token);
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE user_sessions 
    SET 
        is_active = FALSE,
        refresh_expires_at = CURRENT_TIMESTAMP,
        modified_at = CURRENT_TIMESTAMP
    WHERE (expires_at < CURRENT_TIMESTAMP OR refresh_expires_at < CURRENT_TIMESTAMP) 
    AND is_active = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create comprehensive view for user data (with security considerations)
CREATE OR REPLACE VIEW user_safe_view AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.is_verified,
    u.last_login,
    u.created_at as user_created_at,
    u.modified_at as user_modified_at,
    
    -- Profile data
    p.title,
    p.first_name,
    p.last_name,
    CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as full_name,
    p.phone,
    p.date_of_birth,
    p.gender,
    p.country,
    p.city,
    -- Don't expose full address in view
    p.created_at as profile_created_at,
    p.modified_at as profile_modified_at,
    
    -- Session statistics (without exposing tokens)
    COUNT(s.id) FILTER (
        WHERE s.is_active = TRUE 
        AND s.expires_at > CURRENT_TIMESTAMP
    ) as active_sessions_count
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN user_sessions s ON u.id = s.user_id
GROUP BY 
    u.id, u.username, u.email, u.role, u.is_verified, u.last_login,
    u.created_at, u.modified_at,
    p.title, p.first_name, p.last_name, p.phone, p.date_of_birth, 
    p.gender, p.country, p.city, p.created_at, p.modified_at;

-- Create view for active users only
CREATE OR REPLACE VIEW active_users_view AS
SELECT * FROM user_safe_view 
WHERE is_verified = TRUE;

-- Security policies and additional constraints
-- Ensure session tokens are always hashed
ALTER TABLE user_sessions 
ADD CONSTRAINT check_session_token_hashed 
CHECK (length(session_token_hash) = 64); -- SHA-256 produces 64 char hex

-- Ensure refresh tokens are always hashed (when present)
ALTER TABLE user_sessions 
ADD CONSTRAINT check_refresh_token_hashed 
CHECK (refresh_token_hash IS NULL OR length(refresh_token_hash) = 64);

-- Ensure password is properly hashed (basic check)
ALTER TABLE users 
ADD CONSTRAINT check_password_hashed 
CHECK (length(password) >= 60); -- bcrypt produces 60+ char strings

-- Create scheduled job to clean expired sessions (PostgreSQL extension required)
-- This would typically be done in application code or cron job
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('clean-expired-sessions', '0 0 * * *', 'SELECT clean_expired_sessions();');

COMMENT ON TABLE users IS 'User authentication data with secure password storage';
COMMENT ON TABLE user_profiles IS 'User profile information separated from auth data';
COMMENT ON TABLE user_sessions IS 'Session management with hashed tokens for security';

COMMENT ON COLUMN users.password IS 'Hashed with bcrypt/scrypt/argon2 - NEVER store plain text';
COMMENT ON COLUMN user_sessions.session_token_hash IS 'SHA-256 hash of session token - original token not stored';
COMMENT ON COLUMN user_sessions.refresh_token_hash IS 'SHA-256 hash of refresh token - original token not stored';
COMMENT ON COLUMN user_profiles.gender IS 'ENUM type prevents invalid values';

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

