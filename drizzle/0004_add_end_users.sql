-- 创建终端用户表
CREATE TABLE IF NOT EXISTS pz9cwpnyi2mbyf3.end_users (
  id TEXT PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  avatar TEXT,
  metadata JSONB,
  total_conversations INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP,
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_end_users_external_id 
  ON pz9cwpnyi2mbyf3.end_users(external_id);
CREATE INDEX IF NOT EXISTS idx_end_users_last_seen_at 
  ON pz9cwpnyi2mbyf3.end_users(last_seen_at DESC);
