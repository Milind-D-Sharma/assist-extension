import React, { useState, useEffect } from 'react';
import { authService } from '../../utils/auth';
import { chatService } from '../../utils/chat';
import './Homebase.css';

export const Homebase = () => {
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        loadConversations(user.id);
      }
    };
    initAuth();

    const unsubscribe = authService.onAuthStateChange((event, user) => {
      if (user) {
        setCurrentUser(user);
        loadConversations(user.id);
      } else {
        setCurrentUser(null);
        setConversations([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadConversations = async (userId) => {
    try {
      setIsLoading(true);
      const history = await chatService.getChatHistory(userId);
      
      // Group messages by conversation
      const groupedConversations = history.reduce((acc, message) => {
        if (!acc[message.conversation_id]) {
          acc[message.conversation_id] = {
            id: message.conversation_id,
            messages: [],
            lastMessage: null,
            model: message.metadata?.model || 'Unknown'
          };
        }
        acc[message.conversation_id].messages.push(message);
        if (!acc[message.conversation_id].lastMessage || 
            new Date(message.created_at) > new Date(acc[message.conversation_id].lastMessage.created_at)) {
          acc[message.conversation_id].lastMessage = message;
        }
        return acc;
      }, {});

      setConversations(Object.values(groupedConversations));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!currentUser) return;

    try {
      await chatService.deleteConversation(currentUser.id, conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleExportConversation = (conversation) => {
    const text = conversation.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${conversation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    return (
      <div className="homebase-container">
        <h1>Please sign in to view your chat history</h1>
        <button onClick={() => authService.signInWithGoogle()}>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="homebase-container">Loading...</div>;
  }

  return (
    <div className="homebase-container">
      <div className="conversations-list">
        <h2>Your Conversations</h2>
        {conversations.map(conversation => (
          <div
            key={conversation.id}
            className={`conversation-item ${
              selectedConversation?.id === conversation.id ? 'selected' : ''
            }`}
            onClick={() => setSelectedConversation(conversation)}
          >
            <div className="conversation-header">
              <span className="conversation-date">
                {new Date(conversation.lastMessage.created_at).toLocaleDateString()}
              </span>
              <span className="conversation-model">{conversation.model}</span>
            </div>
            <div className="conversation-preview">
              {conversation.lastMessage.content.substring(0, 100)}...
            </div>
            <div className="conversation-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportConversation(conversation);
                }}
              >
                Export
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(conversation.id);
                }}
                className="delete"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedConversation && (
        <div className="conversation-detail">
          <h2>Conversation Details</h2>
          <div className="messages">
            {selectedConversation.messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                {message.content}
                {message.metadata?.screenshots && (
                  <div className="screenshots">
                    {message.metadata.screenshots.map((screenshot, idx) => (
                      <img
                        key={idx}
                        src={screenshot}
                        alt={`Screenshot ${idx + 1}`}
                        className="screenshot"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 