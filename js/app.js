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
        // Walidacja
        if (field === 'weight') {
            // Dozwolone liczby i kropka/przecinek
            if (value !== '' && isNaN(parseFloat(value.replace(',', '.')))) return;
        } else if (field === 'reps') {
            // Tylko liczby całkowite
            if (value !== '' && !Number.isInteger(parseInt(value))) return;
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
                weight: parseFloat(s.weight.replace(',', '.')) || 0,
                reps: parseInt(s.reps) || 0,
                notes: s.notes
            }))
        })).filter(ex => ex.sets.length > 0);

        if(cleanExercises.length === 0) {
            utils.showToast('Wypełnij dane serii!', 'error');
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
