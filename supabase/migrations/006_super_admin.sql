-- Super admin: admin@minister.com
-- 1. Create user in Supabase Auth (Authentication -> Users -> Add user):
--    Email: admin@minister.com
--    Password: (your choice)
--    Auto Confirm User: ON
--    Metadata: {"name":"System","surname":"Admin","username":"admin","role":"admin"}
-- 2. Run this SQL to ensure admin role (safe to re-run):

UPDATE profiles
SET role = 'admin', account_status = 'active'
WHERE email = 'admin@minister.com';
