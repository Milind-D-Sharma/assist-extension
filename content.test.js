import { pageInteractionService } from './utils/pageInteraction';

// Mock chrome API
global.chrome = {
  runtime: {
    getURL: jest.fn(url => url),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Mock document
document.body.innerHTML = `
  <div id="test-form">
    <input type="text" id="username" placeholder="Username">
    <button id="submit">Submit</button>
  </div>
`;

describe('Content Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChatContainer', () => {
    it('creates and injects the chat container', () => {
      const container = createChatContainer();
      
      expect(container).toBeTruthy();
      expect(container.id).toBe('ai-assistant-container');
      expect(document.body.contains(container)).toBe(true);
    });

    it('creates draggable container', () => {
      const container = createChatContainer();
      const dragHandle = container.querySelector('div');
      
      // Simulate drag events
      const mousedownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100
      });
      
      const mousemoveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 200
      });
      
      dragHandle.dispatchEvent(mousedownEvent);
      document.dispatchEvent(mousemoveEvent);
      document.dispatchEvent(new MouseEvent('mouseup'));
      
      expect(container.style.transform).toContain('translate3d');
    });

    it('handles minimize/maximize', () => {
      const container = createChatContainer();
      const minimizeButton = document.querySelector('button');
      
      minimizeButton.click();
      expect(container.style.display).toBe('none');
      expect(minimizeButton.textContent).toBe('+');
      
      minimizeButton.click();
      expect(container.style.display).toBe('flex');
      expect(minimizeButton.textContent).toBe('−');
    });

    it('handles close', () => {
      const container = createChatContainer();
      const closeButton = container.querySelector('button');
      
      closeButton.click();
      expect(document.body.contains(container)).toBe(false);
    });
  });

  describe('Message Handling', () => {
    it('handles GET_PAGE_CONTEXT message', async () => {
      const sendResponse = jest.fn();
      await handleGetPageContext(sendResponse);
      
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('handles CAPTURE_SCREENSHOT message', async () => {
      const sendResponse = jest.fn();
      await handleCaptureScreenshot({ selector: '#test-form' }, sendResponse);
      
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: expect.any(String)
      });
    });

    it('handles EXECUTE_ACTION message', async () => {
      const sendResponse = jest.fn();
      const macro = {
        actions: [
          {
            type: 'fill',
            data: { '#username': 'testuser' }
          },
          {
            type: 'click',
            selector: '#submit'
          }
        ]
      };
      
      await handleExecuteAction(macro, sendResponse);
      
      expect(sendResponse).toHaveBeenCalledWith({
        success: true
      });
    });
  });
}); 