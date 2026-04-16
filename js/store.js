import { generateId, validateImportData, escapeHtml } from './utils.js';

class Store {
    constructor() {
        this.logs = [];
        this.settings = {
            darkMode: false,
            unit: 'kg'
        };
        this.load();
    }

    load() {
        try {
            const logs = localStorage.getItem('workout_logs');
            const settings = localStorage.getItem('workout_settings');
            
            if (logs) this.logs = JSON.parse(logs);
            if (settings) this.settings = JSON.parse(settings);
        } catch (e) {
            console.error('Błąd ładowania danych:', e);
            this.logs = [];
        }
    }

    save() {
        localStorage.setItem('workout_logs', JSON.stringify(this.logs));
        localStorage.setItem('workout_settings', JSON.stringify(this.settings));
    }

    addLog(logEntry) {
        // Sanitizacja danych przed zapisem (dodatkowa warstwa ochrony)
        const safeEntry = {
            ...logEntry,
            id: logEntry.id || generateId(),
            exercises: logEntry.exercises.map(ex => ({
                ...ex,
                name: escapeHtml(ex.name),
                notes: ex.notes ? escapeHtml(ex.notes) : ''
            }))
        };
        
        this.logs.push(safeEntry);
        this.save();
        return safeEntry;
    }

    updateLog(id, updates) {
        const index = this.logs.findIndex(l => l.id === id);
        if (index !== -1) {
            // Sanitizacja aktualizowanych danych
            const safeUpdates = { ...updates };
            if (safeUpdates.notes) safeUpdates.notes = escapeHtml(safeUpdates.notes);
            
            this.logs[index] = { ...this.logs[index], ...safeUpdates };
            this.save();
        }
    }

    deleteLog(id) {
        this.logs = this.logs.filter(l => l.id !== id);
        this.save();
    }

    getLogsByDate(date) {
        return this.logs.filter(l => l.date === date);
    }

    getAllLogs() {
        return this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    exportData() {
        return JSON.stringify({
            version: '1.0',
            exportDate: new Date().toISOString(),
            logs: this.logs,
            settings: this.settings
        }, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (!validateImportData(data)) {
                throw new Error('Nieprawidłowy format danych');
            }

            // Sanitizacja wszystkich importowanych danych
            const safeLogs = data.logs.map(log => ({
                ...log,
                id: escapeHtml(String(log.id)),
                date: String(log.date), // Prosta walidacja daty
                exercises: log.exercises.map(ex => ({
                    id: escapeHtml(String(ex.id)),
                    name: escapeHtml(String(ex.name)),
                    muscleGroup: ex.muscleGroup ? escapeHtml(String(ex.muscleGroup)) : '',
                    sets: Array.isArray(ex.sets) ? ex.sets : [],
                    notes: ex.notes ? escapeHtml(String(ex.notes)) : ''
                })),
                notes: log.notes ? escapeHtml(String(log.notes)) : ''
            }));

            this.logs = [...this.logs, ...safeLogs];
            this.save();
            return true;
        } catch (e) {
            console.error('Błąd importu:', e);
            throw e;
        }
    }

    resetData() {
        this.logs = [];
        this.save();
    }

    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        this.save();
        return this.settings.darkMode;
    }
}

export default new Store();
