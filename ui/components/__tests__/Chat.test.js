import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Chat } from '../Chat';
import { authService } from '../../../utils/auth';
import { chatService } from '../../../utils/chat';
import { aiService } from '../../../utils/ai';
import { pageInteractionService } from '../../../utils/pageInteraction';
import { voiceService } from '../../../utils/voice';

// Mock all services
jest.mock('../../../utils/auth');
jest.mock('../../../utils/chat');
jest.mock('../../../utils/ai');
jest.mock('../../../utils/pageInteraction');
jest.mock('../../../utils/voice');

describe('Chat Component', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com'
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock auth service
    authService.getCurrentUser.mockResolvedValue(mockUser);
    authService.onAuthStateChange.mockReturnValue(() => {});

    // Mock chat service
    chatService.getMacros.mockResolvedValue([]);
    chatService.saveMessage.mockResolvedValue({});
    chatService.saveMacro.mockResolvedValue({});

    // Mock AI service
    aiService.generateResponse.mockResolvedValue('AI response');
    aiService.generateMacro.mockResolvedValue(null);

    // Mock page interaction service
    pageInteractionService.getPageContext.mockResolvedValue({});
    pageInteractionService.captureScreenshot.mockResolvedValue('screenshot.png');

    // Mock voice service
    voiceService.init.mockImplementation(() => {});
    voiceService.startListening.mockImplementation((onResult) => {
      onResult('Voice input');
    });
  });

  it('renders without crashing', async () => {
    render(<Chat />);
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('handles user input and sends message', async () => {
    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'Hello, AI!' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(chatService.saveMessage).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        'Hello, AI!',
        'user'
      );
    });
  });

  it('handles voice input', async () => {
    render(<Chat />);
    
    const voiceButton = screen.getByText('🎤');
    fireEvent.click(voiceButton);

    await waitFor(() => {
      expect(voiceService.startListening).toHaveBeenCalled();
    });
  });

  it('handles screenshot capture', async () => {
    render(<Chat />);
    
    const screenshotButton = screen.getByText('📸');
    fireEvent.click(screenshotButton);

    await waitFor(() => {
      expect(pageInteractionService.captureScreenshot).toHaveBeenCalled();
    });
  });

  it('displays loading state while processing', async () => {
    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    // Mock a delay in AI response
    aiService.generateResponse.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('AI response'), 100))
    );

    fireEvent.change(input, { target: { value: 'Hello, AI!' } });
    fireEvent.click(sendButton);

    expect(sendButton).toBeDisabled();
    expect(input).toBeDisabled();

    await waitFor(() => {
      expect(sendButton).not.toBeDisabled();
      expect(input).not.toBeDisabled();
    });
  });
}); 