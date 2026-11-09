CREATE TABLE _question_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  achievement_id INTEGER NOT NULL REFERENCES achievement(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  prompt TEXT NOT NULL,
  criteria TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('free', 'choice', 'fill')),
  options TEXT,
  UNIQUE (achievement_id, tier)
);

INSERT INTO _question_new (id, achievement_id, tier, prompt, criteria, kind, options)
SELECT id, achievement_id, tier, prompt, criteria, kind, options FROM question;

DROP TABLE question;

ALTER TABLE _question_new RENAME TO question;
