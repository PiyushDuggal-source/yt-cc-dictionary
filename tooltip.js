/**
 * Tooltip UI Component
 * Creates and manages a floating tooltip for word definitions
 */

class DefinitionTooltip {
  constructor() {
    this.tooltip = null;
    this.currentAudio = null;
    this.isVisible = false;
    this.init();
  }

  init() {
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'yt-dict-tooltip';
    this.tooltip.className = 'yt-dict-tooltip';
    this.tooltip.setAttribute('role', 'tooltip');
    this.tooltip.innerHTML = `
      <div class="yt-dict-tooltip-header">
        <div class="yt-dict-word-info">
          <span class="yt-dict-word"></span>
          <span class="yt-dict-phonetic"></span>
          <button class="yt-dict-audio-btn" title="Play pronunciation" style="display: none;">
            🔊
          </button>
        </div>
        <button class="yt-dict-close-btn" title="Close">×</button>
      </div>
      <div class="yt-dict-tooltip-body">
        <div class="yt-dict-loading">
          <div class="yt-dict-spinner"></div>
          <span>Looking up definition...</span>
        </div>
        <div class="yt-dict-content" style="display: none;"></div>
        <div class="yt-dict-error" style="display: none;"></div>
      </div>
    `;

    document.body.appendChild(this.tooltip);
    this.bindEvents();
  }

  bindEvents() {
    // Close button
    this.tooltip.querySelector('.yt-dict-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    // Audio button
    this.tooltip.querySelector('.yt-dict-audio-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.playAudio();
    });

    // Click outside to close - but not on caption words
    document.addEventListener('click', (e) => {
      if (!this.isVisible) return;
      
      // Don't close if clicking inside tooltip
      if (this.tooltip.contains(e.target)) return;
      
      // Don't close if clicking on a caption word (it will open new definition)
      if (e.target.classList.contains('yt-dict-caption-word')) return;
      
      this.hide();
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Prevent tooltip clicks from bubbling
    this.tooltip.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  async show(targetElement, word) {
    console.log('YT Dict: Showing tooltip for:', word);
    
    this.showLoading();
    this.positionTooltip(targetElement);
    this.tooltip.classList.add('visible');
    this.isVisible = true;

    // Fetch definition
    try {
      const definition = await window.YTDictAPI.fetchDefinition(word);
      
      if (definition.error) {
        this.showError(definition.message, word);
      } else {
        this.showDefinition(definition);
      }
    } catch (err) {
      console.error('YT Dict: Error fetching definition:', err);
      this.showError('Failed to load definition', word);
    }
  }

  positionTooltip(targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 340;
    const tooltipMaxHeight = 400;
    const padding = 12;

    // Calculate horizontal position
    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }

    // Calculate vertical position
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top;
    let transformY;

    if (spaceAbove > tooltipMaxHeight + padding) {
      top = rect.top - padding;
      transformY = '-100%';
    } else if (spaceBelow > tooltipMaxHeight + padding) {
      top = rect.bottom + padding;
      transformY = '0';
    } else {
      top = window.innerHeight / 2;
      transformY = '-50%';
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.width = `${tooltipWidth}px`;
    this.tooltip.style.transform = `translateY(${transformY}) scale(1)`;
  }

  showLoading() {
    this.tooltip.querySelector('.yt-dict-loading').style.display = 'flex';
    this.tooltip.querySelector('.yt-dict-content').style.display = 'none';
    this.tooltip.querySelector('.yt-dict-error').style.display = 'none';
    this.tooltip.querySelector('.yt-dict-word').textContent = '';
    this.tooltip.querySelector('.yt-dict-phonetic').textContent = '';
    this.tooltip.querySelector('.yt-dict-audio-btn').style.display = 'none';
    this.currentAudio = null;
  }

  showDefinition(data) {
    this.tooltip.querySelector('.yt-dict-loading').style.display = 'none';
    this.tooltip.querySelector('.yt-dict-error').style.display = 'none';
    
    this.tooltip.querySelector('.yt-dict-word').textContent = data.word;
    
    if (data.phonetic) {
      this.tooltip.querySelector('.yt-dict-phonetic').textContent = data.phonetic;
    }

    if (data.phonetics && data.phonetics.length > 0) {
      const audioUrl = data.phonetics.find(p => p.audio)?.audio;
      if (audioUrl) {
        this.currentAudio = audioUrl;
        this.tooltip.querySelector('.yt-dict-audio-btn').style.display = 'inline-flex';
      }
    }

    const contentEl = this.tooltip.querySelector('.yt-dict-content');
    contentEl.innerHTML = '';

    data.meanings.forEach(meaning => {
      const meaningEl = document.createElement('div');
      meaningEl.className = 'yt-dict-meaning';
      
      const posEl = document.createElement('div');
      posEl.className = 'yt-dict-pos';
      posEl.textContent = meaning.partOfSpeech;
      meaningEl.appendChild(posEl);

      meaning.definitions.forEach((def, index) => {
        const defEl = document.createElement('div');
        defEl.className = 'yt-dict-definition';
        
        const defText = document.createElement('p');
        defText.className = 'yt-dict-def-text';
        defText.innerHTML = `<span class="yt-dict-def-number">${index + 1}.</span> ${def.definition}`;
        defEl.appendChild(defText);

        if (def.example) {
          const exampleEl = document.createElement('p');
          exampleEl.className = 'yt-dict-example';
          exampleEl.textContent = `"${def.example}"`;
          defEl.appendChild(exampleEl);
        }

        if (def.synonyms && def.synonyms.length > 0) {
          const synEl = document.createElement('p');
          synEl.className = 'yt-dict-synonyms';
          synEl.innerHTML = `<strong>Synonyms:</strong> ${def.synonyms.join(', ')}`;
          defEl.appendChild(synEl);
        }

        meaningEl.appendChild(defEl);
      });

      contentEl.appendChild(meaningEl);
    });

    contentEl.style.display = 'block';
  }

  showError(message, word = '') {
    this.tooltip.querySelector('.yt-dict-loading').style.display = 'none';
    this.tooltip.querySelector('.yt-dict-content').style.display = 'none';
    
    if (word) {
      this.tooltip.querySelector('.yt-dict-word').textContent = word;
    }
    
    const errorEl = this.tooltip.querySelector('.yt-dict-error');
    errorEl.innerHTML = `
      <div class="yt-dict-error-icon">📖</div>
      <p>${message}</p>
    `;
    errorEl.style.display = 'block';
  }

  playAudio() {
    if (this.currentAudio) {
      const audio = new Audio(this.currentAudio);
      audio.play().catch(err => console.error('Audio playback failed:', err));
    }
  }

  hide() {
    this.tooltip.classList.remove('visible');
    this.isVisible = false;
    this.currentAudio = null;
  }
}

// Initialize and export
window.YTDictTooltip = new DefinitionTooltip();
