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
    modalSearchQuery: '',
    
    // Stan dla rutyn
    editingRoutineId: null,
    tempRoutineName: '',
    isEditingRoutine: false,

    init() {
        store.init();
        this.navigate('calendar');
    },

    navigate(view) {
        this.currentView = view;
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        const navBtn = document.getElementById(`nav-${view}`);
        if(navBtn) navBtn.classList.add('active');
        
        const container = document.getElementById('app');
        if(container) container.innerHTML = ''; 

        if (view === 'calendar') ui.renderCalendar(container, this);
        if (view === 'log') ui.renderLogForm(container, this);
        if (view === 'routines') ui.renderRoutinesView(container, this);
        if (view === 'stats') ui.renderStats(container);
        if (view === 'settings') ui.renderSettings(container);
    },

    render() {
        if (this.currentView === 'calendar') ui.renderCalendar(document.getElementById('app'), this);
        if (this.currentView === 'log') ui.renderLogForm(document.getElementById('app'), this);
        if (this.currentView === 'routines') ui.renderRoutinesView(document.getElementById('app'), this);
        if (this.currentView === 'stats') ui.renderStats(document.getElementById('app'));
        if (this.currentView === 'settings') ui.renderSettings(document.getElementById('app'));
    },

    // --- Kalendarz ---
    changeMonth(delta) {
        this.calendarMonth += delta;
        if (this.calendarMonth > 11) { this.calendarMonth = 0; this.calendarYear++; } 
        else if (this.calendarMonth < 0) { this.calendarMonth = 11; this.calendarYear--; }
        ui.renderCalendar(document.getElementById('app'), this);
    },
    selectDate(dateStr) {
        this.selectedDate = dateStr;
        const [y, m] = dateStr.split('-').map(Number);
        if (y !== this.calendarYear || (m-1) !== this.calendarMonth) { this.calendarYear = y; this.calendarMonth = m - 1; }
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
            if (log) this.tempSets = log.exercises.map(ex => ({ exerciseId: ex.exerciseId, isCardio: ex.isCardio, sets: Array.isArray(ex.sets) ? ex.sets.map(s => ({...s})) : [] }));
        } else { this.tempSets = []; }
        this.navigate('log');
    },

    // --- Modal Ćwiczeń ---
    openExerciseModal() {
        this.isModalOpen = true; this.modalSearchQuery = '';
        const modal = document.getElementById('exercise-modal');
        if(modal) {
            modal.classList.remove('hidden');
            const searchInput = document.getElementById('modal-search');
            if(searchInput) { searchInput.value = ''; searchInput.focus(); }
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
        const chips = document.querySelectorAll('#modal-filters .chip');
        chips.forEach(c => c.classList.remove('active'));
        if(event && event.target) event.target.classList.add('active');
        this.filterModalExercises();
    },
    filterModalExercises() {
        const searchInput = document.getElementById('modal-search');
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        let filtered = store.exercises;
        if (this.modalFilter !== 'wszystkie') filtered = filtered.filter(e => e.muscleGroup === this.modalFilter);
        if (query) filtered = filtered.filter(e => e.name.toLowerCase().includes(query));
        ui.renderModalList(filtered);
    },
    selectExerciseFromModal(id) {
        const ex = store.exercises.find(e => e.id === id);
        if (!ex) return;
        this.tempSets.push({ exerciseId: id, isCardio: ex.isCardio || false, sets: [{ weight: '', reps: '', notes: '' }] });
        this.closeExerciseModal();
        this.render();
        setTimeout(() => {
            const scrollArea = document.getElementById('log-scroll-area');
            if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
            const btn = document.getElementById('btn-add-set');
            if(btn) btn.disabled = false;
        }, 100);
    },

    // --- Obsługa Rutyn ---
    openRoutineSelector() {
        const routines = store.getRoutines();
        ui.renderRoutineList(routines);
        const modal = document.getElementById('routine-modal');
        if(modal) modal.classList.remove('hidden');
    },

    closeRoutineSelector() {
        const modal = document.getElementById('routine-modal');
        if(modal) modal.classList.add('hidden');
    },

    loadRoutine(routineId) {
        const routine = store.getRoutine(routineId);
        if (!routine) return;

        routine.exercises.forEach(rEx => {
            this.tempSets.push({
                exerciseId: rEx.exerciseId,
                isCardio: rEx.isCardio || false,
                sets: (rEx.sets && Array.isArray(rEx.sets)) ? rEx.sets.map(s => ({ ...s })) : [{ weight: '', reps: '', notes: '' }]
            });
        });

        this.closeRoutineSelector();
        this.render();
        utils.showToast(`Załadowano rutynę: ${routine.name}`, 'success');
    },

    createNewRoutine() {
        this.editingRoutineId = null;
        this.tempRoutineName = 'Nowa Rutyna';
        this.tempSets = [];
        this.isEditingRoutine = true;
        this.navigate('log');
    },

    saveCurrentAsRoutine() {
        if(this.tempSets.length === 0) {
            utils.showToast('Dodaj ćwiczenia do rutyny!', 'error');
            return;
        }
        
        const routineData = {
            name: this.tempRoutineName,
            exercises: this.tempSets.map(ex => ({
                exerciseId: ex.exerciseId,
                isCardio: ex.isCardio,
                sets: ex.sets.filter(s => s.reps !== '' || s.weight !== '').map(s => ({
                    weight: parseFloat(String(s.weight).replace(',', '.')) || 0,
                    reps: parseInt(s.reps) || 0,
                    notes: s.notes
                }))
            })).filter(ex => ex.sets.length > 0)
        };

        let vol = 0;
        routineData.exercises.forEach(ex => {
             ex.sets.forEach(s => vol += (s.weight * s.reps));
        });
        routineData.totalVolume = vol;

        store.saveRoutine(routineData);
        utils.showToast('Rutyna zapisana!', 'success');
        this.isEditingRoutine = false;
        this.tempSets = [];
        this.navigate('routines');
    },

    editRoutine(routineId) {
        const routine = store.getRoutine(routineId);
        if(!routine) return;
        
        this.editingRoutineId = routineId;
        this.tempRoutineName = routine.name;
        this.tempSets = routine.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            isCardio: ex.isCardio,
            sets: (ex.sets && Array.isArray(ex.sets)) ? ex.sets.map(s => ({...s})) : []
        }));
        
        this.isEditingRoutine = true;
        this.navigate('log');
    },

    confirmDeleteRoutine(routineId) {
        ui.showConfirmModal(
            "Czy na pewno chcesz usunąć tę rutynę?",
            () => {
                store.deleteRoutine(routineId);
                utils.showToast('Rutyna usunięta', 'success');
                this.navigate('routines');
            }
        );
    },

    confirmResetData() {
        ui.showConfirmModal(
            "TO USUNIE WSZYSTKIE DANE (treningi, rutyny, ustawienia). Czy na pewno?",
            () => {
                localStorage.clear();
                location.reload();
            }
        );
    },

    // --- Akcje Formularza ---
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
    updateSet(exIdx, setIdx, field, value) {
        if (field === 'weight') { if (value !== '' && isNaN(parseFloat(value.replace(',', '.')))) return; } 
        else if (field === 'reps') { if (value !== '' && !Number.isInteger(parseInt(value))) return; }
        this.tempSets[exIdx].sets[setIdx][field] = value;
    },

    saveWorkout() {
        if(this.isEditingRoutine) {
            this.saveCurrentAsRoutine();
            return;
        }

        if(this.tempSets.length === 0) { utils.showToast('Dodaj co najmniej jedno ćwiczenie!', 'error'); return; }
        
        // NAPRAWA: Konwersja do String przed replace, aby obsłużyć liczby i teksty
        const cleanExercises = this.tempSets.map(ex => ({
            exerciseId: ex.exerciseId, isCardio: ex.isCardio,
            sets: ex.sets.filter(s => s.reps !== '' || s.weight !== '').map(s => ({
                weight: parseFloat(String(s.weight).replace(',', '.')) || 0, 
                reps: parseInt(s.reps) || 0, 
                notes: s.notes
            }))
        })).filter(ex => ex.sets.length > 0);

        if(cleanExercises.length === 0) { utils.showToast('Wypełnij dane serii!', 'error'); return; }

        if (this.editModeId) {
            const existingLog = store.getLog(this.editModeId);
            if(existingLog) {
                store.updateLog({ ...existingLog, date: this.selectedDate, exercises: cleanExercises, timestamp: new Date().toISOString() });
                utils.showToast('Trening zaktualizowany!', 'success');
            }
        } else {
            store.addLog({ id: 'l_' + Date.now(), date: this.selectedDate, timestamp: new Date().toISOString(), exercises: cleanExercises });
            utils.showToast('Trening zapisany!', 'success');
        }
        this.tempSets = []; this.editModeId = null;
        this.navigate('calendar');
    },

    deleteLog(logId) {
        ui.showConfirmModal(
            "Czy na pewno usunąć ten trening?",
            () => {
                store.deleteLog(logId);
                utils.showToast('Trening usunięty', 'success');
                ui.renderCalendar(document.getElementById('app'), this);
            }
        );
    },

    toggleTheme() { store.toggleTheme(); this.render(); },
    exportData() { store.exportData(); },
    importData(json) { store.importData(json); },
    
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

window.app = app;
app.init();
