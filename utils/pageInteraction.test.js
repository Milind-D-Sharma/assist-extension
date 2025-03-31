import { PageInteractionService } from './pageInteraction';

describe('PageInteractionService', () => {
  let service;
  let mockDocument;

  beforeEach(() => {
    service = new PageInteractionService();
    
    // Mock document
    mockDocument = {
      location: {
        href: 'https://example.com'
      },
      title: 'Test Page',
      forms: [
        {
          id: 'test-form',
          action: '/submit',
          elements: [
            {
              type: 'text',
              name: 'username',
              value: '',
              placeholder: 'Enter username',
              required: true
            }
          ]
        }
      ],
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      createElement: jest.fn()
    };

    global.document = mockDocument;
    global.window = {
      innerWidth: 1024,
      innerHeight: 768
    };
  });

  describe('getPageContext', () => {
    it('returns page context with forms and elements', async () => {
      mockDocument.querySelectorAll.mockReturnValue([
        {
          tagName: 'BUTTON',
          textContent: 'Submit',
          id: 'submit-btn',
          className: 'btn',
          href: null,
          getAttribute: () => 'button'
        },
        {
          type: 'text',
          name: 'email',
          value: '',
          placeholder: 'Enter email',
          required: true,
          id: 'email-input',
          className: 'form-control'
        }
      ]);

      const context = await service.getPageContext();

      expect(context).toEqual({
        url: 'https://example.com',
        title: 'Test Page',
        forms: [
          {
            id: 'test-form',
            action: '/submit',
            elements: [
              {
                type: 'text',
                name: 'username',
                value: '',
                placeholder: 'Enter username',
                required: true
              }
            ]
          }
        ],
        clickableElements: [
          {
            tagName: 'button',
            text: 'Submit',
            id: 'submit-btn',
            className: 'btn',
            href: null,
            role: 'button'
          }
        ],
        inputFields: [
          {
            type: 'text',
            name: 'email',
            value: '',
            placeholder: 'Enter email',
            required: true,
            id: 'email-input',
            className: 'form-control'
          }
        ],
        timestamp: expect.any(String)
      });
    });
  });

  describe('captureScreenshot', () => {
    it('creates a canvas and captures screenshot', async () => {
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue({
          drawWindow: jest.fn(),
          strokeStyle: '',
          lineWidth: 0,
          strokeRect: jest.fn()
        }),
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,...')
      };

      mockDocument.createElement.mockReturnValue(mockCanvas);

      const screenshot = await service.captureScreenshot();

      expect(mockDocument.createElement).toHaveBeenCalledWith('canvas');
      expect(screenshot).toBe('data:image/png;base64,...');
    });

    it('highlights element when selector is provided', async () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          left: 100,
          top: 100,
          width: 200,
          height: 50
        })
      };

      mockDocument.querySelector.mockReturnValue(mockElement);

      const mockCanvas = {
        getContext: jest.fn().mockReturnValue({
          drawWindow: jest.fn(),
          strokeStyle: '',
          lineWidth: 0,
          strokeRect: jest.fn()
        }),
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,...')
      };

      mockDocument.createElement.mockReturnValue(mockCanvas);

      await service.captureScreenshot('#test-element');

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#test-element');
      expect(mockCanvas.getContext().strokeRect).toHaveBeenCalledWith(100, 100, 200, 50);
    });
  });

  describe('executeMacro', () => {
    it('executes fill action', async () => {
      const mockElement = {
        value: '',
        dispatchEvent: jest.fn()
      };

      mockDocument.querySelector.mockReturnValue(mockElement);

      await service.executeMacro({
        actions: [
          {
            type: 'fill',
            data: { '#username': 'testuser' }
          }
        ]
      });

      expect(mockElement.value).toBe('testuser');
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(2);
    });

    it('executes click action', async () => {
      const mockElement = {
        click: jest.fn()
      };

      mockDocument.querySelector.mockReturnValue(mockElement);

      await service.executeMacro({
        actions: [
          {
            type: 'click',
            selector: '#submit-btn'
          }
        ]
      });

      expect(mockElement.click).toHaveBeenCalled();
    });

    it('executes wait action', async () => {
      const start = Date.now();
      await service.executeMacro({
        actions: [
          {
            type: 'wait',
            duration: 100
          }
        ]
      });
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(100);
    });

    it('executes type action', async () => {
      const mockElement = {
        focus: jest.fn(),
        value: '',
        dispatchEvent: jest.fn()
      };

      mockDocument.querySelector.mockReturnValue(mockElement);

      await service.executeMacro({
        actions: [
          {
            type: 'type',
            selector: '#input',
            text: 'Hello World'
          }
        ]
      });

      expect(mockElement.focus).toHaveBeenCalled();
      expect(mockElement.value).toBe('Hello World');
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(2);
    });

    it('executes select action', async () => {
      const mockElement = {
        value: '',
        dispatchEvent: jest.fn()
      };

      mockDocument.querySelector.mockReturnValue(mockElement);

      await service.executeMacro({
        actions: [
          {
            type: 'select',
            selector: '#select',
            value: 'option1'
          }
        ]
      });

      expect(mockElement.value).toBe('option1');
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });

    it('executes scroll action', async () => {
      const mockElement = {
        scrollIntoView: jest.fn()
      };

      mockDocument.querySelector.mockReturnValue(mockElement);

      await service.executeMacro({
        actions: [
          {
            type: 'scroll',
            selector: '#element'
          }
        ]
      });

      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      });
    });
  });
}); 