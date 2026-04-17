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
    
    isModalOpen: false,
    modalFilter: 'wszystkie',

    init() {
        store.init();
        this.setupEventListeners();
        this.navigate('calendar');
    },

    // NOWA FUNKCJA: Obsługa wszystkich zdarzeń bez onclick w HTML
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, .cal-day, .workout-summary-item, .exercise-list-item, .chip');
            if (!target) return;

            // Nawigacja dolna
            if (target.matches('[data-view]')) {
                const view = target.getAttribute('data-view');
                this.navigate(view);
                return;
            }

            // Kalendarz
            if (target.classList.contains('cal-day')) {
                const date = target.getAttribute('data-date');
                if (date) this.selectDate(date);
                return;
            }
            if (target.classList.contains('workout-summary-item')) {
                const logId = target.getAttribute('data-log-id');
                if (logId) this.toggleDetails(logId);
                return;
            }
            
            // Przyciski akcji w kalendarzu
            if (target.id === 'btn-add-training') {
                this.prepLogForDate(this.selectedDate, false);
                return;
            }
            if (target.classList.contains('btn-edit-log')) {
                const logId = target.getAttribute('data-id');
                const date = target.getAttribute('data-date');
                if(logId && date) this.prepLogForDate(date, logId);
                return;
            }
            if (target.classList.contains('btn-delete-log')) {
                const logId = target.getAttribute('data-id');
                if(logId) this.deleteLog(logId);
                return;
            }
            if (target.id === 'btn-prev-month') { this.changeMonth(-1); return; }
            if (target.id === 'btn-next-month') { this.changeMonth(1); return; }

            // Formularz logowania
            if (target.id === 'btn-open-modal') {
                this.openExerciseModal();
                return;
            }
            if (target.id === 'btn-close-modal') {
                this.closeExerciseModal();
                return;
            }
            if (target.classList.contains('chip') && target.closest('#modal-filters')) {
                const group = target.getAttribute('data-group');
                if(group) this.setModalFilter(group, target);
                return;
            }
            if (target.classList.contains('exercise-list-item')) {
                const id = target.getAttribute('data-id');
                if(id) this.selectExerciseFromModal(id);
                return;
            }
            if (target.id === 'btn-add-set') {
                this.addSetToLastExercise();
                return;
            }
            if (target.id === 'btn-save-workout') {
                this.saveWorkout();
                return;
            }
            if (target.id === 'btn-cancel-edit') {
                this.navigate('calendar');
                return;
            }
            if (target.classList.contains('btn-remove-ex')) {
                const idx = target.getAttribute('data-idx');
                if(idx !== null) this.removeSessionItem(parseInt(idx));
                return;
            }
            if (target.classList.contains('btn-remove-set')) {
                const exIdx = target.getAttribute('data-ex-idx');
                const setIdx = target.getAttribute('data-set-idx');
                if(exIdx !== null && setIdx !== null) this.removeSet(parseInt(exIdx), parseInt(setIdx));
                return;
            }

            // Ustawienia
            if (target.id === 'btn-toggle-theme') { this.toggleTheme(); return; }
            if (target.id === 'btn-export') { this.exportData(); return; }
            if (target.id === 'btn-reset') { this.resetData(); return; }
            if (target.id === 'btn-add-custom') { this.handleAddCustomExercise(); return; }
            
            // Import pliku (obsługa input file)
            if (target.id === 'input-import') {
                const file = target.files[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = (e) => this.importData(e.target.result);
                    reader.readAsText(file);
                }
                return;
            }
        });

        // Obsługa wpisywania tekstu (input)
        document.addEventListener('input', (e) => {
            const target = e.target;
            
            // Wyszukiwarka w modalu
            if (target.id === 'modal-search') {
                this.filterModalExercises();
                return;
            }

            // Pola w formularzu treningowym (Kg, Reps, Notatki)
            if (target.classList.contains('set-input')) {
                const exIdx = target.getAttribute('data-ex-idx');
                const setIdx = target.getAttribute('data-set-idx');
                const field = target.getAttribute('data-field');
                if (exIdx !== null && setIdx !== null && field) {
                    this.updateSet(parseInt(exIdx), parseInt(setIdx), field, target.value);
                }
            }

            // Data treningu
            if (target.id === 'workout-date') {
                this.selectedDate = target.value;
            }
            
            // Dodawanie customowego ćwiczenia
            if (target.id === 'new-ex-name' || target.id === 'new-ex-group') {
                // Tylko przechwytujemy wartość, akcja jest na kliknięciu
            }
        });
        
        // Obsługa zamykania modala po kliknięciu w tło
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exercise-modal') {
                this.closeExerciseModal();
            }
        });
    },

    navigate(view) {
        this.currentView = view;
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`nav button[data-view="${view}"]`);
        if(activeBtn) activeBtn.classList.add('active');
        
        const container = document.getElementById('app');
        if(container) container.innerHTML = ''; 

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
            this.tempSets = [];
        }
        this.navigate('log');
    },

    openExerciseModal() {
        this.isModalOpen = true;
        this.modalFilter = 'wszystkie';
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

    setModalFilter(group, btnElement) {
        this.modalFilter = group;
        const chips = document.querySelectorAll('#modal-filters .chip');
        chips.forEach(c => c.classList.remove('active'));
        if(btnElement) btnElement.classList.add('active');
        this.filterModalExercises();
    },

    filterModalExercises() {
        const searchInput = document.getElementById('modal-search');
        const query = searchInput ? searchInput.value.toLowerCase() : '';

        let filtered = store.exercises;
        if (this.modalFilter !== 'wszystkie') {
            filtered = filtered.filter(e => e.muscleGroup === this.modalFilter);
        }
        if (query) {
            filtered = filtered.filter(e => e.name.toLowerCase().includes(query));
        }
        ui.renderModalList(filtered);
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
        this.render();
        
        setTimeout(() => {
            const scrollArea = document.getElementById('log-scroll-area');
            if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
            const btn = document.getElementById('btn-add-set');
            if(btn) btn.disabled = false;
        }, 100);
    },

    addSetToLastExercise() {
        if (this.tempSets.length === 0) return;
        const lastIdx = this.tempSets.length - 1;
        this.tempSets[lastIdx].sets.push({ weight: '', reps: '', notes: '' });
        this.render();
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

    removeSet(exIdx, setIdx) {
        this.tempSets[exIdx].sets.splice(setIdx, 1);
        if (this.tempSets[exIdx].sets.length === 0) {
            this.removeSessionItem(exIdx);
        } else {
            this.render();
        }
    },

    updateSet(exIdx, setIdx, field, value) {
        if (field === 'weight') {
            if (value !== '' && isNaN(parseFloat(value.replace(',', '.')))) return;
        } else if (field === 'reps') {
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

// Inicjalizacja aplikacji
app.init();
