import { AuthService } from './auth';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

// Mock chrome.storage
global.chrome = {
  storage: {
    local: {
      set: jest.fn()
    }
  }
};

describe('AuthService', () => {
  let service;
  let mockAuth;
  let mockProvider;
  let mockUser;

  beforeEach(() => {
    service = new AuthService();
    mockAuth = {
      currentUser: null
    };
    mockProvider = {};
    mockUser = {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg'
    };

    getAuth.mockReturnValue(mockAuth);
    GoogleAuthProvider.mockReturnValue(mockProvider);
  });

  describe('signInWithGoogle', () => {
    it('signs in successfully with Google', async () => {
      const mockResult = {
        user: mockUser
      };
      signInWithPopup.mockResolvedValue(mockResult);

      const result = await service.signInWithGoogle();

      expect(result).toEqual({
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        photoURL: mockUser.photoURL
      });
      expect(signInWithPopup).toHaveBeenCalledWith(mockAuth, mockProvider);
    });

    it('handles sign in errors', async () => {
      const error = new Error('Sign in failed');
      signInWithPopup.mockRejectedValue(error);

      await expect(service.signInWithGoogle())
        .rejects
        .toThrow('Sign in failed');
    });
  });

  describe('signOut', () => {
    it('signs out successfully', async () => {
      signOut.mockResolvedValue();

      await service.signOut();

      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });

    it('handles sign out errors', async () => {
      const error = new Error('Sign out failed');
      signOut.mockRejectedValue(error);

      await expect(service.signOut())
        .rejects
        .toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('returns current user when signed in', async () => {
      const mockUnsubscribe = jest.fn();
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });

      const result = await service.getCurrentUser();

      expect(result).toEqual({
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        photoURL: mockUser.photoURL
      });
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('returns null when signed out', async () => {
      const mockUnsubscribe = jest.fn();
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      const result = await service.getCurrentUser();

      expect(result).toBeNull();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when user is signed in', async () => {
      const mockUnsubscribe = jest.fn();
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });

      const result = await service.isAuthenticated();

      expect(result).toBe(true);
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('returns false when user is signed out', async () => {
      const mockUnsubscribe = jest.fn();
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      const result = await service.isAuthenticated();

      expect(result).toBe(false);
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('auth state listener', () => {
    it('updates storage when user signs in', () => {
      const mockUnsubscribe = jest.fn();
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });

      new AuthService();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        isAuthenticated: true,
        currentUser: {
          uid: mockUser.uid,
          email: mockUser.email,
          displayName: mockUser.displayName,
          photoURL: mockUser.photoURL
        }
      });
    });

    it('updates storage when user signs out', () => {
      const mockUnsubscribe = jest.fn();
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      new AuthService();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        isAuthenticated: false,
        currentUser: null
      });
    });
  });
}); 