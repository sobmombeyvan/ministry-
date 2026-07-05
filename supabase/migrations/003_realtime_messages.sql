-- Enable real-time updates for ticket chat messages (safe to re-run)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
