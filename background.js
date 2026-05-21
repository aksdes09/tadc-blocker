const TADC_KEYWORDS = [
  "amazing digital circus",
  "amazingdigitalcircus",
  "pomni",
  "caine the ringmaster",
  "jax tadc",
  "gangle tadc",
  "kinger tadc",
  "ragatha tadc",
  "zooble tadc",
  "digital circus",
  "gooseworx",
  "tadc episode"
];

const TADC_URL_PATTERNS = [
  /amazingdigitalcircus/i,
  /amazing.digital.circus/i,
  /digital.circus/i,
  /gooseworx/i,
  /tadc/i
];

let settings = {
  enabled: true,
  blockImages: true,
  blockVideos: true,
  blockPages: true,
  showBlockedPage: true,
  customKeywords: []
};

chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    settings = { ...settings, ...result.settings };
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    settings = { ...settings, ...changes.settings.newValue };
  }
});

function isTADCUrl(url) {
  if (!settings.enabled) return false;
  return TADC_URL_PATTERNS.some(pattern => pattern.test(url));
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!settings.enabled) return;
  if (changeInfo.url && isTADCUrl(changeInfo.url)) {
    if (settings.showBlockedPage) {
      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL('blocked.html')
      });
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SETTINGS') {
    sendResponse(settings);
  }
  if (msg.type === 'PAGE_CONTAINS_TADC') {
    if (settings.enabled && settings.blockPages && sender.tab) {
      chrome.tabs.update(sender.tab.id, {
        url: chrome.runtime.getURL('blocked.html')
      });
    }
  }
  if (msg.type === 'UPDATE_SETTINGS') {
    settings = { ...settings, ...msg.settings };
    chrome.storage.sync.set({ settings });
    sendResponse({ ok: true });
  }
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ settings });
});
