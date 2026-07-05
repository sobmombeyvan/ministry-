-- Support chat: technicians see all open tickets; reliable realtime on messages

-- Required for postgres_changes filters on ticket_id (safe to re-run)
ALTER TABLE messages REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION can_access_support_ticket(p_ticket_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    is_ticket_owner(p_ticket_id)
    OR current_user_role() = 'admin'
    OR is_technician_on_ticket(p_ticket_id)
    OR (
      current_user_role() = 'technician'
      AND EXISTS (
        SELECT 1 FROM tickets
        WHERE id = p_ticket_id AND status NOT IN ('closed')
      )
    );
$$;

CREATE OR REPLACE FUNCTION can_message_ticket(p_ticket_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tickets
    WHERE id = p_ticket_id AND status != 'closed'
  )
  AND can_access_support_ticket(p_ticket_id);
$$;

GRANT EXECUTE ON FUNCTION can_access_support_ticket(BIGINT) TO authenticated;

DROP POLICY IF EXISTS "tickets_select" ON tickets;
CREATE POLICY "tickets_select" ON tickets FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR current_user_role() = 'admin'
    OR (
      current_user_role() = 'technician'
      AND (is_technician_on_ticket(id) OR status NOT IN ('closed'))
    )
  );

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (can_access_support_ticket(ticket_id));

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND can_message_ticket(ticket_id));
