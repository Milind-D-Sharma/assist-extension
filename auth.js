import { signInWithGoogle, getUserProfile, signOutUser, storeHistory, fetchUserHistory } from './src/firebase';

export { signInWithGoogle, getUserProfile, signOutUser, storeHistory, fetchUserHistory };

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