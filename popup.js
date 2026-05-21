// i18n helper — wraps chrome.i18n.getMessage with fallback
function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

// Apply all data-i18n attributes on the page
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

let settings = {
  enabled: true,
  blockImages: true,
  blockVideos: true,
  blockPages: true,
  showBlockedPage: true,
  customKeywords: []
};

function renderKeywords() {
  const list = document.getElementById('kw-list');
  list.innerHTML = '';
  (settings.customKeywords || []).forEach((kw, i) => {
    const item = document.createElement('div');
    item.className = 'kw-item';
    item.innerHTML = `<span>${kw}</span><span class="kw-remove" data-i="${i}">×</span>`;
    list.appendChild(item);
  });
  list.querySelectorAll('.kw-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      settings.customKeywords.splice(+btn.dataset.i, 1);
      renderKeywords();
    });
  });
}

function applySettings() {
  document.getElementById('toggle-enabled').checked = settings.enabled;
  document.getElementById('toggle-images').checked = settings.blockImages;
  document.getElementById('toggle-videos').checked = settings.blockVideos;
  document.getElementById('toggle-pages').checked = settings.blockPages;
  document.getElementById('toggle-showblocked').checked = settings.showBlockedPage;
  renderKeywords();
  updateStatusLabel();
}

function updateStatusLabel() {
  const label = document.getElementById('status-label');
  if (settings.enabled) {
    label.textContent = t('status_active');
    label.className = 'status on';
  } else {
    label.textContent = t('status_off');
    label.className = 'status';
  }
}

function readSettings() {
  settings.enabled = document.getElementById('toggle-enabled').checked;
  settings.blockImages = document.getElementById('toggle-images').checked;
  settings.blockVideos = document.getElementById('toggle-videos').checked;
  settings.blockPages = document.getElementById('toggle-pages').checked;
  settings.showBlockedPage = document.getElementById('toggle-showblocked').checked;
}

// Init
applyI18n();

chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (resp) => {
  if (resp) settings = { ...settings, ...resp };
  applySettings();
});

document.getElementById('kw-add').addEventListener('click', () => {
  const input = document.getElementById('kw-input');
  const val = input.value.trim().toLowerCase();
  if (val && !(settings.customKeywords || []).includes(val)) {
    if (!settings.customKeywords) settings.customKeywords = [];
    settings.customKeywords.push(val);
    renderKeywords();
  }
  input.value = '';
  input.focus();
});

document.getElementById('kw-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('kw-add').click();
});

document.getElementById('save-btn').addEventListener('click', () => {
  readSettings();
  chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings }, () => {
    applySettings();
    const btn = document.getElementById('save-btn');
    btn.textContent = t('btn_saved');
    setTimeout(() => { btn.textContent = t('btn_save'); }, 1300);
  });
});

document.getElementById('toggle-enabled').addEventListener('change', () => {
  settings.enabled = document.getElementById('toggle-enabled').checked;
  updateStatusLabel();
});
