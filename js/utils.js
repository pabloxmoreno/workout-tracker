name=js/utils.js url=https://github.com/pabloxmoreno/workout-tracker/blob/main/js/utils.js

export const utils = {
    // ✅ NOWA FUNKCJA - Bezpieczna walidacja wagi
    validateWeight(value) {
        if (value === '' || value === null) return 0;
        const num = parseFloat(String(value).replace(',', '.'));
        if (isNaN(num) || !isFinite(num)) return 0;
        if (num < 0 || num > 999) return 0;
        return Math.round(num * 2) / 2; // 0.5kg increments
    },

    // ✅ NOWA FUNKCJA - Bezpieczna walidacja powtórzeń
    validateReps(value) {
        if (value === '' || value === null) return 0;
        const num = parseInt(String(value), 10);
        if (isNaN(num) || !isFinite(num)) return 0;
        if (num < 0 || num > 999) return 0;
        return num;
    },

    // ✅ NOWA FUNKCJA - Bezpieczna walidacja notatek
    validateNotes(value) {
        if (!value) return '';
        const str = String(value).substring(0, 500);
        return str;
    },

    // ✅ Escape do CSV (ochrona przed CSV injection)
    sanitizeForCSV(value) {
        if (!value) return '';
        const str = String(value);
        // Jeśli zaczyna się od =, +, -, @ → dodaj cudzysłów
        if (/^[=+@-]/.test(str)) {
            return "'" + str;
        }
        return str;
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message; // ✅ textContent = bezpieczne
        
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
        if (!exercises || !Array.isArray(exercises)) return 'Nieznane';
        const ex = exercises.find(e => e && e.id === id);
        return ex ? String(ex.name).substring(0, 100) : 'Nieznane';
    }
};
