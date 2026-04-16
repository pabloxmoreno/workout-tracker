name=js/app.js url=https://github.com/pabloxmoreno/workout-tracker/blob/main/js/app.js

import store from './store.js';
import { ui } from './ui.js';
import { utils } from './utils.js';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from './config.js';

const app = {
    currentView: 'calendar',
    selectedDate: new Date().toISOString().split('T')[0],
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(), 
    activeMuscleFilter: 'wszystkie',
    tempSets: [], 
    editModeId: null,
    
    // Stan modala
    isModalOpen: false,
    modalFilter: 'wszystkie',
    modalSearchQuery: '',

    init() {
        store.init();
        this.navigate('calendar');
    },

    navigate(view) {
        this.currentView = view;
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
        if (this.currentView === 'calendar') ui.renderCalendar(document.getElementById('app'), this);
        if (this.currentView === 'log') ui.renderLogForm(document.getElementById('app'), this);
        if (this.currentView === 'stats') ui.renderStats(document.getElementById('app'));
        if (this.currentView === 'settings') ui.renderSettings(document.getElementById('app'));
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
            const log = store.getLog(editId);
            if (log) {
                this.tempSets = log.exercises.map(ex => ({
                    exerciseId: ex.exerciseId,
                    isCardio: ex.isCardio,
                    sets: ex.sets.map(s => ({...s}))
                }));
            }
        } else {
            this.tempSets = []; // CZYSZCZENIE DANYCH PRZY NOWYM TRENINGU
        }
        
        this.navigate('log');
    },

    // --- LOGIKA MODALA ---

    openExerciseModal() {
        this.isModalOpen = true;
        this.modalSearchQuery = '';
        const modal = document.getElementById('exercise-modal');
        if(modal) {
            modal.classList.remove('hidden');
            const searchInput = document.getElementById('modal-search');
            if(searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            this.filterModalExercises();
        }
    },

    closeExerciseModal() {
        this.isModalOpen = false;
        const modal = document.getElementById('exercise-modal');
        if(modal) modal.classList.add('hidden');
    },

    setModalFilter(group) {
        this.modalFilter = group;
        // Aktualizacja UI chipów
        const chips = document.querySelectorAll('#modal-filters .chip');
        chips.forEach(c => c.classList.remove('active'));
        // Zakładamy, że event.target jest dostępny przez wywołanie z onclick
        if(event && event.target) {
            event.target.classList.add('active');
        }
        this.filterModalExercises();
    },

    filterModalExercises() {
        const searchInput = document.getElementById('modal-search');
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        this.modalSearchQuery = query;

        // Pobieramy ćwiczenia ze store (zawiera domyślne + customowe)
        let filtered = store.exercises;

        // Filtr grupy
        if (this.modalFilter !== 'wszystkie') {
            filtered = filtered.filter(e => e.muscleGroup === this.modalFilter);
        }

        // Filtr tekstu
        if (query) {
            filtered = filtered.filter(e => e.name.toLowerCase().includes(query));
        }

        ui.renderModalList(filtered, this);
    },

    selectExerciseFromModal(id) {
        const ex = store.exercises.find(e => e.id === id);
        if (!ex) return;

        this.tempSets.push({
            exerciseId: id,
            isCardio: ex.isCardio || false,
            sets: [{ weight: '', reps: '', notes: '' }]
        });

        this.closeExerciseModal();
        this.render(); // Przeładuj formularz, aby pokazać nowe ćwiczenie
        
        // Przewiń na dół do nowego ćwiczenia
        setTimeout(() => {
            const scrollArea = document.getElementById('log-scroll-area');
            if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
            
            // Odblokuj przycisk dodawania serii
            const btn = document.getElementById('btn-add-set');
            if(btn) btn.disabled = false;
        }, 100);
    },

    // --- AKCJE FORMULARZA ---

    addSetToLastExercise() {
        if (this.tempSets.length === 0) return;
        const lastIdx = this.tempSets.length - 1;
        this.tempSets[lastIdx].sets.push({ weight: '', reps: '', notes: '' });
        this.render();
        
        // Przewiń na sam dół
        setTimeout(() => {
            const scrollArea = document.getElementById('log-scroll-area');
            if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        }, 50);
    },

    removeSessionItem(idx) {
        this.tempSets.splice(idx, 1);
        if (this.tempSets.length === 0) {
            const btn = document.getElementById('btn-add-set');
            if(btn) btn.disabled = true;
        }
        this.render();
    },

    updateSet(exIdx, setIdx, field, value) {
        // ✅ Walidacja dla weight
        if (field === 'weight') {
            if (value === '') {
                this.tempSets[exIdx].sets[setIdx][field] = '';
                return;
            }
            
            const num = parseFloat(value.replace(',', '.'));
            
            // Sprawdzenia
            if (isNaN(num)) return; // Nie liczba
            if (num < 0) return;    // Liczba ujemna
            if (num > 999) return;  // Za duża
            if (!isFinite(num)) return; // Infinity, NaN
            
            // Limit na 1 miejsce po przecinku (0.5kg step)
            this.tempSets[exIdx].sets[setIdx][field] = Math.round(num * 2) / 2;
            
        } 
        // ✅ Walidacja dla reps
        else if (field === 'reps') {
            if (value === '') {
                this.tempSets[exIdx].sets[setIdx][field] = '';
                return;
            }
            
            const num = parseInt(value, 10);
            
            // Sprawdzenia
            if (isNaN(num)) return;      // Nie liczba
            if (num < 1) return;         // Mniejsza niż 1
            if (num > 999) return;       // Za dużo powtórzeń
            if (!Number.isInteger(num)) return; // Nie całkowita
            
            this.tempSets[exIdx].sets[setIdx][field] = num;
            
        } 
        // ✅ Walidacja dla notes
        else if (field === 'notes') {
            // Limit 500 znaków
            if (value.length > 500) return;
            
            // Bezpieczne zapisanie
            this.tempSets[exIdx].sets[setIdx][field] = value;
        }
    },

    saveWorkout() {
        if(this.tempSets.length === 0) {
            utils.showToast('Dodaj co najmniej jedno ćwiczenie!', 'error');
            return;
        }

        // ✅ Walidacja każdego ćwiczenia i serii
        let hasValidSets = false;
        
        const cleanExercises = this.tempSets.map(ex => {
            const validSets = ex.sets.filter(s => {
                const weight = s.weight ? parseFloat(String(s.weight).replace(',', '.')) : 0;
                const reps = s.reps ? parseInt(String(s.reps), 10) : 0;
                
                // ✅ Obie wartości muszą być > 0
                if (weight > 0 && reps > 0) {
                    hasValidSets = true;
                    return true;
                }
                return false;
            }).map(s => {
                const weight = parseFloat(String(s.weight).replace(',', '.')) || 0;
                const reps = parseInt(String(s.reps), 10) || 0;
                
                // ✅ Dodatkowa walidacja
                if (weight < 0 || weight > 999) return null;
                if (reps < 1 || reps > 999) return null;
                
                return {
                    weight: Math.round(weight * 2) / 2,
                    reps: reps,
                    notes: (s.notes || '').substring(0, 500) // Max 500 znaków
                };
            }).filter(s => s !== null);
            
            return {
                exerciseId: ex.exerciseId,
                isCardio: ex.isCardio || false,
                sets: validSets
            };
        }).filter(ex => ex.sets.length > 0);

        if (!hasValidSets || cleanExercises.length === 0) {
            utils.showToast('Wypełnij przynajmniej jedno ćwiczenie z danymi!', 'error');
            return;
        }

        // ✅ Reszta bez zmian
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
            utils.showToast('Trening zapisany!', 'success');
        }

        this.tempSets = [];
        this.editModeId = null;
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
        }
    }
};

// ==========================================
// REJESTRACJA SERVICE WORKERA (PWA OFFLINE)
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../sw.js')
      .then(reg => console.log('Service Worker zarejestrowany:', reg.scope))
      .catch(err => console.log('Błąd rejestracji Service Workera:', err));
  });
}

// Udostępnienie obiektu app globalnie dla handlerów HTML (onclick)
window.app = app;
app.init();
