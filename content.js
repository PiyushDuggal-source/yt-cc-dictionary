/**
 * YouTube Caption Dictionary - Content Script
 * Replaces YouTube captions with custom styled container
 */

(function() {
  'use strict';

  const CAPTION_SEGMENT_SELECTOR = '.ytp-caption-segment';
  
  let customCaptionContainer = null;
  let hideStyleElement = null;
  let debounceTimer = null;
  let lastCaptionText = '';  // Track last caption to avoid unnecessary updates

  function injectFonts() {
    if (document.querySelector('#yt-dict-fonts')) return;
    
    const link = document.createElement('link');
    link.id = 'yt-dict-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }

  function hideYouTubeCaptions() {
    if (hideStyleElement) return;
    
    hideStyleElement = document.createElement('style');
    hideStyleElement.id = 'yt-dict-hide-captions';
    hideStyleElement.textContent = `
      .caption-window,
      .ytp-caption-window-container {
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(hideStyleElement);
  }

  function createCustomCaptionContainer() {
    if (customCaptionContainer) return customCaptionContainer;

    customCaptionContainer = document.createElement('div');
    customCaptionContainer.id = 'yt-dict-caption-container';
    customCaptionContainer.className = 'yt-dict-caption-container';
    
    const captionText = document.createElement('div');
    captionText.className = 'yt-dict-caption-text';
    customCaptionContainer.appendChild(captionText);
    
    const player = document.querySelector('#movie_player');
    if (player) {
      player.appendChild(customCaptionContainer);
    } else {
      document.body.appendChild(customCaptionContainer);
    }

    return customCaptionContainer;
  }

  function onWordClick(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const target = event.currentTarget;
    const word = target.getAttribute('data-word') || target.textContent;
    
    if (word && word.trim().length > 0 && window.YTDictTooltip) {
      window.YTDictTooltip.show(target, word.trim());
    }
  }

  function createWordSpans(text) {
    const fragment = document.createDocumentFragment();
    const parts = text.split(/(\s+)/);
    
    parts.forEach(part => {
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(' '));
      } else if (part.trim()) {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'yt-dict-caption-word';
        wordSpan.textContent = part;
        wordSpan.setAttribute('data-word', part.replace(/[^\w'-]/g, '').toLowerCase());
        wordSpan.addEventListener('click', onWordClick);
        fragment.appendChild(wordSpan);
      }
    });
    
    return fragment;
  }

  function updateCustomCaptions() {
    // Get text from YouTube's hidden captions
    const segments = document.querySelectorAll(CAPTION_SEGMENT_SELECTOR);
    
    if (segments.length === 0) {
      if (customCaptionContainer) {
        customCaptionContainer.classList.remove('visible');
      }
      lastCaptionText = '';
      return;
    }

    // Build full caption text
    let fullText = '';
    segments.forEach(segment => {
      fullText += segment.textContent + ' ';
    });
    fullText = fullText.trim();

    // Skip if text hasn't changed
    if (fullText === lastCaptionText) {
      return;
    }
    lastCaptionText = fullText;

    if (!fullText) {
      if (customCaptionContainer) {
        customCaptionContainer.classList.remove('visible');
      }
      return;
    }

    const container = createCustomCaptionContainer();
    const textElement = container.querySelector('.yt-dict-caption-text');
    
    textElement.innerHTML = '';
    textElement.appendChild(createWordSpans(fullText));
    
    container.classList.add('visible');
  }

  function debouncedUpdate() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(updateCustomCaptions, 50);
  }

  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      // Check if any mutation is related to YouTube captions (not our container)
      let shouldUpdate = false;
      
      for (const mutation of mutations) {
        const target = mutation.target;
        
        // Skip mutations on our own elements
        if (target.id === 'yt-dict-caption-container' || 
            target.closest('#yt-dict-caption-container') ||
            target.id === 'yt-dict-tooltip' ||
            target.closest('#yt-dict-tooltip')) {
          continue;
        }
        
        // Check if this mutation is in YouTube's caption area
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const isInCaptionWindow = target.closest('.ytp-caption-window-container') ||
                                     target.closest('.caption-window') ||
                                     target.classList?.contains('ytp-caption-segment');
          
          if (isInCaptionWindow || 
              (mutation.addedNodes && [...mutation.addedNodes].some(n => 
                n.classList?.contains('caption-window') || 
                n.querySelector?.('.ytp-caption-segment')))) {
            shouldUpdate = true;
            break;
          }
        }
      }

      if (shouldUpdate) {
        debouncedUpdate();
      }
    });

    const startObserving = () => {
      const player = document.querySelector('#movie_player');
      if (!player) return;
      
      observer.observe(player, {
        childList: true,
        subtree: true,
        characterData: true
      });

      // Initial update
      updateCustomCaptions();
    };

    if (document.querySelector('#movie_player')) {
      startObserving();
    } else {
      const playerObserver = new MutationObserver((mutations, obs) => {
        if (document.querySelector('#movie_player')) {
          obs.disconnect();
          startObserving();
        }
      });
      
      playerObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  function init() {
    injectFonts();
    hideYouTubeCaptions();
    setupObserver();
    console.log('YouTube Caption Dictionary: Initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
