import { ChatService } from './chat';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() }))
  }
}));

describe('ChatService', () => {
  let service;
  let mockCollection;
  let mockQuery;
  let mockDocs;

  beforeEach(() => {
    service = new ChatService();
    mockCollection = jest.fn();
    mockQuery = jest.fn();
    mockDocs = jest.fn();
  });

  describe('saveMessage', () => {
    it('saves a message successfully', async () => {
      const mockDocRef = { id: 'test-id' };
      const mockData = {
        userId: 'user123',
        conversationId: 'conv456',
        message: 'Hello',
        role: 'user',
        metadata: { timestamp: new Date() }
      };

      mockCollection.mockReturnValue('messages');
      mockQuery.mockReturnValue('query');
      mockDocs.mockResolvedValue({ docs: [{ data: () => mockData }] });
      addDoc.mockResolvedValue(mockDocRef);

      const result = await service.saveMessage(
        mockData.userId,
        mockData.conversationId,
        mockData.message,
        mockData.role,
        mockData.metadata
      );

      expect(result).toEqual({
        id: 'test-id',
        ...mockData,
        timestamp: expect.any(Date)
      });
      expect(addDoc).toHaveBeenCalledWith('messages', expect.objectContaining(mockData));
    });

    it('handles errors when saving message', async () => {
      const error = new Error('Save failed');
      addDoc.mockRejectedValue(error);

      await expect(service.saveMessage('user123', 'conv456', 'Hello', 'user'))
        .rejects
        .toThrow('Save failed');
    });
  });

  describe('getChatHistory', () => {
    it('retrieves chat history successfully', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          message: 'Hello',
          timestamp: { toDate: () => new Date() }
        },
        {
          id: 'msg2',
          message: 'Hi',
          timestamp: { toDate: () => new Date() }
        }
      ];

      mockCollection.mockReturnValue('messages');
      mockQuery.mockReturnValue('query');
      mockDocs.mockResolvedValue({ docs: mockMessages });

      const result = await service.getChatHistory('user123', 'conv456');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'msg1',
        message: 'Hello',
        timestamp: expect.any(Date)
      });
    });

    it('handles errors when getting chat history', async () => {
      const error = new Error('Retrieval failed');
      mockCollection.mockReturnValue('messages');
      mockQuery.mockReturnValue('query');
      mockDocs.mockRejectedValue(error);

      await expect(service.getChatHistory('user123', 'conv456'))
        .rejects
        .toThrow('Retrieval failed');
    });
  });

  describe('getConversations', () => {
    it('retrieves conversations successfully', async () => {
      const mockMessages = [
        {
          data: () => ({
            conversationId: 'conv1',
            message: 'Hello',
            timestamp: { toDate: () => new Date() }
          })
        },
        {
          data: () => ({
            conversationId: 'conv1',
            message: 'Hi',
            timestamp: { toDate: () => new Date() }
          })
        }
      ];

      mockCollection.mockReturnValue('messages');
      mockQuery.mockReturnValue('query');
      mockDocs.mockResolvedValue({ docs: mockMessages });

      const result = await service.getConversations('user123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'conv1',
        lastMessage: 'Hi',
        lastMessageTime: expect.any(Date),
        messageCount: 2
      });
    });

    it('handles errors when getting conversations', async () => {
      const error = new Error('Retrieval failed');
      mockCollection.mockReturnValue('messages');
      mockQuery.mockReturnValue('query');
      mockDocs.mockRejectedValue(error);

      await expect(service.getConversations('user123'))
        .rejects
        .toThrow('Retrieval failed');
    });
  });

  describe('deleteConversation', () => {
    it('deletes conversation successfully', async () => {
      const mockDocs = [
        { ref: 'doc1' },
        { ref: 'doc2' }
      ];

      mockCollection.mockReturnValue('messages');
      mockQuery.mockReturnValue('query');
      mockDocs.mockResolvedValue({ docs: mockDocs });

      const result = await service.deleteConversation('user123', 'conv456');

      expect(result).toBe(true);
      expect(mockDocs).toHaveLength(2);
    });

    it('handles errors when deleting conversation', async () => {
      const error = new Error('Deletion failed');
      mockCollection.mockReturnValue('messages');
      mockQuery.mockReturnValue('query');
      mockDocs.mockRejectedValue(error);

      await expect(service.deleteConversation('user123', 'conv456'))
        .rejects
        .toThrow('Deletion failed');
    });
  });
}); 