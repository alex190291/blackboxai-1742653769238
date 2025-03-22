// Import all language files
import en from './en.js';
import de from './de.js';
import es from './es.js';
import fr from './fr.js';
import it from './it.js';

// Export translations object with all languages
const translations = {
    en,
    de,
    es,
    fr,
    it
};

// Helper function to get translation
export function t(key, locale = 'en') {
    if (!translations[locale]) {
        locale = 'en'; // Fallback to English
    }
    return translations[locale][key] || translations['en'][key] || key;
}

export default translations; 