const STORAGE_KEY = 'spoilerGuardSettings';
const OVERLAY_ID = 'spoiler-guard-overlay';
const STYLE_ID = 'spoiler-guard-style';
const HIDDEN_CLASS = 'spoiler-guard-hidden';
let cachedSettings = null;
let lastUrl = location.href;
let unlockedForPage = false;

function ensureStyleInjected() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #comments.spoiler-guard-locked { 
      position: relative;
      padding-top: 120px;
    }
    #comments.spoiler-guard-locked::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 200px;
      background: linear-gradient(180deg, rgba(15, 15, 15, 1) 0%, rgba(15, 15, 15, 0.95) 40%, rgba(15, 15, 15, 0) 100%);
      z-index: 199;
      pointer-events: none;
    }
    #${OVERLAY_ID} {
      position: absolute;
      top: 20px;
      left: 0;
      right: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
      justify-content: flex-start;
      text-align: center;
      color: #f1f1f1;
      padding: 18px 20px;
      z-index: 200;
    }
    #${OVERLAY_ID} p {
      margin: 0;
      font-size: 16px;
      line-height: 1.6;
      max-width: 520px;
      text-align: center;
    }
    #${OVERLAY_ID} button {
      align-self: center;
      background: linear-gradient(180deg, #3ea6ff, #2a8fde);
      color: #0b0c10;
      border: 1px solid #2a8fde;
      border-radius: 18px;
      padding: 10px 18px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    #${OVERLAY_ID} button:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(0, 0, 0, 0.32); }
    #${OVERLAY_ID} button:active { transform: translateY(0); }
    .${HIDDEN_CLASS} { filter: blur(18px); opacity: 0; pointer-events: none; user-select: none; }
  `;
  document.head.appendChild(style);
}

function getDefaultSettings() {
  return {
    channels: [],
    topics: []
  };
}

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY];
      if (stored && typeof stored === 'object') {
        cachedSettings = {
          channels: (stored.channels || []).map((c) => c.toLowerCase()),
          topics: (stored.topics || []).map((t) => t.toLowerCase())
        };
      } else {
        cachedSettings = getDefaultSettings();
      }
      resolve(cachedSettings);
    });
  });
}

function getChannelName() {
  const selector = document.querySelector('#channel-name a, ytd-channel-name a, #channel-name yt-formatted-string, ytd-channel-name yt-formatted-string');
  if (selector && selector.textContent) {
    return selector.textContent.trim();
  }
  const meta = document.querySelector('meta[itemprop="channelId"]');
  if (meta && meta.content) {
    return meta.content.trim();
  }
  return '';
}

function getVideoTitle() {
  const titleEl = document.querySelector('h1.title yt-formatted-string, h1.title, h1 yt-formatted-string');
  if (titleEl && titleEl.textContent) {
    return titleEl.textContent.trim();
  }
  return document.title || '';
}

function shouldWarn(settings) {
  const channelName = getChannelName().toLowerCase();
  const videoTitle = getVideoTitle().toLowerCase();

  const channelMatch = channelName && settings.channels.some((name) => channelName.includes(name));
  const topicMatch = videoTitle && settings.topics.some((topic) => videoTitle.includes(topic));

  return {
    channelMatch,
    topicMatch,
    shouldShow: channelMatch || topicMatch
  };
}

function buildWarningText(matchInfo) {
  if (matchInfo.channelMatch && matchInfo.topicMatch) {
    return 'Comments hidden: potential spoilers flagged for this channel and topic. Click below to view them.';
  }
  if (matchInfo.channelMatch) {
    return 'Comments hidden: potential spoilers flagged for this channel. Click below to view them.';
  }
  if (matchInfo.topicMatch) {
    return 'Comments hidden: potential spoilers flagged for this topic. Click below to view them.';
  }
  return '';
}

function getGuardTargets() {
  const comments = document.getElementById('comments');
  if (!comments) return null;
  const content = comments.querySelector('#sections') || comments.querySelector('ytd-item-section-renderer');
  if (!content) return null;
  return { comments, content };
}

function clearGuard(targets) {
  if (!targets) return;
  const { comments, content } = targets;
  content.classList.remove(HIDDEN_CLASS);
  comments.classList.remove('spoiler-guard-locked');
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) overlay.remove();
}

function createOverlay(warningText, comments) {
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    const copy = document.createElement('p');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Reveal comments';
    button.addEventListener('click', () => {
      unlockedForPage = true;
      clearGuard(getGuardTargets());
    });
    overlay.append(copy, button);
    comments.insertBefore(overlay, comments.firstChild);
  }
  const textNode = overlay.querySelector('p');
  if (textNode) textNode.textContent = warningText;
  return overlay;
}

function guardComments(matchInfo) {
  const targets = getGuardTargets();
  if (!targets) {
    setTimeout(checkAndInject, 600);
    return;
  }
  const { comments, content } = targets;

  if (!matchInfo.shouldShow) {
    unlockedForPage = false;
    clearGuard(targets);
    return;
  }

  if (unlockedForPage) {
    clearGuard(targets);
    return;
  }

  ensureStyleInjected();
  content.classList.add(HIDDEN_CLASS);
  comments.classList.add('spoiler-guard-locked');
  createOverlay(buildWarningText(matchInfo), comments);
}

async function checkAndInject() {
  const settings = cachedSettings || (await loadSettings());
  const matchInfo = shouldWarn(settings);
  guardComments(matchInfo);
}

function watchNavigation() {
  const observer = new MutationObserver(() => {
    if (lastUrl !== location.href) {
      lastUrl = location.href;
      unlockedForPage = false;
      setTimeout(checkAndInject, 800);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('yt-navigate-finish', () => {
    unlockedForPage = false;
    setTimeout(checkAndInject, 800);
  });
  document.addEventListener('yt-page-data-updated', () => {
    unlockedForPage = false;
    setTimeout(checkAndInject, 800);
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[STORAGE_KEY]) {
    cachedSettings = {
      channels: (changes[STORAGE_KEY].newValue.channels || []).map((c) => c.toLowerCase()),
      topics: (changes[STORAGE_KEY].newValue.topics || []).map((t) => t.toLowerCase())
    };
    unlockedForPage = false;
    checkAndInject();
  }
});

loadSettings().then(() => {
  watchNavigation();
  checkAndInject();
});
