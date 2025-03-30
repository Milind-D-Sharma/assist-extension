export function scanPageContent() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue.trim();
      if (text.length > 30 && node.parentElement.offsetParent !== null) {
        textNodes.push(text);
      }
    }
    return { pageText: textNodes.join('\n') };
  }
  