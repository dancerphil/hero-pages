CREATE TABLE achievement_alias (
  name_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  achievement_id INTEGER NOT NULL REFERENCES achievement(id) ON DELETE CASCADE
);

INSERT INTO achievement_alias (name_key, name, achievement_id)
SELECT lower(replace(replace(replace(title, '《', ''), '》', ''), ' ', '')), title, id FROM achievement;
