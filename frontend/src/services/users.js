import { getSupabase, throwIfError } from '@/lib/supabase';
import { logAction } from '@/services/history';

export async function fetchUsers(role) {
  let query = getSupabase().from('profiles').select('*').order('name');
  if (role) {
    query = query.eq('role', role);
  }
  const { data, error } = await query;
  throwIfError(error);
  return data ?? [];
}

export async function setUserStatus(userId, status, actor) {
  const { error } = await getSupabase()
    .from('profiles')
    .update({ account_status: status })
    .eq('id', userId);
  throwIfError(error);

  if (actor) {
    await logAction({
      userId: actor.id,
      role: actor.role,
      action: status === 'active' ? 'user_activated' : 'user_deactivated',
      objectType: 'user',
      objectId: userId,
      description: `User ${status === 'active' ? 'activated' : 'deactivated'}`,
    });
  }
}

export async function updateUser(userId, fields, actor) {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single();
  throwIfError(error);

  if (actor) {
    const action = fields.role ? 'role_changed' : 'user_updated';
    await logAction({
      userId: actor.id,
      role: actor.role,
      action,
      objectType: 'user',
      objectId: userId,
      description: fields.role
        ? `Changed role to ${fields.role} for ${data.username}`
        : `Updated user ${data.username}`,
    });
  }

  return data;
}

export async function setUserRole(userId, role, actor) {
  if (actor?.id === userId && role !== 'admin') {
    throw new Error('You cannot remove your own admin access');
  }
  return updateUser(userId, { role }, actor);
}
