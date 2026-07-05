import { getSupabase, throwIfError } from '@/lib/supabase';

export async function fetchHistory() {
  const { data, error } = await getSupabase()
    .from('history')
    .select('*, user:profiles!user_id(name, surname, username)')
    .order('created_at', { ascending: false })
    .limit(200);
  throwIfError(error);
  return data ?? [];
}

export async function logAction({ userId, role, action, objectType, objectId, description }) {
  const { error } = await getSupabase().from('history').insert({
    user_id: userId,
    role,
    action,
    object_type: objectType,
    object_id: objectId ? String(objectId) : null,
    description,
  });
  if (error) console.warn('History log failed:', error.message);
}
