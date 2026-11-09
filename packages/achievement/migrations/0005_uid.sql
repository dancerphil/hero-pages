ALTER TABLE user ADD COLUMN uid TEXT;

WITH r AS (SELECT id, lower(hex(randomblob(16))) AS h FROM user)
UPDATE user SET uid = (
  SELECT substr(h, 1, 8) || '-' || substr(h, 9, 4) || '-4' || substr(h, 14, 3) || '-' || substr(h, 17, 4) || '-' || substr(h, 21, 12)
  FROM r WHERE r.id = user.id
);

CREATE UNIQUE INDEX user_uid ON user (uid);
