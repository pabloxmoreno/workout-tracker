// Utils - funkcje pomocnicze z zabezpieczeniami

export const utils = {
    /**
     * Bezpieczne escape'owanie HTML - zapobiega XSS
     * @param {string} str - tekst do zescape'owania
     * @returns {string} - bezpieczny tekst HTML
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return; // Zabezpieczenie
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message; // textContent jest bezpieczny
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    validateNumber(value, allowDecimals = false) {
        if (value === '') return '';
        // Usuń wszystko co nie jest cyfrą, kropką lub minusem
        const cleaned = value.replace(/[^0-9.-]/g, '');
        
        const num = parseFloat(cleaned);
        if (isNaN(num)) return '';
        
        if (!allowDecimals && !Number.isInteger(num)) {
            return Math.floor(num).toString();
        }
        return cleaned;
    },

    getExerciseName(exercises, id) {
        const ex = exercises.find(e => e.id === id);
        return ex ? ex.name : 'Nieznane';
    },

    /**
     * Debounce - ogranicza częstotliwość wywołań funkcji
     * @param {Function} func - funkcja do opóźnienia
     * @param {number} wait - czas oczekiwania w ms
     * @returns {Function} - opakowana funkcja
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Walidacja danych importowanych z JSON
     * @param {any} data - dane do zwalidowania
     * @returns {boolean} - czy dane są poprawne
     */
    validateImportData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.logs)) return false;
        
        // Sprawdź każdy log
        for (const log of data.logs) {
            if (!log.id || !log.date || !Array.isArray(log.exercises)) {
                return false;
            }
            // Sprawdź każde ćwiczenie
            for (const ex of log.exercises) {
                if (!ex.exerciseId || !Array.isArray(ex.sets)) {
                    return false;
                }
                // Sprawdź każdą serię
                for (const set of ex.sets) {
                    if (typeof set.weight !== 'number' || typeof set.reps !== 'number') {
                        return false;
                    }
                }
            }
        }
        return true;
    }
};
