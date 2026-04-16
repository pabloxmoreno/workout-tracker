import { formatDate, escapeHtml } from './utils.js';
import store from './store.js';
import { EXERCISES } from './config.js';

class UI {
    constructor() {
        this.mainContent = document.getElementById('main-content');
        this.pageTitle = document.getElementById('page-title');
        this.modal = document.getElementById('exercise-modal');
        this.modalList = document.getElementById('modal-exercise-list');
        this.searchInput = document.getElementById('exercise-search');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Zamknij modal
        document.getElementById('close-modal').addEventListener('click', () => this.hideModal());
        
        // Szukanie z debounce
        let debounceTimer;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.filterExercises(e.target.value);
            }, 300);
        });

        // Kliknięcie poza modalem
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });
    }

    renderCalendar(appInstance) {
        this.pageTitle.textContent = 'Kalendarz';
        const logs = store.getAllLogs();
        
        // Grupa logów po miesiącach
        const months = {};
        logs.forEach(log => {
            const date = new Date(log.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (!months[key]) months[key] = [];
            months[key].push(log);
        });

        this.mainContent.innerHTML = '';

        if (logs.length === 0) {
            this.mainContent.innerHTML = '<p class="empty-state">Brak zapisanych treningów. Dodaj pierwszy!</p>';
            return;
        }

        Object.keys(months).sort().reverse().forEach(key => {
            const [year, month] = key.split('-');
            const monthLogs = months[key];
            
            const monthEl = document.createElement('div');
            monthEl.className = 'month-section';
            
            const monthTitle = document.createElement('h3');
            monthTitle.textContent = new Date(year, month).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
            monthEl.appendChild(monthTitle);

            const grid = document.createElement('div');
            grid.className = 'calendar-grid';

            // Days of week header
            const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
            dayNames.forEach(name => {
                const dayNameEl = document.createElement('div');
                dayNameEl.className = 'cal-day-name';
                dayNameEl.textContent = name;
                grid.appendChild(dayNameEl);
            });

            // Calculate starting day of month (adjust for Monday start)
            const firstDay = new Date(year, month, 1);
            let startingDay = firstDay.getDay() - 1;
            if (startingDay === -1) startingDay = 6; // Sunday becomes 6
            
            // Empty cells for days before the 1st
            for (let i = 0; i < startingDay; i++) {
                const emptyEl = document.createElement('div');
                grid.appendChild(emptyEl);
            }

            // Days of month
            const daysInMonth = new Date(year, parseInt(month) + 1, 0).getDate();
            const today = new Date();
            for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = `${year}-${String(parseInt(month)+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const dayLogs = monthLogs.filter(l => l.date === dateStr);
                
                const dayEl = document.createElement('div');
                dayEl.className = 'cal-day';
                dayEl.textContent = i;
                
                // Check if today
                if (i === today.getDate() && month == today.getMonth() && year == today.getFullYear()) {
                    dayEl.classList.add('today');
                }
                
                if (dayLogs.length > 0) {
                    dayEl.classList.add('has-workout');
                    dayEl.addEventListener('click', () => appInstance.toggleDetails(dayLogs[0].id));
                    dayEl.title = `${dayLogs.length} trening(ów)`;
                }
                
                grid.appendChild(dayEl);
            }

            monthEl.appendChild(grid);
            this.mainContent.appendChild(monthEl);
        });
    }

    renderLogForm(appInstance) {
        this.pageTitle.textContent = 'Nowy Trening';
        this.mainContent.innerHTML = '';

        const form = document.createElement('form');
        form.className = 'workout-form';
        form.id = 'new-workout-form';

        // Data
        const dateGroup = document.createElement('div');
        dateGroup.className = 'form-group';
        const dateLabel = document.createElement('label');
        dateLabel.textContent = 'Data';
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = new Date().toISOString().split('T')[0];
        dateInput.name = 'date';
        dateGroup.appendChild(dateLabel);
        dateGroup.appendChild(dateInput);
        form.appendChild(dateGroup);

        // Lista ćwiczeń kontener
        const exercisesContainer = document.createElement('div');
        exercisesContainer.id = 'form-exercises';
        form.appendChild(exercisesContainer);

        // Przycisk dodaj ćwiczenie
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn btn-secondary';
        addBtn.textContent = '+ Dodaj ćwiczenie';
        addBtn.addEventListener('click', () => appInstance.openExerciseModal());
        form.appendChild(addBtn);

        // Przycisk zapisz
        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = 'Zapisz Trening';
        saveBtn.style.marginTop = '20px';
        saveBtn.style.width = '100%';
        form.appendChild(saveBtn);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            appInstance.saveWorkout();
        });

        this.mainContent.appendChild(form);
    }

    addExerciseToForm(exercise) {
        const container = document.getElementById('form-exercises');
        if (!container) return;

        const exId = `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const exCard = document.createElement('div');
        exCard.className = 'exercise-card';
        exCard.dataset.exerciseId = exId;
        exCard.dataset.id = exercise.id;

        const header = document.createElement('div');
        header.className = 'exercise-header';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'exercise-name';
        nameSpan.textContent = exercise.name; // Bezpieczne
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.ariaLabel = 'Usuń ćwiczenie';
        removeBtn.addEventListener('click', () => exCard.remove());
        
        header.appendChild(nameSpan);
        header.appendChild(removeBtn);
        exCard.appendChild(header);

        const setsContainer = document.createElement('div');
        setsContainer.className = 'sets-container';
        setsContainer.id = `sets-${exId}`;
        
        // Dodaj domyślny set
        this.addSetRow(setsContainer, exId);
        
        exCard.appendChild(setsContainer);

        const addSetBtn = document.createElement('button');
        addSetBtn.type = 'button';
        addSetBtn.className = 'btn btn-sm btn-outline';
        addSetBtn.textContent = '+ Seria';
        addSetBtn.style.marginTop = '10px';
        addSetBtn.addEventListener('click', () => this.addSetRow(setsContainer, exId));
        exCard.appendChild(addSetBtn);

        container.appendChild(exCard);
    }

    addSetRow(container, exId) {
        const row = document.createElement('div');
        row.className = 'set-row';
        
        const inputs = [
            { type: 'number', placeholder: 'kg', name: 'weight' },
            { type: 'number', placeholder: 'powt.', name: 'reps' },
            { type: 'text', placeholder: 'RPE', name: 'rpe', style: 'width: 60px' }
        ];

        inputs.forEach(conf => {
            const input = document.createElement('input');
            input.type = conf.type;
            input.placeholder = conf.placeholder;
            input.name = conf.name;
            if (conf.style) input.style = conf.style;
            row.appendChild(input);
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-icon';
        delBtn.textContent = '🗑️';
        delBtn.addEventListener('click', () => {
            if (container.children.length > 1) row.remove();
        });
        row.appendChild(delBtn);

        container.appendChild(row);
    }

    renderStats() {
        this.pageTitle.textContent = 'Statystyki';
        this.mainContent.innerHTML = '';

        const logs = store.getAllLogs();
        if (logs.length === 0) {
            this.mainContent.innerHTML = '<p class="empty-state">Brak danych do statystyk.</p>';
            return;
        }

        const totalWorkouts = logs.length;
        const totalSets = logs.reduce((acc, log) => {
            return acc + log.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
        }, 0);

        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';

        const createStatCard = (title, value) => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            const h3 = document.createElement('h3');
            h3.textContent = title;
            const p = document.createElement('p');
            p.className = 'stat-value';
            p.textContent = value;
            card.appendChild(h3);
            card.appendChild(p);
            return card;
        };

        statsGrid.appendChild(createStatCard('Treningi', totalWorkouts));
        statsGrid.appendChild(createStatCard('Serie', totalSets));
        
        this.mainContent.appendChild(statsGrid);
    }

    renderSettings() {
        this.pageTitle.textContent = 'Ustawienia';
        this.mainContent.innerHTML = '';

        const settingsDiv = document.createElement('div');
        settingsDiv.className = 'settings-container';

        const createRow = (labelText, actionElement) => {
            const row = document.createElement('div');
            row.className = 'setting-row';
            const label = document.createElement('span');
            label.textContent = labelText;
            row.appendChild(label);
            row.appendChild(actionElement);
            return row;
        };

        // Dark Mode Toggle
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = store.settings.darkMode;
        toggle.addEventListener('change', () => {
            store.toggleDarkMode();
            document.body.classList.toggle('dark-mode');
        });
        settingsDiv.appendChild(createRow('Tryb ciemny', toggle));

        // Export
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-secondary';
        exportBtn.textContent = 'Eksportuj dane';
        exportBtn.addEventListener('click', () => {
            const data = store.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workout-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
        settingsDiv.appendChild(createRow('Kopia zapasowa', exportBtn));

        // Import
        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.accept = '.json';
        importInput.style.display = 'none';
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    if (store.importData(evt.target.result)) {
                        alert('Dane zaimportowane pomyślnie!');
                        window.location.reload();
                    }
                } catch (err) {
                    alert('Błąd importu: ' + err.message);
                }
            };
            reader.readAsText(file);
        });

        const importBtn = document.createElement('button');
        importBtn.className = 'btn btn-secondary';
        importBtn.textContent = 'Importuj dane';
        importBtn.addEventListener('click', () => importInput.click());
        settingsDiv.appendChild(createRow('Przywróć dane', importBtn));
        settingsDiv.appendChild(importInput);

        // Reset
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-danger';
        resetBtn.textContent = 'Resetuj wszystko';
        resetBtn.addEventListener('click', () => {
            if (confirm('Czy na pewno chcesz usunąć wszystkie dane?')) {
                store.resetData();
                window.location.reload();
            }
        });
        settingsDiv.appendChild(createRow('Strefa niebezpieczna', resetBtn));

        this.mainContent.appendChild(settingsDiv);
    }

    showModal(exercises, onSelect) {
        this.modalList.innerHTML = '';
        this.searchInput.value = '';
        this.currentOnSelect = onSelect;
        
        this.renderExerciseList(exercises);
        this.modal.classList.remove('hidden');
        this.searchInput.focus();
    }

    hideModal() {
        this.modal.classList.add('hidden');
        this.currentOnSelect = null;
    }

    renderExerciseList(exercises) {
        this.modalList.innerHTML = '';
        exercises.forEach(ex => {
            const item = document.createElement('div');
            item.className = 'exercise-item';
            
            const name = document.createElement('span');
            name.textContent = ex.name; // Bezpieczne
            
            const group = document.createElement('small');
            group.textContent = ex.muscleGroup;
            group.style.color = 'var(--text-muted)';
            
            item.appendChild(name);
            item.appendChild(group);
            
            item.addEventListener('click', () => {
                if (this.currentOnSelect) this.currentOnSelect(ex);
                this.hideModal();
            });
            
            this.modalList.appendChild(item);
        });
    }

    filterExercises(query) {
        const filtered = EXERCISES.filter(ex => 
            ex.name.toLowerCase().includes(query.toLowerCase()) ||
            ex.muscleGroup.toLowerCase().includes(query.toLowerCase())
        );
        this.renderExerciseList(filtered);
    }
}

export default new UI();
