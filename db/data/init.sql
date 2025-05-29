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

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- 1. USERS TABLE (Authentication data only)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY DEFAULT generate_user_id(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt/scrypt/argon2 hashed
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields (NULLABLE for first user)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id), -- NULLABLE
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by BIGINT REFERENCES users(id) -- NULLABLE
);

-- 2. USER_PROFILES TABLE (Profile data)
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGINT PRIMARY KEY, -- Same ID as users table
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal information
    title VARCHAR(50), -- Mr., Ms., Dr., etc.
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender gender_type, -- ENUM for data integrity
    
    -- Location
    country VARCHAR(50),
    city VARCHAR(50),
    address TEXT,
    
    -- Audit fields (NULLABLE)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id), -- NULLABLE
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by BIGINT REFERENCES users(id) -- NULLABLE
);

-- 3. USER_SESSIONS TABLE (Session management - simplified)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Hashed tokens (NOT plain JWT!)
    session_token_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of session token
    refresh_token_hash VARCHAR(255), -- SHA-256 hash of refresh token
    
    -- Session metadata
    device_info TEXT,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE, -- Separate expiry for refresh token
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Simplified audit (no created_by/modified_by as suggested)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CATEGORIES TABLE (Optional, for user categorization)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    icon TEXT,
    name TEXT NOT NULL,
    description TEXT
);

-- Create indexes for performance
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_first_name ON user_profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_name ON user_profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON user_profiles(gender);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token_hash ON user_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_ip_address ON user_sessions(ip_address);

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

-- Insert sample admin user with properly hashed password
DO $$
DECLARE
    admin_id BIGINT;
    hashed_password TEXT;
BEGIN
    -- Generate ID for admin user
    admin_id := generate_user_id();
    
    -- Create a secure hash (in production, use bcrypt from your application)
    -- This is just for initialization - use proper bcrypt in your app
    hashed_password := crypt('admin123', gen_salt('bf', 12));
    
    -- Insert admin user
    INSERT INTO users (
        id,
        username, 
        email, 
        password, 
        role,
        is_verified,
        created_at,
        modified_at
    ) VALUES (
        admin_id,
        'admin', 
        'admin@example.com',
        hashed_password,
        'admin',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (username) DO NOTHING;
    
    -- Update profile if user was created
    UPDATE user_profiles 
    SET 
        title = 'Mr.',
        first_name = 'System',
        last_name = 'Administrator'
    WHERE user_id = admin_id;
    
    RAISE NOTICE 'Admin user created with ID: %', admin_id;
    
END $$;

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