import { pageInteractionService } from './utils/pageInteraction';

// Create and inject the chat button and box
function createChatInterface() {
  const chatContainer = document.createElement('div');
  chatContainer.id = 'assist-chat-container';
  chatContainer.innerHTML = `
    <div id="assist-chat-button" class="assist-chat-button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
        <path d="M12 6V18M6 12H18" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div id="assist-chat-box" class="assist-chat-box hidden">
      <div class="assist-chat-header">
        <h3>Assist Chat</h3>
        <button id="assist-close-chat" class="assist-close-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div id="assist-chat-messages" class="assist-chat-messages"></div>
      <div class="assist-chat-input-container">
        <textarea id="assist-chat-input" class="assist-chat-input" placeholder="Type your message..."></textarea>
        <div class="assist-chat-buttons">
          <button id="assist-send-message" class="assist-send-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
            </svg>
          </button>
          <button id="assist-voice-input" class="assist-voice-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V11C13 11.55 12.55 12 12 12C11.45 12 11 11.55 11 11V5Z" fill="currentColor"/>
            </svg>
          </button>
          <button id="assist-clear-chat" class="assist-clear-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(chatContainer);

  // Add event listeners
  const chatButton = document.getElementById('assist-chat-button');
  const chatBox = document.getElementById('assist-chat-box');
  const closeButton = document.getElementById('assist-close-chat');
  const sendButton = document.getElementById('assist-send-message');
  const voiceButton = document.getElementById('assist-voice-input');
  const clearButton = document.getElementById('assist-clear-chat');
  const chatInput = document.getElementById('assist-chat-input');
  const chatMessages = document.getElementById('assist-chat-messages');

  chatButton.addEventListener('click', () => {
    chatBox.classList.remove('hidden');
    chatInput.focus();
  });

  closeButton.addEventListener('click', () => {
    chatBox.classList.add('hidden');
  });

  sendButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
      addMessage(message, 'user');
      chatInput.value = '';
      // TODO: Send message to ChatGPT and handle response
      simulateResponse();
    }
  });

  voiceButton.addEventListener('click', () => {
    // TODO: Implement voice input
    console.log('Voice input clicked');
  });

  clearButton.addEventListener('click', () => {
    chatMessages.innerHTML = '';
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });
}

// Add message to chat
function addMessage(text, role) {
  const chatMessages = document.getElementById('assist-chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `assist-message ${role}`;
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Simulate ChatGPT response (replace with actual API call)
function simulateResponse() {
  setTimeout(() => {
    addMessage('This is a simulated response from ChatGPT. The actual API integration will be implemented later.', 'assistant');
  }, 1000);
}

// Initialize chat interface
createChatInterface();

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PAGE_CONTEXT':
      handleGetPageContext(sendResponse);
      break;
    case 'CAPTURE_SCREENSHOT':
      handleCaptureScreenshot(message.data, sendResponse);
      break;
    case 'EXECUTE_ACTION':
      handleExecuteAction(message.data, sendResponse);
      break;
    default:
      console.warn('Unknown message type:', message.type);
  }
  return true;
});

async function handleGetPageContext(sendResponse) {
  try {
    const context = await pageInteractionService.getPageContext();
    sendResponse({ success: true, data: context });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCaptureScreenshot(data, sendResponse) {
  try {
    const screenshot = await pageInteractionService.captureScreenshot(data.selector);
    sendResponse({ success: true, data: screenshot });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleExecuteAction(data, sendResponse) {
  try {
    await pageInteractionService.executeMacro(data);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}
