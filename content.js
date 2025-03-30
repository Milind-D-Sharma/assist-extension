fetch(chrome.runtime.getURL('ui/chatbox.html'))
  .then(res => res.text())
  .then(html => {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = chrome.runtime.getURL('ui/chatbox.css');
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('ui/chatbox.js');
    script.type = 'module';
    document.body.appendChild(script);
  });
