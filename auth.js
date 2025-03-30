import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://veajggjbtziellloxttt.supabase.co';
const SUPABASE_KEY = 'your-public-anon-key';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) console.error('Login failed:', error);
}

export async function getUserProfile() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('User fetch error:', error);
    return null;
  }
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Sign-out failed:', error);
}

export async function storeHistory(prompt, response) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('history').insert({
    user_id: user.id,
    prompt,
    response
  });
  if (error) console.error('Error storing history:', error);
}

export async function fetchUserHistory() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }
  return data;
}

// === Supabase Users ===
// No need to manually create a "users" table.
// Supabase manages `auth.users` automatically after Google login.
// Use `user.id` or `user.email` from `getUserProfile()` to identify them.

// === Use in homebase.js or chatbox.js ===
// Example: call signInWithGoogle() from a login button
// Then call fetchUserHistory() and storeHistory() after each chat

// You can now fully connect your extension to Supabase with real user login + synced history.
 

// === Supabase Users ===
// No need to manually create a "users" table.
// Supabase manages `auth.users` automatically after Google login.
// Use `user.id` or `user.email` from `getUserProfile()` to identify them.

// === Use in homebase.js or chatbox.js ===
// Example: call signInWithGoogle() from a login button
// Then call fetchUserHistory() and storeHistory() after each chat

// You can now fully connect your extension to Supabase with real user login + synced history.