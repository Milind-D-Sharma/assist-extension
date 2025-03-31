import { ChatUI } from './popup';

// Mock DOM elements
document.body.innerHTML = `
  <template id="message-template">
    <div class="message">
      <div class="message-content">
        <div class="message-text"></div>
        <div class="message-time"></div>
      </div>
      <div class="message-actions">
        <button class="btn icon-btn copy-btn">
          <img src="icons/copy.svg" alt="Copy">
        </button>
        <button class="btn icon-btn regenerate-btn">
          <img src="icons/regenerate.svg" alt="Regenerate">
        </button>
      </div>
    </div>
  </template>
  <div id="auth-section" class="section">
    <div class="auth-container">
      <h1>AI Assistant</h1>
      <p>Sign in to start using the AI Assistant</p>
      <button id="sign-in-btn" class="btn primary">
        <img src="icons/google.svg" alt="Google" class="icon">
        Sign in with Google
      </button>
    </div>
  </div>
  <div id="chat-section" class="section hidden">
    <div class="chat-header">
      <div class="user-info">
        <img id="user-avatar" src="icons/default-avatar.png" alt="User avatar">
        <span id="user-name">User</span>
      </div>
      <button id="sign-out-btn" class="btn icon-btn">
        <img src="icons/logout.svg" alt="Sign out">
      </button>
    </div>
    <div class="chat-container">
      <div id="messages" class="messages"></div>
      <div class="input-container">
        <textarea id="message-input" placeholder="Type your message..." rows="1"></textarea>
        <button id="send-btn" class="btn icon-btn" disabled>
          <img src="icons/send.svg" alt="Send">
        </button>
      </div>
    </div>
  </div>
  <div id="loading-section" class="section hidden">
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  </div>
  <div id="error-section" class="section hidden">
    <div class="error-container">
      <img src="icons/error.svg" alt="Error" class="icon">
      <p id="error-message">An error occurred</p>
      <button id="retry-btn" class="btn secondary">Retry</button>
    </div>
  </div>
`;

// Mock services
jest.mock('./utils/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn()
  }
}));

jest.mock('./utils/chat', () => ({
  chatService: {
    getConversations: jest.fn(),
    getChatHistory: jest.fn(),
    saveMessage: jest.fn()
  }
}));

describe('ChatUI', () => {
  let ui;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    ui = new ChatUI();
    mockUser = {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg'
    };
  });

  describe('initialization', () => {
    it('checks auth state on initialization', async () => {
      await ui.checkAuthState();
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });

    it('shows auth section when user is not signed in', async () => {
      authService.getCurrentUser.mockResolvedValue(null);
      await ui.checkAuthState();
      expect(document.getElementById('auth-section').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('chat-section').classList.contains('hidden')).toBe(true);
    });

    it('shows chat section when user is signed in', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);
      await ui.checkAuthState();
      expect(document.getElementById('auth-section').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('chat-section').classList.contains('hidden')).toBe(false);
    });
  });

  describe('authentication', () => {
    it('handles sign in successfully', async () => {
      authService.signInWithGoogle.mockResolvedValue(mockUser);
      await ui.handleSignIn();
      expect(authService.signInWithGoogle).toHaveBeenCalled();
      expect(document.getElementById('user-name').textContent).toBe(mockUser.displayName);
      expect(document.getElementById('user-avatar').src).toBe(mockUser.photoURL);
    });

    it('handles sign out successfully', async () => {
      await ui.handleSignOut();
      expect(authService.signOut).toHaveBeenCalled();
      expect(document.getElementById('auth-section').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('chat-section').classList.contains('hidden')).toBe(true);
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);
      await ui.checkAuthState();
    });

    it('enables send button when input has text', () => {
      const input = document.getElementById('message-input');
      const sendBtn = document.getElementById('send-btn');
      
      input.value = 'Hello';
      input.dispatchEvent(new Event('input'));
      
      expect(sendBtn.disabled).toBe(false);
    });

    it('disables send button when input is empty', () => {
      const input = document.getElementById('message-input');
      const sendBtn = document.getElementById('send-btn');
      
      input.value = '';
      input.dispatchEvent(new Event('input'));
      
      expect(sendBtn.disabled).toBe(true);
    });

    it('sends message on button click', async () => {
      const input = document.getElementById('message-input');
      const sendBtn = document.getElementById('send-btn');
      
      input.value = 'Hello';
      input.dispatchEvent(new Event('input'));
      sendBtn.click();
      
      expect(chatService.saveMessage).toHaveBeenCalledWith(
        mockUser.uid,
        expect.any(String),
        'Hello',
        'user'
      );
    });

    it('sends message on Enter key', async () => {
      const input = document.getElementById('message-input');
      
      input.value = 'Hello';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      
      expect(chatService.saveMessage).toHaveBeenCalledWith(
        mockUser.uid,
        expect.any(String),
        'Hello',
        'user'
      );
    });

    it('does not send message on Shift+Enter', async () => {
      const input = document.getElementById('message-input');
      
      input.value = 'Hello';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
      
      expect(chatService.saveMessage).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('shows error section when an error occurs', async () => {
      const error = new Error('Test error');
      authService.getCurrentUser.mockRejectedValue(error);
      
      await ui.checkAuthState();
      
      expect(document.getElementById('error-section').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('error-message').textContent).toBe('Test error');
    });

    it('retries on error when retry button is clicked', async () => {
      const error = new Error('Test error');
      authService.getCurrentUser
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockUser);
      
      await ui.checkAuthState();
      document.getElementById('retry-btn').click();
      
      expect(authService.getCurrentUser).toHaveBeenCalledTimes(2);
    });
  });
}); 