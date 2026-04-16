const Utils = {
    /**
     * Bezpieczne generowanie unikalnego ID
     */
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Ochrona przed XSS - escape specjalnych znaków HTML
     * @param {string} text - Tekst do zabezpieczenia
     * @returns {string} - Bezpieczny tekst
     */
    escapeHTML: (text) => {
        if (typeof text !== 'string') return text;
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    /**
     * Walidacja danych wejściowych
     */
    validateExercise: (data) => {
        const errors = [];
        
        if (!data.name || typeof data.name !== 'string') {
            errors.push('Nazwa jest wymagana.');
        } else if (data.name.trim().length < 3) {
            errors.push('Nazwa musi mieć co najmniej 3 znaki.');
        } else if (data.name.trim().length > 50) {
            errors.push('Nazwa jest zbyt długa (max 50 znaków).');
        }

        if (!data.sets || data.sets < 1 || data.sets > 100) {
            errors.push('Liczba serii musi być między 1 a 100.');
        }

        if (!data.reps || data.reps < 1 || data.reps > 500) {
            errors.push('Liczba powtórzeń musi być między 1 a 500.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Bezpieczne zapisywanie do localStorage
     */
    saveToStorage: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Błąd zapisu do localStorage:', e);
            return false;
        }
    },

    /**
     * Bezpieczne odczytywanie z localStorage
     */
    loadFromStorage: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Błąd odczytu z localStorage:', e);
            return null;
        }
    }
};

window.Utils = Utils;
