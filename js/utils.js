export const utils = {
    /**
     * Bezpieczne wyświetlanie tekstu (ochrona przed XSS)
     * Zamienia znaki specjalne na encje HTML
     */
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const str = String(text);
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * Wyświetla powiadomienie (Toast)
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        // Używamy escapeHtml dla bezpieczeństwa wiadomości
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Walidacja liczb
     */
    validateNumber(value, allowDecimals = false) {
        if (value === '') return '';
        const normalized = value.replace(',', '.');
        const num = parseFloat(normalized);
        
        if (isNaN(num)) return '';
        
        if (!allowDecimals && !Number.isInteger(num)) {
            return Math.floor(num).toString();
        }
        return normalized;
    },

    /**
     * Pobieranie nazwy ćwiczenia
     */
    getExerciseName(exercises, id) {
        const ex = exercises.find(e => e.id === id);
        return ex ? ex.name : 'Nieznane';
    },
    
    /**
     * Bezpieczne parsowanie JSON
     */
    safeJSONParse(str, fallback) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.error('Błąd parsowania JSON:', e);
            return fallback;
        }
    }
};
