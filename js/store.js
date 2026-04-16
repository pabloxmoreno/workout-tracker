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

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    },

    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.save();
    },

    exportData() {
        const dataStr = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
            exercises: this.exercises,
            logs: this.logs,
            settings: this.settings
        }));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "workout_backup_" + new Date().toISOString().slice(0,10) + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if(data.exercises && data.logs) {
                this.exercises = data.exercises;
                this.logs = data.logs;
                if(data.settings) this.settings = data.settings;
                this.save();
                location.reload();
            } else {
                throw new Error('Invalid format');
            }
        } catch (e) {
            alert('Błąd importu: Nieprawidłowy plik.');
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
