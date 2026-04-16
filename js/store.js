name=js/store.js url=https://github.com/pabloxmoreno/workout-tracker/blob/main/js/store.js

import { DEFAULT_EXERCISES } from './config.js';

const store = {
    exercises: [],
    logs: [],
    settings: { theme: 'light' },

    init() {
        const storedEx = localStorage.getItem('wt_exercises');
        const storedLogs = localStorage.getItem('wt_logs');
        const storedSettings = localStorage.getItem('wt_settings');

        this.exercises = storedEx ? JSON.parse(storedEx) : [...DEFAULT_EXERCISES];
        this.logs = storedLogs ? JSON.parse(storedLogs) : [];
        
        // Upewnij się, że temat jest wczytany
        this.settings = storedSettings ? JSON.parse(storedSettings) : { theme: 'light' };
        
        if (!storedEx) this.save();
        this.applyTheme();
    },

    save() {
        try {
            localStorage.setItem('wt_exercises', JSON.stringify(this.exercises));
            localStorage.setItem('wt_logs', JSON.stringify(this.logs));
            localStorage.setItem('wt_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Błąd zapisu:', e);
        }
    },

    addLog(logEntry) {
        this.logs.push(logEntry);
        this.save();
    },

    updateLog(updatedLog) {
        const index = this.logs.findIndex(l => l.id === updatedLog.id);
        if (index !== -1) {
            this.logs[index] = updatedLog;
            this.save();
            return true;
        }
        return false;
    },

    getLog(id) {
        return this.logs.find(l => l.id === id);
    },

    deleteLog(logId) {
        this.logs = this.logs.filter(l => l.id !== logId);
        this.save();
    },

    addCustomExercise(name, group) {
        const newId = 'c_' + Date.now();
        this.exercises.push({ id: newId, name, muscleGroup: group, isCustom: true });
        this.save();
        return newId;
    },

    // ✅ NOWE FUNKCJE - WALIDACJA DANYCH
    
    /**
     * Waliduje strukturę ćwiczenia
     * @param {Object} ex - Ćwiczenie do walidacji
     * @returns {boolean} - True jeśli poprawne
     */
    validateExercise(ex) {
        if (!ex || typeof ex !== 'object') return false;
        if (!ex.id || typeof ex.id !== 'string') return false;
        if (!ex.name || typeof ex.name !== 'string') return false;
        if (!ex.muscleGroup || typeof ex.muscleGroup !== 'string') return false;
        if (ex.name.length > 200) return false;
        return true;
    },

    /**
     * Waliduje strukturę treningu
     * @param {Object} log - Trening do walidacji
     * @returns {boolean} - True jeśli poprawny
     */
    validateLog(log) {
        if (!log || typeof log !== 'object') return false;
        if (!log.id || typeof log.id !== 'string') return false;
        if (!log.date || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) return false;
        if (!Array.isArray(log.exercises)) return false;
        
        return log.exercises.every(ex => this.validateLogExercise(ex));
    },

    /**
     * Waliduje strukturę ćwiczenia w treningu
     * @param {Object} ex - Ćwiczenie w treningu
     * @returns {boolean} - True jeśli poprawne
     */
    validateLogExercise(ex) {
        if (!ex || typeof ex !== 'object') return false;
        if (!ex.exerciseId || typeof ex.exerciseId !== 'string') return false;
        if (!Array.isArray(ex.sets)) return false;
        
        return ex.sets.every(s => {
            if (!s || typeof s !== 'object') return false;
            const weight = parseFloat(s.weight);
            const reps = parseInt(s.reps, 10);
            if (isNaN(weight) || weight < 0 || weight > 999) return false;
            if (isNaN(reps) || reps < 0 || reps > 999) return false;
            return true;
        });
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    },

    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.save();
    },

    exportData() {
        // ✅ NOWE - Funkcja do escapowania potencjalnych formuł (CSV injection)
        function sanitizeForCSV(value) {
            if (!value) return '';
            const str = String(value);
            // Jeśli zaczyna się od =, +, -, @ → dodaj apostrof
            if (/^[=+@-]/.test(str)) {
                return "'" + str;
            }
            return str;
        }
        
        const sanitized = {
            exercises: this.exercises.map(ex => ({
                ...ex,
                name: sanitizeForCSV(ex.name)
            })),
            logs: this.logs.map(log => ({
                ...log,
                exercises: log.exercises.map(ex => ({
                    ...ex,
                    sets: ex.sets.map(s => ({
                        weight: s.weight,
                        reps: s.reps,
                        notes: sanitizeForCSV(s.notes)
                    }))
                }))
            })),
            settings: this.settings
        };
        
        const dataStr = "text/json;charset=utf-8," + 
            encodeURIComponent(JSON.stringify(sanitized, null, 2));
        
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute(
            "download", 
            "workout_backup_" + new Date().toISOString().slice(0,10) + ".json"
        );
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    importData(jsonString) {
        try {
            // Parse JSON
            const data = JSON.parse(jsonString);
            
            // ✅ Walidacja struktury
            if (!data || typeof data !== 'object') {
                throw new Error('Nieprawidłowy format: nie jest obiektem');
            }
            
            if (!Array.isArray(data.exercises)) {
                throw new Error('Nieprawidłowy format: brak tablicy exercises');
            }
            
            if (!Array.isArray(data.logs)) {
                throw new Error('Nieprawidłowy format: brak tablicy logs');
            }
            
            // ✅ Walidacja każdego ćwiczenia
            data.exercises.forEach((ex, idx) => {
                if (!this.validateExercise(ex)) {
                    throw new Error(`Nieprawidłowe ćwiczenie na indeksie ${idx}`);
                }
            });
            
            // ✅ Walidacja każdego treningu
            data.logs.forEach((log, idx) => {
                if (!this.validateLog(log)) {
                    throw new Error(`Nieprawidłowy trening na indeksie ${idx}`);
                }
            });
            
            // ✅ Jeśli wszystko OK, przyjmij dane
            this.exercises = data.exercises;
            this.logs = data.logs;
            
            if (data.settings && typeof data.settings === 'object') {
                if (data.settings.theme === 'light' || data.settings.theme === 'dark') {
                    this.settings = data.settings;
                }
            }
            
            this.save();
            
            // Pokaż powiadomienie (utils będzie dostępny z app.js)
            if (window.utils && window.utils.showToast) {
                window.utils.showToast('Dane zaimportowane pomyślnie!', 'success');
            }
            
            setTimeout(() => location.reload(), 1000);
            
        } catch (e) {
            console.error('Import error:', e);
            if (window.utils && window.utils.showToast) {
                window.utils.showToast(`Błąd importu: ${e.message}`, 'error');
            } else {
                alert(`Błąd importu: ${e.message}`);
            }
        }
    },
    
    resetData() {
        if(confirm('TO USUNIE WSZYSTKIE DANE. Czy na pewno?')) {
            localStorage.clear();
            location.reload();
        }
    }
};

export default store;
