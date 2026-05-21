(function () {
  const TADC_KEYWORDS = [
    "the amazing digital circus",
    "theamazingdigitalcircus",
    "the-amazing-digital-circus",
    "amazing digital circus",
    "amazingdigitalcircus",
    "amazing-digital-circus",
    "pomni",
    "caine",
    "jax",
    "gangle",
    "kinger",
    "ragatha",
    "zooble",
    "digital circus",
    "gooseworx",
  ];

  let settings = {
    enabled: true,
    blockImages: true,
    blockVideos: true,
    blockPages: true,
    showBlockedPage: true,
    customKeywords: [],
  };

  function getAllKeywords() {
    return [...TADC_KEYWORDS, ...(settings.customKeywords || [])].map((k) =>
      k.toLowerCase(),
    );
  }

  function containsTADC(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return getAllKeywords().some((kw) => lower.includes(kw));
  }

  function isTADCUrl(url) {
    if (!url) return false;
    return containsTADC(url);
  }

  function makeBlockedPlaceholder(type = "content") {
    const el = document.createElement("div");
    el.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #111;
      border: 1px solid #444;
      border-radius: 6px;
      color: #aaa;
      font-family: sans-serif;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 10px;
      gap: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-sizing: border-box;
      min-width: 60px;
      min-height: 36px;
    `;
    el.textContent = chrome.i18n.getMessage("placeholder_text") || "🚫 Blocked";
    el.title = "Контент TADC заблокирован";
    return el;
  }

  function processImages() {
    if (!settings.blockImages) return;
    document.querySelectorAll("img").forEach((img) => {
      const src = img.src || img.getAttribute("src") || "";
      const alt = img.alt || "";
      const dataSrc = img.getAttribute("data-src") || "";
      if (isTADCUrl(src) || isTADCUrl(dataSrc) || containsTADC(alt)) {
        const placeholder = makeBlockedPlaceholder("image");
        placeholder.style.width = (img.width || 100) + "px";
        placeholder.style.height = (img.height || 60) + "px";
        img.replaceWith(placeholder);
      }
    });
  }

  function processVideos() {
    if (!settings.blockVideos) return;
    document.querySelectorAll("video, iframe").forEach((el) => {
      const src = el.src || el.getAttribute("src") || "";
      const title = el.title || el.getAttribute("title") || "";
      if (isTADCUrl(src) || containsTADC(title)) {
        const placeholder = makeBlockedPlaceholder("video");
        placeholder.style.width = (el.offsetWidth || 320) + "px";
        placeholder.style.height = (el.offsetHeight || 180) + "px";
        placeholder.style.display = "flex";
        el.replaceWith(placeholder);
      }
    });
  }

  function processLinks() {
    document.querySelectorAll("a").forEach((link) => {
      const href = link.href || "";
      const text = link.textContent || "";
      if (isTADCUrl(href) || containsTADC(text)) {
        link.style.display = "none";
      }
    });
  }

  function processTextNodes() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName?.toLowerCase();
          if (["script", "style", "noscript", "head"].includes(tag))
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );
    const toReplace = [];
    let node;
    while ((node = walker.nextNode())) {
      if (containsTADC(node.textContent)) {
        toReplace.push(node);
      }
    }
    toReplace.forEach((textNode) => {
      const original = textNode.textContent;
      const replaced = replaceKeywordsInText(original);
      if (replaced !== original) {
        textNode.textContent = replaced;
      }
    });
  }

  function replaceKeywordsInText(text) {
    let result = text;
    getAllKeywords().forEach((kw) => {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      result = result.replace(regex, "[TADC]");
    });
    return result;
  }

  function checkPageTitle() {
    if (!settings.blockPages) return;
    if (containsTADC(document.title)) {
      chrome.runtime.sendMessage({ type: "PAGE_CONTAINS_TADC" });
    }
  }

  function runAll() {
    if (!settings.enabled) return;
    processImages();
    processVideos();
    processLinks();
    processTextNodes();
    checkPageTitle();
  }

  chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
    if (response) settings = { ...settings, ...response };
    runAll();

    const observer = new MutationObserver(() => {
      runAll();
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
})();
