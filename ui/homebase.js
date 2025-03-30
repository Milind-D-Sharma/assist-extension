document.addEventListener("DOMContentLoaded", () => {
  const modelSelect = document.getElementById("model-select");
  const voiceToggle = document.getElementById("voice-toggle");
  const themeToggle = document.getElementById("theme-toggle");

  chrome.storage.sync.get(["preferredModel", "interactionHistory", "userProfile", "voiceEnabled", "darkMode"], data => {
    if (data.preferredModel) modelSelect.value = data.preferredModel;
    if (data.voiceEnabled) voiceToggle.checked = true;
    if (data.darkMode) {
      themeToggle.checked = true;
      document.body.classList.add("dark");
    }

    if (data.interactionHistory) {
      const list = document.getElementById("history-list");
      data.interactionHistory.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.timestamp}: ${item.message}`;
        list.appendChild(li);
      });
    }

    if (data.userProfile) {
      document.getElementById("user-info").textContent = `Signed in as: ${data.userProfile.email}`;
    }
  });

  modelSelect.addEventListener("change", () => {
    chrome.storage.sync.set({ preferredModel: modelSelect.value });
  });

  voiceToggle.addEventListener("change", () => {
    chrome.storage.sync.set({ voiceEnabled: voiceToggle.checked });
  });

  themeToggle.addEventListener("change", () => {
    const isDark = themeToggle.checked;
    document.body.classList.toggle("dark", isDark);
    chrome.storage.sync.set({ darkMode: isDark });
  });
});