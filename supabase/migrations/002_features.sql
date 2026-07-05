-- Block messages on closed tickets (uses can_message_ticket from 005_fix_rls_recursion.sql)
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND can_message_ticket(ticket_id));
