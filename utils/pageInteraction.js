export class PageInteractionService {
  async getPageContext() {
    const context = {
      url: window.location.href,
      title: document.title,
      forms: this.getFormElements(),
      links: this.getLinks(),
      buttons: this.getButtons(),
      inputs: this.getInputs(),
      metadata: {
        timestamp: new Date(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    return context;
  }

  getFormElements() {
    const forms = Array.from(document.forms);
    return forms.map(form => ({
      id: form.id,
      name: form.name,
      action: form.action,
      method: form.method,
      elements: Array.from(form.elements).map(element => ({
        type: element.type,
        name: element.name,
        id: element.id,
        value: element.value,
        required: element.required
      }))
    }));
  }

  getLinks() {
    const links = Array.from(document.links);
    return links.map(link => ({
      href: link.href,
      text: link.textContent.trim(),
      id: link.id,
      classes: Array.from(link.classList)
    }));
  }

  getButtons() {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map(button => ({
      text: button.textContent.trim(),
      id: button.id,
      type: button.type,
      disabled: button.disabled,
      classes: Array.from(button.classList)
    }));
  }

  getInputs() {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    return inputs.map(input => ({
      type: input.type,
      name: input.name,
      id: input.id,
      placeholder: input.placeholder,
      value: input.value,
      required: input.required,
      disabled: input.disabled
    }));
  }

  async captureScreenshot(selector = null) {
    try {
      const element = selector ? document.querySelector(selector) : document.documentElement;
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const { width, height } = element.getBoundingClientRect();

      canvas.width = width;
      canvas.height = height;

      // Use html2canvas or similar library for actual screenshot
      // This is a placeholder
      return {
        width,
        height,
        timestamp: new Date(),
        element: selector || 'full-page'
      };
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }

  async executeMacro(actions) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'click':
            await this.click(action.selector);
            break;
          case 'type':
            await this.type(action.selector, action.text);
            break;
          case 'select':
            await this.select(action.selector, action.value);
            break;
          case 'wait':
            await this.wait(action.duration);
            break;
          case 'scroll':
            await this.scroll(action.x, action.y);
            break;
          default:
            console.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
        throw error;
      }
    }
  }

  async click(selector) {
    const element = await this.waitForElement(selector);
    element.click();
  }

  async type(selector, text) {
    const element = await this.waitForElement(selector);
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async select(selector, value) {
    const element = await this.waitForElement(selector);
    element.value = value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async wait(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  async scroll(x, y) {
    window.scrollTo(x, y);
  }

  async waitForElement(selector, timeout = 5000) {
    const element = document.querySelector(selector);
    if (element) return element;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(interval);
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error(`Timeout waiting for element: ${selector}`));
        }
      }, 100);
    });
  }
}

export const pageInteractionService = new PageInteractionService(); 