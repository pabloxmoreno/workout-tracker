import store from './store.js';
import { ui } from './ui.js';
import { utils } from './utils.js';
import { MUSCLE_GROUPS } from './config.js';

const app = {
    currentView: 'calendar',
    selectedDate: new Date().toISOString().split('T')[0],
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(), 
    activeMuscleFilter: 'wszystkie',
    tempSets: [], 
    editModeId: null,
    searchQuery: '', // Przechowuje stan wyszukiwarki

    init() {
        store.init();
        this.navigate('calendar');
    },

    navigate(view) {
        this.currentView = view;
        
        // KLUCZOWA POPRAWKA: Czyszczenie stanu przy wejściu w nowy widok
        if (view === 'log' && this.editModeId === null) {
            // Jeśli wchodzimy w tryb "Dodaj" (nie edycja), wyczyść stare dane
            this.tempSets = [];
            this.searchQuery = '';
        }

        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        document.getElementById(`nav-${view}`).classList.add('active');
        
        const container = document.getElementById('app');
        container.innerHTML = ''; 

        if (view === 'calendar') ui.renderCalendar(container, this);
        if (view === 'log') ui.renderLogForm(container, this);
        if (view === 'stats') ui.renderStats(container);
        if (view === 'settings') ui.renderSettings(container);
    },

    render() {
        // Odświeża obecny widok bez utraty stanu (np. wpisanego tekstu w wyszukiwarce)
        const container = document.getElementById('app');
        if (this.currentView === 'calendar') ui.renderCalendar(container, this);
        if (this.currentView === 'log') ui.renderLogForm(container, this);
        if (this.currentView === 'stats') ui.renderStats(container);
        if (this.currentView === 'settings') ui.renderSettings(container);
    },

    changeMonth(delta) {
        this.calendarMonth += delta;
        if (this.calendarMonth > 11) {
            this.calendarMonth = 0;
            this.calendarYear++;
        } else if (this.calendarMonth < 0) {
            this.calendarMonth = 11;
            this.calendarYear--;
        }
        ui.renderCalendar(document.getElementById('app'), this);
    },

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        const [y, m] = dateStr.split('-').map(Number);
        if (y !== this.calendarYear || (m-1) !== this.calendarMonth) {
            this.calendarYear = y;
            this.calendarMonth = m - 1;
        }
        ui.renderCalendar(document.getElementById('app'), this);
    },

    toggleDetails(logId) {
        const el = document.getElementById(`details-${logId}`);
        if(el) el.classList.toggle('hidden');
    },

    prepLogForDate(dateStr, editId) {
        this.selectedDate = dateStr;
        this.editModeId = editId;
        
        if (editId) {
            // Tryb edycji: ładujemy dane
            const log = store.getLog(editId);
            if (log) {
                this.tempSets = log.exercises.map(ex => ({
                    exerciseId: ex.exerciseId,
                    isCardio: ex.isCardio,
                    sets: ex.sets.map(s => ({...s})) // Głęboka kopia
                }));
            }
        } else {
            // Tryb dodawania: CZYŚCIMY dane
            this.tempSets = [];
            this.searchQuery = '';
        }
        
        this.navigate('log');
    },

    // Nowa funkcja obsługująca wyszukiwanie
    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.render(); // Przerysuj listę ćwiczeń na podstawie query
    },

    addExerciseToSession() {
        const select = document.getElementById('exercise-select');
        const id = select.value;
        
        if(!id) {
            utils.showToast('Wybierz ćwiczenie z listy!', 'error');
            return;
        }
        
        const ex = store.exercises.find(e => e.id === id);
        this.tempSets.push({
            exerciseId: id,
            isCardio: ex.isCardio || false,
            sets: [{ weight: '', reps: '', notes: '' }] // Domyślnie pusta seria
        });
        
        // Opcjonalnie: wyczyść selection po dodaniu
        select.value = "";
        this.searchQuery = ""; 
        const searchInput = document.getElementById('exercise-search');
        if(searchInput) searchInput.value = "";
        
        this.render();
    },

    removeSessionItem(idx) {
        this.tempSets.splice(idx, 1);
        this.render();
    },

    addSetToExercise(exIdx) {
        this.tempSets[exIdx].sets.push({ weight: '', reps: '', notes: '' });
        this.render();
    },

    removeSet(exIdx, setIdx) {
        this.tempSets[exIdx].sets.splice(setIdx, 1);
        if(this.tempSets[exIdx].sets.length === 0) {
            this.removeSessionItem(exIdx);
        } else {
            this.render();
        }
    },

    updateSet(exIdx, setIdx, field, value) {
        // Walidacja danych w czasie rzeczywistym
        if (field === 'weight') {
            value = utils.validateNumber(value, true); // Pozwól na przecinki/kropki
        } else if (field === 'reps') {
            value = utils.validateNumber(value, false); // Tylko całkowite
        }
        
        this.tempSets[exIdx].sets[setIdx][field] = value;
    },

    saveWorkout() {
        if(this.tempSets.length === 0) {
            utils.showToast('Dodaj co najmniej jedno ćwiczenie!', 'error');
            return;
        }

        const cleanExercises = this.tempSets.map(ex => ({
            exerciseId: ex.exerciseId,
            isCardio: ex.isCardio,
            sets: ex.sets.filter(s => s.reps !== '' || s.weight !== '').map(s => ({
                weight: parseFloat(s.weight) || 0,
                reps: parseInt(s.reps) || 0,
                notes: s.notes
            }))
        })).filter(ex => ex.sets.length > 0);

        if(cleanExercises.length === 0) {
            utils.showToast('Wypełnij dane przynajmniej jednej serii!', 'error');
            return;
        }

        if (this.editModeId) {
            const existingLog = store.getLog(this.editModeId);
            if(existingLog) {
                const updatedLog = {
                    ...existingLog,
                    date: this.selectedDate,
                    exercises: cleanExercises,
                    timestamp: new Date().toISOString()
                };
                store.updateLog(updatedLog);
                utils.showToast('Trening zaktualizowany!', 'success');
            }
        } else {
            const newLog = {
                id: 'l_' + Date.now(),
                date: this.selectedDate,
                timestamp: new Date().toISOString(),
                exercises: cleanExercises
            };
            store.addLog(newLog);
            utils.showToast('Trening zapisany pomyślnie!', 'success');
        }

        // Reset po zapisie
        this.tempSets = [];
        this.editModeId = null;
        this.searchQuery = '';
        this.navigate('calendar');
    },

    deleteLog(logId) {
        if(confirm('Czy na pewno usunąć ten trening?')) {
            store.deleteLog(logId);
            utils.showToast('Trening usunięty', 'success');
            ui.renderCalendar(document.getElementById('app'), this);
        }
    },

    toggleTheme() {
        store.toggleTheme();
        this.render();
    },

    exportData() { store.exportData(); },
    importData(json) { store.importData(json); },
    resetData() { store.resetData(); },

    handleAddCustomExercise() {
        const name = document.getElementById('new-ex-name').value;
        const group = document.getElementById('new-ex-group').value;
        if(name) {
            store.addCustomExercise(name, group);
            utils.showToast('Dodano ćwiczenie!', 'success');
            document.getElementById('new-ex-name').value = '';
            // Odśwież listę ćwiczeń jeśli jesteśmy w logowaniu
            if(this.currentView === 'log') this.render();
        } else {
            utils.showToast('Podaj nazwę ćwiczenia', 'error');
        }
    }
};

// Udostępnienie obiektu app globalnie dla handlerów HTML (onclick)
window.app = app;
app.init();
