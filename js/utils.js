export const utils = {
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        // Sanitization: usuwamy potencjalne tagi HTML z wiadomości
        toast.textContent = message;
        
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
        // Zamiana przecinka na kropkę dla spójności
        const normalized = value.replace(',', '.');
        const num = parseFloat(normalized);
        
        if (isNaN(num)) return '';
        
        if (!allowDecimals && !Number.isInteger(num)) {
            return Math.floor(num).toString();
        }
        return normalized;
    },

    getExerciseName(exercises, id) {
        const ex = exercises.find(e => e.id === id);
        return ex ? ex.name : 'Nieznane';
    },
    
    // Bezpieczne parsowanie JSON z obsługą błędów
    safeJSONParse(str, fallback) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.error('Błąd parsowania JSON:', e);
            return fallback;
        }
    }
};
