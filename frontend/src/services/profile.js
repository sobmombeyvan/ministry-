import { getSupabase, throwIfError } from '@/lib/supabase';
import { logAction } from '@/services/history';

export async function getProfile(userId) {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, name, surname, username, email, role, account_status, created_at')
    .eq('id', userId)
    .single();
  throwIfError(error);
  return data;
}

export async function updateProfile(userId, { name, surname, email }) {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update({ name, surname, email })
    .eq('id', userId)
    .select()
    .single();
  throwIfError(error);

  await logAction({
    userId,
    role: data.role,
    action: 'profile_updated',
    objectType: 'profile',
    objectId: userId,
    description: 'Updated profile information',
  });

  return data;
}

export async function changePassword(newPassword) {
  const { error } = await getSupabase().auth.updateUser({ password: newPassword });
  throwIfError(error);
}
