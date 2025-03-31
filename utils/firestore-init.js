import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';

const db = getFirestore();

export async function initializeUserData(userId, userData) {
  try {
    // Create user document
    await setDoc(doc(db, 'users', userId), {
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      createdAt: new Date(),
      settings: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    });

    // Create a welcome conversation
    const conversationRef = doc(collection(db, `users/${userId}/conversations`));
    await setDoc(conversationRef, {
      title: 'Welcome Conversation',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Add welcome message
    const messageRef = doc(collection(db, `users/${userId}/conversations/${conversationRef.id}/messages`));
    await setDoc(messageRef, {
      content: 'Welcome to AI Assistant! How can I help you today?',
      role: 'assistant',
      timestamp: new Date()
    });

    return {
      success: true,
      conversationId: conversationRef.id
    };
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
} 