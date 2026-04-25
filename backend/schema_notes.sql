CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Note: The users table must have 'role' column already defined as per instruction
-- Insert ADMIN account (Password: password123, should be reset immediately via Forgot Password)
INSERT INTO users (id, name, email, password_hash, branch, current_semester, role, created_at)
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@studybuddy.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJ1whIjyCca',
  'CSE', 
  1, 
  'ADMIN', 
  NOW()
);