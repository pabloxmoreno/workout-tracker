import store from './store.js';
import { utils } from './utils.js';
import { MUSCLE_GROUPS } from './config.js';

export const ui = {
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
                                Seria ${idx+1}: <span>${s.weight}kg</span> x <span>${s.reps}</span>
                                ${s.notes ? `- ${s.notes}` : ''}
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

    renderLogForm(container, appInstance) {
        const isEdit = !!appInstance.editModeId;
        const title = isEdit ? 'Edytuj Trening' : 'Dodaj Trening';

        // Renderujemy strukturę ze sticky header/footer
        let html = `
            <div class="log-container">
                <!-- STICKY HEADER: Filtry i Wyszukiwarka -->
                <div class="sticky-header">
                    <h2 style="margin-bottom:0.5rem">${title}</h2>
                    
                    <label style="font-size:0.8rem; color:var(--text-light)">Data</label>
                    <input type="date" value="${appInstance.selectedDate}" onchange="app.selectedDate = this.value" style="margin-bottom:1rem">
                    
                    <div class="muscle-filter">
                        ${MUSCLE_GROUPS.map(g => `
                            <button class="chip ${appInstance.activeMuscleFilter === g ? 'active' : ''}" 
                                    onclick="app.setMuscleFilter('${g}')">
                                ${g.charAt(0).toUpperCase() + g.slice(1)}
                            </button>
                        `).join('')}
                    </div>

                    <label style="font-size:0.8rem; color:var(--text-light)">Szukaj ćwiczenia</label>
                    <input type="text" id="exercise-search" placeholder="Np. przysiad..." oninput="app.filterExercises()" autocomplete="off">
                    
                    <label style="font-size:0.8rem; color:var(--text-light); margin-top:0.5rem">Wybierz z listy</label>
                    <select id="exercise-select" onchange="app.tempSelectedExercise = this.value">
                        <option value="" disabled selected>-- Wybierz ćwiczenie --</option>
                        ${this.getExerciseOptions(appInstance)}
                    </select>
                </div>

                <!-- LISTA ĆWICZEŃ I SERII -->
                <div class="session-list" id="session-list">
                    ${this.renderSessionRows(appInstance)}
                </div>

                <!-- STICKY FOOTER: Akcje -->
                <div class="sticky-footer">
                    <button class="btn-outline btn-block" onclick="app.addExerciseFromSelect()">
                        + Dodaj wybrane ćwiczenie
                    </button>
                    <div class="flex">
                         <button class="btn-outline btn-block" style="flex:1" onclick="app.addSetToLastExercise()">
                            + Dodaj serię do ostatniego
                        </button>
                    </div>
                    <button class="btn-primary btn-block" style="padding: 1rem; font-size:1.1rem" onclick="app.saveWorkout()">
                        ${isEdit ? 'Zapisz Zmiany' : 'Zakończ i Zapisz'}
                    </button>
                    ${isEdit ? `<button class="btn-outline btn-block" onclick="app.navigate('calendar')">Anuluj</button>` : ''}
                </div>
            </div>
        `;
        container.innerHTML = html;
        
        // Przywróć wartość z dropdownu jeśli była (np. po powrocie z filtrowania)
        if(appInstance.tempSelectedExercise) {
            const sel = document.getElementById('exercise-select');
            if(sel) sel.value = appInstance.tempSelectedExercise;
        }
    },

    getExerciseOptions(appInstance) {
        const exercisesList = store.exercises.sort((a,b) => a.name.localeCompare(b.name));
        const filtered = appInstance.activeMuscleFilter === 'wszystkie' 
            ? exercisesList 
            : exercisesList.filter(e => e.muscleGroup === appInstance.activeMuscleFilter);
            
        return filtered.map(e => `<option value="${e.id}">${e.name} (${e.muscleGroup})</option>`).join('');
    },

    // Nowa funkcja tylko do aktualizacji widoczności opcji (bez re-renderowania całego formu)
    updateExerciseDropdownVisibility(query) {
        const select = document.getElementById('exercise-select');
        if (!select) return;
        
        const options = select.options;
        const lowerQuery = query.toLowerCase();

        for (let i = 1; i < options.length; i++) { // Start od 1, żeby ominąć "-- Wybierz --"
            const text = options[i].text.toLowerCase();
            // Proste filtrowanie: jeśli tekst pasuje, pokazujemy
            options[i].style.display = text.includes(lowerQuery) ? '' : 'none';
        }
    },

    renderSessionRows(appInstance) {
        if(appInstance.tempSets.length === 0) {
            return '<div style="text-align:center; color:var(--text-light); padding:2rem; background:var(--surface); border-radius:var(--radius); border:1px dashed var(--border)">Brak dodanych ćwiczeń.<br>Użyj wyszukiwarki na górze, aby dodać pierwsze ćwiczenie.</div>';
        }
        
        return appInstance.tempSets.map((item, index) => `
            <div class="exercise-card">
                <div class="exercise-header">
                    <span>${index + 1}. ${utils.getExerciseName(store.exercises, item.exerciseId)}</span>
                    <button class="btn-danger btn-sm" onclick="app.removeSessionItem(${index})">Usuń ćw.</button>
                </div>
                <div style="display:grid; grid-template-columns: 0.5fr 1fr 1fr auto; gap:0.5rem; margin-bottom:0.5rem; font-size:0.75rem; color:var(--text-light); text-align:center;">
                    <div>#</div><div>Kg</div><div>Rep</div><div>Note</div>
                </div>
                ${item.sets.map((s, sIdx) => `
                    <div class="set-row">
                        <div class="set-number">${sIdx + 1}</div>
                        <div class="set-input-group">
                            <input type="number" step="0.5" inputmode="decimal" placeholder="0" value="${s.weight}" oninput="app.updateSet(${index}, ${sIdx}, 'weight', this.value)">
                        </div>
                        <div class="set-input-group">
                            <input type="number" step="1" inputmode="numeric" placeholder="0" value="${s.reps}" oninput="app.updateSet(${index}, ${sIdx}, 'reps', this.value)">
                        </div>
                        <div class="set-input-group" style="grid-column: span 1">
                             <input type="text" placeholder="Notatka" value="${s.notes || ''}" oninput="app.updateSet(${index}, ${sIdx}, 'notes', this.value)" style="margin-bottom:0">
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    },

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
                                <span>${m}</span>
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
                <button class="btn-danger" onclick="app.resetData()">Reset Wszystkich Danych</button>
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
    }
};
