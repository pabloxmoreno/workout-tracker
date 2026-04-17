import store from './store.js';
import { utils } from './utils.js';
import { MUSCLE_GROUPS } from './config.js';

export const ui = {
    /**
     * Renderuje widok Kalendarza
     */
    renderCalendar(container, appInstance) {
        const year = appInstance.calendarYear;
        const month = appInstance.calendarMonth;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; 

        let html = `
            <div class="card">
                <div class="calendar-header">
                    <button class="btn-outline" onclick="app.changeMonth(-1)">❮</button>
                    <h2>${new Date(year, month).toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}</h2>
                    <button class="btn-outline" onclick="app.changeMonth(1)">❯</button>
                </div>
                <div class="calendar-grid">
                    <div class="cal-day-name">Pn</div><div class="cal-day-name">Wt</div><div class="cal-day-name">Śr</div>
                    <div class="cal-day-name">Cz</div><div class="cal-day-name">Pt</div><div class="cal-day-name">So</div><div class="cal-day-name">Nd</div>
        `;

        for(let i=0; i<startDayIndex; i++) html += `<div></div>`;

        const todayStr = new Date().toISOString().split('T')[0];
        for(let d=1; d<=daysInMonth; d++) {
            const currentStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const hasWorkout = store.logs.some(l => l.date === currentStr);
            const isToday = currentStr === todayStr;
            const isSelected = currentStr === appInstance.selectedDate;
            
            let classes = 'cal-day';
            if(isToday) classes += ' today';
            if(hasWorkout) classes += ' has-workout';
            if(isSelected) classes += ' selected';

            html += `<div class="${classes}" onclick="app.selectDate('${currentStr}')">${d}</div>`;
        }

        html += `</div>`; 

        const dayLogs = store.logs.filter(l => l.date === appInstance.selectedDate);
        html += `<div class="workout-preview">
            <div class="flex flex-between">
                <h3>Trening: ${appInstance.selectedDate}</h3>
                <button class="btn-primary" onclick="app.prepLogForDate('${appInstance.selectedDate}', false)">+ Dodaj trening</button>
            </div>`;
        
        if(dayLogs.length > 0) {
            dayLogs.forEach(log => {
                let vol = 0;
                let exCount = log.exercises.length;
                log.exercises.forEach(e => {
                    if(!e.isCardio) vol += (e.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0));
                });
                
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

                let detailsHtml = `<div class="workout-details-expanded hidden" id="details-${log.id}">`;
                log.exercises.forEach(ex => {
                    const exName = utils.getExerciseName(store.exercises, ex.exerciseId);
                    detailsHtml += `<div class="exercise-block">
                        <div class="exercise-title">${exName}</div>`;
                    ex.sets.forEach((s, idx) => {
                        detailsHtml += `
                            <div class="set-detail">
                                Seria ${idx+1}: <span>${utils.escapeHtml(String(s.weight))}kg</span> x <span>${utils.escapeHtml(String(s.reps))}</span>
                                ${s.notes ? `- ${utils.escapeHtml(String(s.notes))}` : ''}
                            </div>`;
                    });
                    detailsHtml += `</div>`;
                });
                detailsHtml += `
                    <div class="flex" style="margin-top:1rem">
                        <button class="btn-primary btn-sm" onclick="app.prepLogForDate('${log.date}', '${log.id}')">Edytuj</button>
                        <button class="btn-danger btn-sm" onclick="app.deleteLog('${log.id}')">Usuń</button>
                    </div>
                </div>`;

                html += `
                    <div class="workout-summary-item" onclick="app.toggleDetails('${log.id}')">
                        <div class="flex flex-between">
                            <strong>${Math.round(vol)} kg</strong>
                            <small>${timeStr}</small>
                        </div>
                        <div style="font-size:0.85rem; color:var(--text-light);">${exCount} ćwiczeń</div>
                        ${detailsHtml}
                    </div>
                `;
            });
        } else {
            html += `<p style="color:var(--text-light); margin-top:1rem;">Brak treningów tego dnia.</p>`;
        }
        html += `</div></div>`; 

        container.innerHTML = html;
    },

    /**
     * Renderuje formularz logowania treningu lub edycji rutyny
     */
    renderLogForm(container, appInstance) {
        const isEditLog = !!appInstance.editModeId;
        const isEditingRoutine = appInstance.isEditingRoutine;
        
        let title = 'Nowy Trening';
        let saveBtnText = 'Zakończ i Zapisz';
        let cancelAction = "app.navigate('calendar')";

        if (isEditLog) {
            title = 'Edytuj Trening';
            saveBtnText = 'Zapisz Zmiany';
        } else if (isEditingRoutine) {
            title = `Edycja Rutyny: ${utils.escapeHtml(appInstance.tempRoutineName)}`;
            saveBtnText = 'Zapisz Rutynę';
            cancelAction = "app.navigate('routines')";
        }

        let html = `
            <div class="log-form-container">
                <div class="log-header card" style="margin-bottom:0; border-radius:0; box-shadow:none; background:transparent; padding:0;">
                    <h2>${utils.escapeHtml(title)}</h2>
                    <label>Data</label>
                    <input type="date" value="${appInstance.selectedDate}" onchange="app.selectedDate = this.value" style="margin-bottom:0.5rem">
                    
                    <div class="flex" style="gap:0.5rem; margin-bottom:1rem;">
                        <button class="btn-primary btn-block" onclick="app.openExerciseModal()" style="flex:2">+ Ćwiczenie</button>
                        ${!isEditingRoutine ? `<button class="btn-outline btn-block" onclick="app.openRoutineSelector()" style="flex:1">📋 Rutyna</button>` : ''}
                    </div>
                </div>

                <div class="log-scroll-area" id="log-scroll-area">
                    ${this.renderSessionRows(appInstance)}
                </div>

                <div class="log-footer card" style="margin-top:0; border-radius:0; box-shadow:none; background:transparent; padding:0;">
                    <button class="btn-outline btn-block" onclick="app.addSetToLastExercise()" id="btn-add-set" disabled>
                        + Dodaj serię do ostatniego
                    </button>
                    <button class="btn-primary btn-block" id="btn-save-main" onclick="${isEditingRoutine ? 'app.saveCurrentAsRoutine()' : 'app.saveWorkout()'}">
                        ${utils.escapeHtml(saveBtnText)}
                    </button>
                    <button class="btn-outline btn-block" style="margin-top:0.5rem" onclick="${cancelAction}">Anuluj</button>
                </div>
            </div>

            <!-- Modal Wyboru Ćwiczenia -->
            <div id="exercise-modal" class="modal-overlay hidden" onclick="if(event.target === this) app.closeExerciseModal()">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Wybierz ćwiczenie</h3>
                        <button class="btn-outline btn-sm" onclick="app.closeExerciseModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <input type="text" id="modal-search" placeholder="Szukaj ćwiczenia..." oninput="app.filterModalExercises()" autocomplete="off">
                        
                        <div class="muscle-filter" id="modal-filters">
                            ${MUSCLE_GROUPS.map(g => `
                                <button class="chip ${appInstance.modalFilter === g ? 'active' : ''}" 
                                        onclick="app.setModalFilter('${g}')">
                                    ${g.charAt(0).toUpperCase() + g.slice(1)}
                                </button>
                            `).join('')}
                        </div>

                        <div id="modal-exercise-list">
                            <!-- Lista generowana dynamicznie -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Wyboru Rutyny -->
            <div id="routine-modal" class="modal-overlay hidden" onclick="if(event.target === this) app.closeRoutineSelector()">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Wybierz Rutynę</h3>
                        <button class="btn-outline btn-sm" onclick="app.closeRoutineSelector()">✕</button>
                    </div>
                    <div class="modal-body" id="routine-list-container">
                        <!-- Lista rutyn -->
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
        
        if(appInstance.tempSets.length > 0) {
            const btn = document.getElementById('btn-add-set');
            if(btn) btn.disabled = false;
        }
    },

    /**
     * Renderuje wiersze serii w formularzu
     */
    renderSessionRows(appInstance) {
        if(appInstance.tempSets.length === 0) {
            return '<div style="text-align:center; color:var(--text-light); padding:2rem;">Brak ćwiczeń. Kliknij "+ Ćwiczenie" lub "📋 Rutyna".</div>';
        }
        
        return appInstance.tempSets.map((item, exIndex) => `
            <div class="card" style="padding:1rem; margin-bottom:1rem;">
                <div class="flex flex-between" style="margin-bottom:0.5rem; border-bottom:1px solid var(--border); padding-bottom:0.5rem;">
                    <strong style="color:var(--primary)">${utils.escapeHtml(utils.getExerciseName(store.exercises, item.exerciseId))}</strong>
                    <button class="btn-danger btn-sm" onclick="app.removeSessionItem(${exIndex})">Usuń ćw.</button>
                </div>
                ${item.sets.map((s, sIdx) => `
                    <div class="set-row">
                        <div class="set-number">Seria ${sIdx + 1}</div>
                        <div>
                            <span class="set-label">Kg</span>
                            <input type="number" step="0.5" inputmode="decimal" placeholder="0" value="${s.weight}" oninput="app.updateSet(${exIndex}, ${sIdx}, 'weight', this.value)">
                        </div>
                        <div>
                            <span class="set-label">Powt.</span>
                            <input type="number" step="1" inputmode="numeric" placeholder="0" value="${s.reps}" oninput="app.updateSet(${exIndex}, ${sIdx}, 'reps', this.value)">
                        </div>
                        <div style="grid-column: 1/-1">
                            <span class="set-label">Notatka</span>
                            <input type="text" placeholder="np. ból, łatwo" value="${utils.escapeHtml(s.notes || '')}" oninput="app.updateSet(${exIndex}, ${sIdx}, 'notes', this.value)" style="margin-bottom:0">
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    },

    /**
     * Renderuje listę ćwiczeń w modalu wyszukiwania
     */
    renderModalList(exercises) {
        const listContainer = document.getElementById('modal-exercise-list');
        if (!listContainer) return;

        if (exercises.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; color:var(--text-light)">Brak wyników</p>';
            return;
        }

        listContainer.innerHTML = exercises.map(ex => `
            <div class="exercise-list-item" onclick="app.selectExerciseFromModal('${ex.id}')">
                <div style="font-weight:bold">${utils.escapeHtml(ex.name)}</div>
                <div style="font-size:0.8rem; color:var(--text-light)">${utils.escapeHtml(ex.muscleGroup)}</div>
            </div>
        `).join('');
    },

    /**
     * Renderuje listę rutyn w modalu wyboru
     */
    renderRoutineList(routines) {
        const container = document.getElementById('routine-list-container');
        if(!container) return;
        if(routines.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-light)">Brak zapisanych rutyn. Stwórz pierwszą w zakładce Rutyny!</p>';
            return;
        }
        container.innerHTML = routines.map(r => `
            <div class="exercise-list-item" onclick="app.loadRoutine('${r.id}')">
                <div style="font-weight:bold; font-size:1.1rem">${utils.escapeHtml(r.name)}</div>
                <div style="font-size:0.8rem; color:var(--text-light)">${r.exercises.length} ćwiczeń • Objętość: ~${r.totalVolume || 0} kg</div>
            </div>
        `).join('');
    },

    /**
     * Renderuje widok zarządzania Rutynami
     */
    renderRoutinesView(container, appInstance) {
        const routines = store.getRoutines();
        let html = `
            <div class="card">
                <div class="flex flex-between" style="margin-bottom:1rem">
                    <h2>Moje Rutyny</h2>
                    <button class="btn-primary" onclick="app.createNewRoutine()">+ Nowa Rutyna</button>
                </div>
                ${routines.length === 0 ? '<p style="text-align:center; color:var(--text-light)">Brak rutyn. Kliknij "+ Nowa Rutyna" aby stworzyć plan.</p>' : ''}
                <div class="grid">
                    ${routines.map(r => `
                        <div class="card" style="margin-bottom:0; border:1px solid var(--border)">
                            <h3>${utils.escapeHtml(r.name)}</h3>
                            <p style="color:var(--text-light); font-size:0.9rem; margin-bottom:1rem">${r.exercises.length} ćwiczeń</p>
                            <div class="flex">
                                <button class="btn-primary btn-sm" onclick="app.loadRoutine('${r.id}')" style="flex:1">Użyj</button>
                                <button class="btn-outline btn-sm" onclick="app.editRoutine('${r.id}')" style="flex:1">Edytuj</button>
                                <button class="btn-danger btn-sm" onclick="app.confirmDeleteRoutine('${r.id}')">Usuń</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.innerHTML = html;
    },

    /**
     * Renderuje widok Statystyk
     */
    renderStats(container) {
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        
        const monthLogs = store.logs.filter(l => l.date.startsWith(currentMonthStr));
        
        const workoutCount = monthLogs.length;
        let totalVolume = 0;
        const muscleVolume = {};

        monthLogs.forEach(log => {
            log.exercises.forEach(ex => {
                if(ex.isCardio) return;
                const exVol = ex.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
                totalVolume += exVol;

                const exDef = store.exercises.find(e => e.id === ex.exerciseId);
                if(exDef) {
                    const group = exDef.muscleGroup;
                    muscleVolume[group] = (muscleVolume[group] || 0) + exVol;
                }
            });
        });

        const sortedMuscles = Object.entries(muscleVolume).sort((a,b) => b[1] - a[1]);
        const maxVol = sortedMuscles.length > 0 ? sortedMuscles[0][1] : 1;

        let html = `
            <div class="grid">
                <div class="card stat-card">
                    <h3>Treningi w tym miesiącu</h3>
                    <div class="stat-value">${workoutCount}</div>
                </div>
                <div class="card stat-card">
                    <h3>Łączna objętość</h3>
                    <div class="stat-value">${Math.round(totalVolume).toLocaleString()} <span style="font-size:1rem">kg</span></div>
                </div>
                
                <div class="card">
                    <h3>Top Partie (Objętość)</h3>
                    ${sortedMuscles.length === 0 ? '<p>Brak danych</p>' : ''}
                    <ul class="top-list" style="list-style:none">
                        ${sortedMuscles.slice(0, 5).map(([m, v]) => `
                            <li>
                                <span>${utils.escapeHtml(m)}</span>
                                <span>${Math.round(v).toLocaleString()} kg</span>
                            </li>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${(v/maxVol)*100}%"></div>
                            </div>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
        container.innerHTML = html;
    },

    /**
     * Renderuje widok Ustawień
     */
    renderSettings(container) {
        let html = `
            <div class="card settings-group">
                <h2>Wygląd</h2>
                <div class="flex flex-between">
                    <span>Tryb Ciemny</span>
                    <button class="btn-outline" onclick="app.toggleTheme()">Przełącz</button>
                </div>
            </div>

            <div class="card settings-group">
                <h2>Dane</h2>
                <div class="flex" style="margin-bottom:1rem">
                    <button class="btn-primary" onclick="app.exportData()">Eksportuj JSON</button>
                    <div class="file-input-wrapper">
                        <button class="btn-outline">Importuj JSON</button>
                        <input type="file" accept=".json" onchange="const f=new FileReader(); f.onload=(e)=>app.importData(e.target.result); f.readAsText(this.files[0])">
                    </div>
                </div>
                <button class="btn-danger" onclick="app.confirmResetData()">Reset Wszystkich Danych</button>
            </div>

            <div class="card settings-group">
                <h2>Dodaj Własne Ćwiczenie</h2>
                <input type="text" id="new-ex-name" placeholder="Nazwa ćwiczenia">
                <select id="new-ex-group">
                    ${MUSCLE_GROUPS.filter(g => g !== 'wszystkie').map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
                <button class="btn-primary" onclick="app.handleAddCustomExercise()">Dodaj</button>
            </div>
        `;
        container.innerHTML = html;
    },

    /**
     * Renderuje modal potwierdzenia (Confirmation Modal)
     * @param {string} message - Wiadomość do wyświetlenia
     * @param {function} onConfirm - Funkcja wywołana po potwierdzeniu
     */
    showConfirmModal(message, onConfirm) {
        const existing = document.getElementById('confirm-modal-overlay');
        if (existing) existing.remove();

        const html = `
            <div id="confirm-modal-overlay" class="modal-overlay" style="z-index: 2000;">
                <div class="modal-content" style="max-width: 400px; text-align: center;">
                    <div class="modal-header">
                        <h3>Potwierdzenie</h3>
                    </div>
                    <div class="modal-body" style="padding: 2rem 1rem;">
                        <p style="margin-bottom: 1.5rem; font-size: 1.1rem;">${utils.escapeHtml(message)}</p>
                        <div class="flex" style="justify-content: center; gap: 1rem;">
                            <button class="btn-outline" id="confirm-cancel-btn">Anuluj</button>
                            <button class="btn-danger" id="confirm-ok-btn">Potwierdź</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('confirm-ok-btn').onclick = () => {
            const overlay = document.getElementById('confirm-modal-overlay');
            if(overlay) overlay.remove();
            if(onConfirm) onConfirm();
        };

        document.getElementById('confirm-cancel-btn').onclick = () => {
            const overlay = document.getElementById('confirm-modal-overlay');
            if(overlay) overlay.remove();
        };
    }
};
