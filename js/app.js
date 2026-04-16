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
    tempSelectedExercise: '', // Pomocnicze do utrzymania wyboru w dropdownie

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
        this.tempSelectedExercise = '';
        
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
            // KLUCZOWA POPRAWKA: Zawsze czyścimy tempSets przy nowym treningu
            this.tempSets = [];
        }
        
        this.navigate('log');
    },

    setMuscleFilter(group) {
        this.activeMuscleFilter = group;
        // Odświeżamy tylko opcje w select, nie cały formularz (żeby nie stracić fokusa w search)
        // Ale musimy przebudować opcje w select, więc lekko odświeżamy fragment UI
        const select = document.getElementById('exercise-select');
        if(select) {
            const currentVal = select.value;
            // Zachowajmy pierwszą opcję (-- Wybierz --) i nadpisz resztę
            const firstOption = select.options[0];
            select.innerHTML = '';
            select.appendChild(firstOption);
            
            const exercisesList = store.exercises.sort((a,b) => a.name.localeCompare(b.name));
            const filtered = group === 'wszystkie' 
                ? exercisesList 
                : exercisesList.filter(e => e.muscleGroup === group);
            
            filtered.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id;
                opt.text = `${e.name} (${e.muscleGroup})`;
                select.appendChild(opt);
            });
            
            // Przywróć wybór jeśli nadal valid
            if(currentVal && filtered.some(e => e.id === currentVal)) {
                select.value = currentVal;
                this.tempSelectedExercise = currentVal;
            } else {
                select.value = "";
                this.tempSelectedExercise = "";
            }
        }
        // Aktualizuj wizualnie chipy
        document.querySelectorAll('.chip').forEach(c => {
            c.classList.toggle('active', c.textContent.toLowerCase().includes(group));
        });
    },

    filterExercises() {
        const query = document.getElementById('exercise-search').value;
        // UWAGA: Nie wywołujemy render()! To powodowało utratę fokusa.
        // Wywołujemy tylko metodę w UI, która zmienia display: none/options
        ui.updateExerciseDropdownVisibility(query);
    },

    addExerciseFromSelect() {
        const select = document.getElementById('exercise-select');
        const id = select ? select.value : null;
        
        if(!id) {
            utils.showToast('Wybierz ćwiczenie z listy!', 'error');
            return;
        }
        
        const ex = store.exercises.find(e => e.id === id);
        this.tempSets.push({
            exerciseId: id,
            isCardio: ex.isCardio || false,
            sets: [{ weight: '', reps: '', notes: '' }]
        });
        
        this.tempSelectedExercise = '';
        if(select) select.value = ""; // Reset selecta
        
        // Odśwież listę sesji (tylko środkową część)
        const sessionList = document.getElementById('session-list');
        if(sessionList) {
            sessionList.innerHTML = ui.renderSessionRows(this);
            // Scroll do nowo dodanego ćwiczenia
            sessionList.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    },

    removeSessionItem(idx) {
        this.tempSets.splice(idx, 1);
        const sessionList = document.getElementById('session-list');
        if(sessionList) sessionList.innerHTML = ui.renderSessionRows(this);
    },

    addSetToLastExercise() {
        if(this.tempSets.length === 0) {
            utils.showToast('Najpierw dodaj ćwiczenie!', 'error');
            return;
        }
        const lastIdx = this.tempSets.length - 1;
        this.tempSets[lastIdx].sets.push({ weight: '', reps: '', notes: '' });
        
        const sessionList = document.getElementById('session-list');
        if(sessionList) {
            sessionList.innerHTML = ui.renderSessionRows(this);
            // Scroll do nowej serii
            const cards = sessionList.getElementsByClassName('exercise-card');
            const lastCard = cards[cards.length - 1];
            const sets = lastCard.getElementsByClassName('set-row');
            if(sets.length > 0) {
                sets[sets.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    },

    addSetToExercise(exIdx) {
        this.tempSets[exIdx].sets.push({ weight: '', reps: '', notes: '' });
        const sessionList = document.getElementById('session-list');
        if(sessionList) sessionList.innerHTML = ui.renderSessionRows(this);
    },

    removeSet(exIdx, setIdx) {
        this.tempSets[exIdx].sets.splice(setIdx, 1);
        if(this.tempSets[exIdx].sets.length === 0) {
            this.removeSessionItem(exIdx);
        } else {
            const sessionList = document.getElementById('session-list');
            if(sessionList) sessionList.innerHTML = ui.renderSessionRows(this);
        }
    },

    updateSet(exIdx, setIdx, field, value) {
        if (field === 'weight') {
            value = utils.validateNumber(value, true);
        } else if (field === 'reps') {
            value = utils.validateNumber(value, false);
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

window.app = app;
app.init();
