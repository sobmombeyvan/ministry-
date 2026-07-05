import { getSupabase, throwIfError } from '@/lib/supabase';
import { logAction } from '@/services/history';

const PROFILE_FIELDS = 'id, name, surname, username, email, role, account_status';

function authErrorMessage(error) {
  const msg = error?.message || '';
  const code = error?.code || '';

  if (msg.includes('Signups not allowed')) {
    return 'Sign up is disabled in Supabase. Enable Authentication → Providers → Email → Allow new users to sign up.';
  }
  if (code === 'user_already_exists' || msg.includes('already registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (msg.includes('Email not confirmed') || code === 'email_not_confirmed') {
    return 'Please confirm your email before signing in (check your inbox).';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Invalid email, username, or password.';
  }
  return msg || 'Something went wrong';
}

function profileFromAuthUser(user) {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    name: meta.name || 'User',
    surname: meta.surname || '',
    username: meta.username || user.email?.split('@')[0] || '',
    email: user.email || '',
    role: meta.role || 'staff',
    account_status: 'active',
  };
}

export async function fetchProfile(userId) {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single();
  throwIfError(error);
  return data;
}

async function fetchProfileFast(user) {
  try {
    return await fetchProfile(user.id);
  } catch {
    return profileFromAuthUser(user);
  }
}

export async function isUsernameAvailable(username) {
  const { data, error } = await getSupabase().rpc('is_username_available', {
    p_username: username.trim(),
  });
  throwIfError(error);
  return Boolean(data);
}

export async function signUp({ name, surname, username, email, password }) {
  const supabase = getSupabase();
  const trimmedUsername = username.trim().toLowerCase();

  if (!/^[a-z0-9._-]{3,30}$/.test(trimmedUsername)) {
    throw new Error('Username must be 3-30 characters (letters, numbers, . _ - only)');
  }

  const available = await isUsernameAvailable(trimmedUsername);
  if (!available) {
    throw new Error('Username is already taken');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name: name.trim(),
        surname: surname.trim(),
        username: trimmedUsername,
        role: 'staff',
      },
    },
  });
  if (error) throw new Error(authErrorMessage(error));

  if (!data.user) {
    throw new Error('Sign up failed. Please try again.');
  }

  if (data.session) {
    const profile = await fetchProfileFast(data.user);
    void logAction({
      userId: profile.id,
      role: profile.role,
      action: 'signup',
      objectType: 'user',
      objectId: profile.id,
      description: `${profile.username} registered`,
    });
    return { profile, needsConfirmation: false };
  }

  return { profile: null, needsConfirmation: true };
}

export async function loginWithIdentifier(identifier, password) {
  const supabase = getSupabase();
  const trimmed = identifier.trim();
  let email = trimmed;

  if (!trimmed.includes('@')) {
    const { data, error: lookupError } = await supabase.rpc('get_email_by_username', {
      p_username: trimmed,
    });
    throwIfError(lookupError);
    if (!data) {
      throw new Error('No account found for that username. Use your email or sign up first.');
    }
    email = data;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(authErrorMessage(error));

  const profile = await fetchProfileFast(data.user);

  if (profile.account_status === 'deactivated') {
    await supabase.auth.signOut();
    throw new Error('Account is deactivated');
  }

  void logAction({
    userId: profile.id,
    role: profile.role,
    action: 'login',
    objectType: 'session',
    objectId: null,
    description: `${profile.username} signed in`,
  });

  return profile;
}

/** @deprecated Use loginWithIdentifier */
export async function loginWithUsername(username, password) {
  return loginWithIdentifier(username, password);
}

export async function logout() {
  const { error } = await getSupabase().auth.signOut();
  throwIfError(error);
}

export async function getSessionProfile() {
  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  return fetchProfile(session.user.id);
}
