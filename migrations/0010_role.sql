ALTER TABLE user ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'vip', 'user'));
UPDATE user SET role = 'admin' WHERE is_admin = 1;
UPDATE user SET role = 'admin' WHERE email = 'dancerphil1994@gmail.com';
ALTER TABLE user DROP COLUMN is_admin;
