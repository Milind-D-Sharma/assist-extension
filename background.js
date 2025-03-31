import { authService } from './utils/auth';
import { chatService } from './utils/chat';

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Set up initial extension state
  chrome.storage.local.set({
    isAuthenticated: false,
    currentUser: null,
    settings: {
      theme: 'light',
      model: 'gpt-4',
      voiceEnabled: true
    }
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

const OPENAI_API_KEY = 'your-api-key-here'; // Replace with your actual API key

// Handle OpenAI API request
async function handleOpenAIRequest(message) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
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
        temperature: 0.7,
        max_tokens: 150
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