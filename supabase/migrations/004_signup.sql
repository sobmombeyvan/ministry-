-- Username availability check for self-service sign up
CREATE OR REPLACE FUNCTION is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM profiles WHERE username = p_username);
$$;

GRANT EXECUTE ON FUNCTION is_username_available(TEXT) TO anon, authenticated;
