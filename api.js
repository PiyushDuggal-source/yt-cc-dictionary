/**
 * Dictionary API integration
 * Uses Free Dictionary API (https://dictionaryapi.dev/)
 */

const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/**
 * Fetches word definition from the Free Dictionary API
 * @param {string} word - The word to look up
 * @returns {Promise<Object>} - Definition data or error object
 */
async function fetchDefinition(word) {
  // Clean the word - remove punctuation and convert to lowercase
  const cleanWord = word.replace(/[^\w'-]/g, '').toLowerCase().trim();
  
  if (!cleanWord) {
    return { error: true, message: 'Invalid word' };
  }

  try {
    const response = await fetch(`${DICTIONARY_API_BASE}/${encodeURIComponent(cleanWord)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { error: true, message: 'Word not found', word: cleanWord };
      }
      return { error: true, message: 'Failed to fetch definition' };
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return { error: true, message: 'No definition available' };
    }

    // Parse and return structured definition data
    return parseDefinitionData(data[0], cleanWord);
  } catch (err) {
    console.error('Dictionary API error:', err);
    return { error: true, message: 'Network error. Please try again.' };
  }
}

/**
 * Parses raw API response into a structured format
 * @param {Object} data - Raw API response
 * @param {string} word - The searched word
 * @returns {Object} - Structured definition object
 */
function parseDefinitionData(data, word) {
  const result = {
    word: data.word || word,
    phonetic: null,
    phonetics: [],
    meanings: [],
    error: false
  };

  // Extract phonetic
  if (data.phonetic) {
    result.phonetic = data.phonetic;
  } else if (data.phonetics && data.phonetics.length > 0) {
    // Find first phonetic with text
    const phoneticWithText = data.phonetics.find(p => p.text);
    if (phoneticWithText) {
      result.phonetic = phoneticWithText.text;
    }
  }

  // Extract phonetics with audio
  if (data.phonetics) {
    result.phonetics = data.phonetics
      .filter(p => p.audio)
      .map(p => ({
        text: p.text || '',
        audio: p.audio.startsWith('//') ? `https:${p.audio}` : p.audio
      }));
  }

  // Extract meanings (limit to first 3 for brevity)
  if (data.meanings) {
    result.meanings = data.meanings.slice(0, 3).map(meaning => ({
      partOfSpeech: meaning.partOfSpeech,
      definitions: meaning.definitions.slice(0, 2).map(def => ({
        definition: def.definition,
        example: def.example || null,
        synonyms: def.synonyms ? def.synonyms.slice(0, 3) : [],
        antonyms: def.antonyms ? def.antonyms.slice(0, 3) : []
      }))
    }));
  }

  return result;
}

// Export for use in content script
window.YTDictAPI = { fetchDefinition };
