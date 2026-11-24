CREATE TABLE novel_new (
  uuid TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  text_key TEXT NOT NULL,
  paragraph INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at INTEGER NOT NULL DEFAULT 0
);

INSERT INTO novel_new (uuid, user_id, name, text_key, paragraph, created_at, updated_at)
  SELECT lower(hex(randomblob(16))), user_id, name, text_key, paragraph, created_at,
         CAST(strftime('%s', created_at) AS INTEGER) * 1000
  FROM novel;

DROP TABLE novel;
ALTER TABLE novel_new RENAME TO novel;
