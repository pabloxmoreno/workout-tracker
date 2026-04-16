/**
 * Bezpieczne escape'owanie HTML w celu zapobiegania XSS
 * @param {string} text - Tekst do zescapowania
 * @returns {string} - Bezpieczny tekst HTML
 */
export function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Walidacja danych importowanych z JSON
 * @param {any} data - Dane do walidacji
 * @returns {boolean} - Czy dane są poprawne
 */
export function validateImportData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.logs)) return false;
    
    for (const log of data.logs) {
        if (!log.id || !log.date || !Array.isArray(log.exercises)) {
            return false;
        }
        // Dodatkowa walidacja pól ćwiczeń mogłaby tu być dodana
    }
    return true;
}

/**
 * Funkcja debounce do optymalizacji wydajności przy częstych wywołaniach
 * @param {Function} func - Funkcja do opóźnienia
 * @param {number} wait - Czas oczekiwania w ms
 * @returns {Function} - Opóźniona funkcja
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Formatowanie daty
 */
export function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pl-PL', options);
}

/**
 * Generowanie unikalnego ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Pokazywanie powiadomienia toast
 */
export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    // Bezpieczne ustawienie tekstu
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
