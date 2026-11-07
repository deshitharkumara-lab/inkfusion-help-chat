-- Core tables for the iNK Fusion Breakdown Help chat agent.
CREATE TABLE guides (
  id TEXT PRIMARY KEY,
  machine TEXT NOT NULL,          -- JSON array, e.g. ["dtf"]
  problem TEXT NOT NULL,
  yaml TEXT NOT NULL,             -- full guide source (edited in the admin page)
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | approved
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  machine TEXT, model TEXT, warranty TEXT, lang TEXT,
  guide_id TEXT,
  outcome TEXT,                   -- fixed | escalated | null (in progress / abandoned)
  transcript TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX chats_created ON chats(created_at);

CREATE TABLE tech_requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  chat_id TEXT,
  name TEXT NOT NULL, phone TEXT NOT NULL, town TEXT NOT NULL,
  machine TEXT, model TEXT, warranty TEXT,
  summary TEXT, steps_tried TEXT,
  photo_key TEXT,
  status TEXT NOT NULL DEFAULT 'new',      -- new | contacted | done
  alert_status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed | not_configured
  alert_error TEXT
);
CREATE INDEX tech_requests_created ON tech_requests(created_at);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT NOT NULL,             -- pdf | image | video | link
  name TEXT NOT NULL,
  r2_key TEXT,                    -- for uploaded files
  url TEXT,                       -- for links (e.g. unlisted YouTube)
  size INTEGER
);

CREATE TABLE translations (
  key TEXT PRIMARY KEY,           -- lang + ':' + sha256(text)
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE usage (
  day TEXT PRIMARY KEY,           -- YYYY-MM-DD (Asia/Colombo)
  ai_calls INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0
);

CREATE TABLE ratelimit (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
