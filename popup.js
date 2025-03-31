import { signInWithGoogle, getUserProfile, signOutUser } from './src/firebase';
import { ChatService } from './utils/chat';

class ChatUI {
  constructor() {
    this.currentUser = null;
    this.currentConversationId = null;
    this.chatService = new ChatService();
    this.messageTemplate = document.getElementById('message-template');
    this.sections = {
      auth: document.getElementById('auth-section'),
      chat: document.getElementById('chat-section'),
      loading: document.getElementById('loading-section'),
      error: document.getElementById('error-section')
    };
    this.elements = {
      signInBtn: document.getElementById('sign-in-btn'),
      signOutBtn: document.getElementById('sign-out-btn'),
      userAvatar: document.getElementById('user-avatar'),
      userName: document.getElementById('user-name'),
      messages: document.getElementById('chatMessages'),
      messageInput: document.getElementById('userInput'),
      sendBtn: document.getElementById('sendButton'),
      micButton: document.getElementById('micButton'),
      clearChatBtn: document.getElementById('clearChat'),
      retryBtn: document.getElementById('retry-btn'),
      errorMessage: document.getElementById('error-message')
    };

    this.initializeEventListeners();
    this.checkAuthState();
  }

  initializeEventListeners() {
    // Auth events
    this.elements.signInBtn.addEventListener('click', () => this.handleSignIn());
    this.elements.signOutBtn.addEventListener('click', () => this.handleSignOut());
    this.elements.retryBtn.addEventListener('click', () => this.checkAuthState());

    // Chat events
    this.elements.messageInput.addEventListener('input', () => this.handleInputChange());
    this.elements.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());
    this.elements.micButton.addEventListener('click', () => this.handleVoiceInput());
    this.elements.clearChatBtn.addEventListener('click', () => this.handleClearChat());
  }

  async checkAuthState() {
    try {
      this.showSection('loading');
      const user = await getUserProfile();
      
      if (user) {
        this.currentUser = user;
        this.updateUserInfo(user);
        this.showSection('chat');
        await this.loadChatHistory();
      } else {
        this.showSection('auth');
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async handleSignIn() {
    try {
      this.showSection('loading');
      const user = await signInWithGoogle();
      this.currentUser = user;
      this.updateUserInfo(user);
      this.showSection('chat');
      await this.loadChatHistory();
    } catch (error) {
      this.handleError(error);
    }
  }

  async handleSignOut() {
    try {
      this.showSection('loading');
      await signOutUser();
      this.currentUser = null;
      this.currentConversationId = null;
      this.clearMessages();
      this.showSection('auth');
    } catch (error) {
      this.handleError(error);
    }
  }

  updateUserInfo(user) {
    this.elements.userAvatar.src = user.photoURL || 'icons/default-avatar.png';
    this.elements.userName.textContent = user.displayName || 'User';
  }

  async loadChatHistory() {
    try {
      const conversations = await this.chatService.getConversations(this.currentUser.uid);
      if (conversations.length > 0) {
        this.currentConversationId = conversations[0].id;
        const messages = await this.chatService.getChatHistory(
          this.currentUser.uid,
          this.currentConversationId
        );
        this.renderMessages(messages);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  handleInputChange() {
    const message = this.elements.messageInput.value.trim();
    this.elements.sendBtn.disabled = !message;
  }

  handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!this.elements.sendBtn.disabled) {
        this.handleSendMessage();
      }
    }
  }

  async handleSendMessage() {
    const message = this.elements.messageInput.value.trim();
    if (!message) return;

    try {
      // Disable input and send button
      this.elements.messageInput.disabled = true;
      this.elements.sendBtn.disabled = true;

      // Create new conversation if none exists
      if (!this.currentConversationId) {
        this.currentConversationId = await this.chatService.createConversation(this.currentUser.uid);
      }

      // Save user message
      await this.chatService.saveMessage(
        this.currentUser.uid,
        this.currentConversationId,
        message,
        'user'
      );

      // Render user message
      this.renderMessage(message, 'user');

      // Clear input
      this.elements.messageInput.value = '';

      // Get AI response
      const response = await this.getAIResponse(message);
      
      // Save and render AI response
      await this.chatService.saveMessage(
        this.currentUser.uid,
        this.currentConversationId,
        response,
        'assistant'
      );
      this.renderMessage(response, 'assistant');

      // Save to history
      await this.chatService.saveToHistory(this.currentUser.uid, message, response);

      // Scroll to bottom
      this.scrollToBottom();
    } catch (error) {
      this.handleError(error);
    } finally {
      // Re-enable input and send button
      this.elements.messageInput.disabled = false;
      this.elements.messageInput.focus();
    }
  }

  async getAIResponse(message) {
    // TODO: Implement AI response generation
    // For now, return a mock response
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('This is a mock AI response. The actual AI integration will be implemented later.');
      }, 1000);
    });
  }

  renderMessage(text, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.textContent = text;
    this.elements.messages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  renderMessages(messages) {
    this.clearMessages();
    messages.forEach(message => {
      this.renderMessage(message.message, message.role);
    });
    this.scrollToBottom();
  }

  clearMessages() {
    this.elements.messages.innerHTML = '';
  }

  scrollToBottom() {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  async handleVoiceInput() {
    // TODO: Implement voice input
    console.log('Voice input not implemented yet');
  }

  async handleClearChat() {
    try {
      this.clearMessages();
      this.currentConversationId = null;
      await this.loadChatHistory();
    } catch (error) {
      this.handleError(error);
    }
  }

  showSection(sectionName) {
    Object.values(this.sections).forEach(section => {
      section.classList.remove('active');
    });
    this.sections[sectionName].classList.add('active');
  }

  handleError(error) {
    console.error('Error:', error);
    this.elements.errorMessage.textContent = error.message || 'An error occurred';
    this.showSection('error');
  }
}

// Initialize the chat UI when the popup is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatUI();
}); 