import { authService } from './utils/auth';
import { chatService } from './utils/chat';
import { openaiConfig, extensionConfig } from './config';

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Set up initial extension state
  chrome.storage.local.set({
    isAuthenticated: false,
    currentUser: null,
    settings: extensionConfig.defaultSettings
  });
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'AUTH_STATUS':
      handleAuthStatus(sendResponse);
      break;
    case 'SIGN_IN':
      handleSignIn(sendResponse);
      break;
    case 'SIGN_OUT':
      handleSignOut(sendResponse);
      break;
    case 'SAVE_MESSAGE':
      handleSaveMessage(message.data, sendResponse);
      break;
    case 'GET_CHAT_HISTORY':
      handleGetChatHistory(message.data, sendResponse);
      break;
    case 'EXECUTE_MACRO':
      handleExecuteMacro(message.data, sender.tab.id, sendResponse);
      break;
    case 'OPENAI_REQUEST':
      handleOpenAIRequest(message.message)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      break;
    case 'CAPTURE_SCREENSHOT':
      handleScreenshotCapture(message.data, sender.tab.id, sendResponse);
      break;
    case 'CHAT_MESSAGE':
      handleChatMessage(message.data, sender.tab.id, sendResponse);
      break;
    default:
      console.warn('Unknown message type:', message.type);
  }
  return true; // Keep the message channel open for async responses
});

async function handleAuthStatus(sendResponse) {
  try {
    const user = await authService.getCurrentUser();
    sendResponse({ isAuthenticated: !!user, user });
  } catch (error) {
    sendResponse({ isAuthenticated: false, error: error.message });
  }
}

async function handleSignIn(sendResponse) {
  try {
    const data = await authService.signInWithGoogle();
    sendResponse({ success: true, data });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSignOut(sendResponse) {
  try {
    await authService.signOut();
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSaveMessage(data, sendResponse) {
  try {
    const result = await chatService.saveMessage(
      data.userId,
      data.conversationId,
      data.message,
      data.role,
      data.metadata
    );
    sendResponse({ success: true, data: result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetChatHistory(data, sendResponse) {
  try {
    const history = await chatService.getChatHistory(data.userId, data.conversationId);
    sendResponse({ success: true, data: history });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleExecuteMacro(macro, tabId, sendResponse) {
  try {
    // Inject the macro execution script into the active tab
    await chrome.scripting.executeScript({
      target: { tabId },
      func: executeMacroInPage,
      args: [macro]
    });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Function to be injected into the page
function executeMacroInPage(macro) {
  const { actions } = macro;
  
  for (const action of actions) {
    switch (action.type) {
      case 'fill':
        for (const [selector, value] of Object.entries(action.data)) {
          const element = document.querySelector(selector);
          if (element) {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        break;
      case 'click':
        const button = document.querySelector(action.selector);
        if (button) {
          button.click();
        }
        break;
      case 'wait':
        // Note: This won't work directly in the injected script
        // We'll need to handle this differently
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }
}

// Handle OpenAI API request
async function handleOpenAIRequest(message) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: openaiConfig.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: openaiConfig.temperature,
        max_tokens: openaiConfig.maxTokens,
        presence_penalty: openaiConfig.presencePenalty,
        frequency_penalty: openaiConfig.frequencyPenalty
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      status: 'success'
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// Storage handling for API key
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.openaiApiKey) {
    OPENAI_API_KEY = changes.openaiApiKey.newValue;
  }
});

// Handle screenshot capture
async function handleScreenshotCapture(data, tabId, sendResponse) {
  try {
    const screenshot = await chrome.tabs.captureVisibleTab(null, {
      format: 'png'
    });
    
    // Create a canvas to crop the screenshot
    const img = new Image();
    img.src = screenshot;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = data.width;
    canvas.height = data.height;
    
    ctx.drawImage(
      img,
      data.x,
      data.y,
      data.width,
      data.height,
      0,
      0,
      data.width,
      data.height
    );
    
    sendResponse(canvas.toDataURL());
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    sendResponse({ error: error.message });
  }
}

// Handle chat messages
async function handleChatMessage(data, tabId, sendResponse) {
  try {
    const { message, model, context, conversationId } = data;
    
    // Get API key and settings from storage
    const { openaiApiKey, settings } = await chrome.storage.sync.get(['openaiApiKey', 'settings']);
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    // Get chat history if conversationId exists
    let chatHistory = [];
    if (conversationId) {
      const { data: history } = await chatService.getChatHistory(null, conversationId);
      chatHistory = history || [];
    }
    
    // Prepare the messages array with context and history
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant. Current page context:
        URL: ${context.url}
        Title: ${context.title}
        Content: ${context.text.substring(0, 2000)}...
        
        You can help with:
        - Code explanations and improvements
        - Debugging and error fixing
        - General questions about the page content
        - Writing and editing assistance
        - Technical documentation
        - Best practices and recommendations`
      },
      ...chatHistory,
      {
        role: 'user',
        content: message
      }
    ];
    
    // Make API request based on selected model
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: model || settings?.model || 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.6,
        frequency_penalty: 0.5
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }
    
    const result = await response.json();
    const aiResponse = result.choices[0].message.content;
    
    // Save the message to chat history if conversationId exists
    if (conversationId) {
      await chatService.saveMessage(
        null,
        conversationId,
        message,
        'user',
        { url: context.url, title: context.title }
      );
      await chatService.saveMessage(
        null,
        conversationId,
        aiResponse,
        'assistant',
        { model: model || settings?.model }
      );
    }
    
    // Generate suggestions based on the response
    const suggestions = generateSuggestions(aiResponse);
    
    sendResponse({
      text: aiResponse,
      suggestions,
      model: model || settings?.model
    });
  } catch (error) {
    console.error('Chat message handling failed:', error);
    sendResponse({ 
      error: error.message,
      suggestions: ['Try rephrasing your question', 'Check your API key settings', 'Try a different model']
    });
  }
}

// Generate suggestions based on AI response
function generateSuggestions(response) {
  const suggestions = [];
  
  // Add contextual suggestions based on the response
  if (response.toLowerCase().includes('code')) {
    suggestions.push('Can you explain this code in more detail?');
    suggestions.push('How can I improve this code?');
    suggestions.push('What are the best practices for this code?');
  }
  
  if (response.toLowerCase().includes('error')) {
    suggestions.push('How can I fix this error?');
    suggestions.push('What caused this error?');
    suggestions.push('How can I prevent this error in the future?');
  }
  
  if (response.toLowerCase().includes('function') || response.toLowerCase().includes('method')) {
    suggestions.push('Can you show me an example of how to use this?');
    suggestions.push('What are the parameters for this function?');
  }
  
  // Add general suggestions based on response length
  if (response.length > 500) {
    suggestions.push('Can you summarize this in simpler terms?');
  }
  
  // Add general suggestions
  suggestions.push('Can you provide more examples?');
  suggestions.push('Can you explain this in simpler terms?');
  suggestions.push('What are the alternatives to this approach?');
  
  return [...new Set(suggestions)].slice(0, 3); // Remove duplicates and limit to 3 suggestions
}