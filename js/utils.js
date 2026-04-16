export const utils = {
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return; // Zabezpieczenie
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
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
    }
};
