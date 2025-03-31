import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../../utils/auth';
import { chatService } from '../../utils/chat';
import { aiService } from '../../utils/ai';
import { pageInteractionService } from '../../utils/pageInteraction';
import { voiceService } from '../../utils/voice';

export const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [macros, setMacros] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    voiceService.init();
    const initAuth = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const newConversationId = `conv_${Date.now()}`;
        setConversationId(newConversationId);
        loadMacros(user.id);
      }
    };
    initAuth();

    const unsubscribe = authService.onAuthStateChange((event, user) => {
      if (user) {
        setCurrentUser(user);
        loadMacros(user.id);
      } else {
        setCurrentUser(null);
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMacros = async (userId) => {
    try {
      const userMacros = await chatService.getMacros(userId);
      setMacros(userMacros);
    } catch (error) {
      console.error('Error loading macros:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentUser) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Save user message
      await chatService.saveMessage(
        currentUser.id,
        conversationId,
        userMessage,
        'user'
      );

      // Get page context for AI
      const pageContext = await pageInteractionService.getPageContext();

      // Generate AI response
      const aiResponse = await aiService.generateResponse([
        ...messages,
        { role: 'user', content: userMessage }
      ]);

      // Save AI response
      await chatService.saveMessage(
        currentUser.id,
        conversationId,
        aiResponse,
        'assistant',
        { model: 'gpt-4' }
      );

      // Generate macro if applicable
      const macro = await aiService.generateMacro(userMessage, pageContext);
      if (macro) {
        await chatService.saveMacro(
          currentUser.id,
          macro.name,
          macro.description,
          macro.action
        );
        setMacros(prev => [...prev, macro]);
      }

      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      ]);
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    voiceService.startListening(
      (transcript) => {
        setInput(transcript);
      },
      (error) => {
        console.error('Voice input error:', error);
      }
    );
  };

  const handleScreenshot = async () => {
    try {
      const screenshot = await pageInteractionService.captureScreenshot();
      const analysis = await aiService.analyzeScreenshot(screenshot);
      
      await chatService.saveMessage(
        currentUser.id,
        conversationId,
        `Screenshot analysis: ${analysis}`,
        'assistant',
        { screenshots: [screenshot] }
      );

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Screenshot analysis: ${analysis}` }
      ]);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  };

  const executeMacro = async (macro) => {
    try {
      await pageInteractionService.executeMacro(macro);
      await chatService.updateMacroUsage(macro.id);
    } catch (error) {
      console.error('Error executing macro:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            {message.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          Send
        </button>
        <button onClick={handleVoiceInput} disabled={isLoading}>
          🎤
        </button>
        <button onClick={handleScreenshot} disabled={isLoading}>
          📸
        </button>
      </div>

      {macros.length > 0 && (
        <div className="macros">
          <h3>Suggested Actions</h3>
          {macros.map((macro) => (
            <button
              key={macro.id}
              onClick={() => executeMacro(macro)}
              className="macro-button"
            >
              {macro.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 