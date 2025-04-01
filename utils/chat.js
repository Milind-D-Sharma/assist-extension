import { getFirestore } from 'firebase/firestore';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '../config';

// Initialize Firestore with the app instance
const db = getFirestore(app);

export class ChatService {
  constructor() {
    console.log('Initializing ChatService...');
    this.conversationsRef = collection(db, 'conversations');
    this.messagesRef = collection(db, 'messages');
    this.historyRef = collection(db, 'history');
    console.log('ChatService initialized with collections:', {
      conversations: this.conversationsRef.id,
      messages: this.messagesRef.id,
      history: this.historyRef.id
    });
  }

  async createConversation(userId, title = 'New Conversation') {
    try {
      console.log('Creating new conversation for user:', userId);
      const conversationRef = await addDoc(this.conversationsRef, {
        userId,
        title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: []
      });
      console.log('Conversation created with ID:', conversationRef.id);
      return conversationRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async saveMessage(userId, conversationId, message, role, metadata = {}) {
    try {
      console.log('Saving message for conversation:', conversationId);
      const messageRef = await addDoc(this.messagesRef, {
        userId,
        conversationId,
        message,
        role,
        metadata,
        timestamp: serverTimestamp()
      });

      const conversationRef = doc(this.conversationsRef, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        console.log('Updating conversation with new message');
        const messages = conversationDoc.data().messages || [];
        messages.push(messageRef.id);
        await updateDoc(conversationRef, {
          messages,
          updatedAt: serverTimestamp()
        });
      } else {
        console.error('Conversation not found:', conversationId);
        throw new Error('Conversation not found');
      }

      console.log('Message saved successfully');
      return messageRef.id;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async getConversations(userId) {
    try {
      console.log('Getting conversations for user:', userId);
      const q = query(
        this.conversationsRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Found conversations:', conversations.length);
      return conversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  async getChatHistory(userId, conversationId) {
    try {
      console.log('Getting chat history for conversation:', conversationId);
      const conversationRef = doc(this.conversationsRef, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        console.error('Conversation not found:', conversationId);
        throw new Error('Conversation not found');
      }

      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Found messages:', messages.length);
      return messages;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId) {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId)
      );
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);

      const conversationRef = doc(this.conversationsRef, conversationId);
      await conversationRef.delete();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  async saveMacro(userId, name, description, action) {
    // Implementation for saving a macro
  }

  async getMacros(userId) {
    // Implementation for getting macros
  }

  async updateMacroUsage(macroId) {
    // Implementation for updating macro usage
  }

  async saveToHistory(userId, prompt, response) {
    try {
      console.log('Saving to history for user:', userId);
      const docRef = await addDoc(this.historyRef, {
        userId,
        prompt,
        response,
        timestamp: serverTimestamp()
      });
      console.log('History saved successfully');
      return docRef.id;
    } catch (error) {
      console.error('Error saving to history:', error);
      throw error;
    }
  }

  async getHistory(userId) {
    try {
      console.log('Getting history for user:', userId);
      const q = query(
        this.historyRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Found history items:', history.length);
      return history;
    } catch (error) {
      console.error('Error getting history:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService(); 