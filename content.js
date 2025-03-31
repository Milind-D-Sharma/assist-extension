import { pageInteractionService } from './utils/pageInteraction';

// Create and inject the chat container
function createChatContainer() {
  const container = document.createElement('div');
  container.id = 'ai-assistant-container';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    display: flex;
    flex-direction: column;
  `;

  // Add drag handle
  const dragHandle = document.createElement('div');
  dragHandle.style.cssText = `
    padding: 8px;
    background: #f8f8f8;
    border-radius: 12px 12px 0 0;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
  `;

  const title = document.createElement('span');
  title.textContent = 'AI Assistant';
  title.style.fontWeight = 'bold';

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 0 8px;
    color: #666;
  `;

  dragHandle.appendChild(title);
  dragHandle.appendChild(closeButton);
  container.appendChild(dragHandle);

  // Add iframe for chat UI
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('popup.html');
  iframe.style.cssText = `
    flex: 1;
    border: none;
    border-radius: 0 0 12px 12px;
  `;
  container.appendChild(iframe);

  // Add minimize button
  const minimizeButton = document.createElement('button');
  minimizeButton.textContent = '−';
  minimizeButton.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background: #007AFF;
    color: white;
    border: none;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 10001;
  `;

  // Add to page
  document.body.appendChild(container);
  document.body.appendChild(minimizeButton);

  // Make container draggable
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  dragHandle.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === dragHandle) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, container);
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  // Handle minimize/maximize
  let isMinimized = false;
  minimizeButton.addEventListener('click', () => {
    isMinimized = !isMinimized;
    container.style.display = isMinimized ? 'none' : 'flex';
    minimizeButton.textContent = isMinimized ? '+' : '−';
  });

  // Handle close
  closeButton.addEventListener('click', () => {
    container.remove();
    minimizeButton.remove();
  });

  return container;
}

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

// Initialize the chat container
createChatContainer();
