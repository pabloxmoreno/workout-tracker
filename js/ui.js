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
                    <button class="btn-outline" id="btn-prev-month">❮</button>
                    <h2>${new Date(year, month).toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}</h2>
                    <button class="btn-outline" id="btn-next-month">❯</button>
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

            // Dodajemy atrybut data-date
            html += `<div class="${classes}" data-date="${currentStr}">${d}</div>`;
        }

        html += `</div>`; 

        const dayLogs = store.logs.filter(l => l.date === appInstance.selectedDate);
        html += `<div class="workout-preview">
            <div class="flex flex-between">
                <h3>Trening: ${appInstance.selectedDate}</h3>
                <button class="btn-primary" id="btn-add-training">+ Dodaj trening</button>
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
                        <button class="btn-primary btn-sm btn-edit-log" data-id="${log.id}" data-date="${log.date}">Edytuj</button>
                        <button class="btn-danger btn-sm btn-delete-log" data-id="${log.id}">Usuń</button>
                    </div>
                </div>`;

                // Dodajemy atrybut data-log-id
                html += `
                    <div class="workout-summary-item" data-log-id="${log.id}">
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
        const title = isEdit ? 'Edytuj Trening' : 'Nowy Trening';

        let html = `
            <div class="log-form-container">
                <div class="log-header card" style="margin-bottom:0; border-radius:0; box-shadow:none; background:transparent; padding:0;">
                    <h2>${title}</h2>
                    <label>Data</label>
                    <input type="date" id="workout-date" value="${appInstance.selectedDate}" style="margin-bottom:0.5rem">
                    
                    <button class="btn-primary btn-block" id="btn-open-modal">
                        + Wybierz ćwiczenie
                    </button>
                </div>

                <div class="log-scroll-area" id="log-scroll-area">
                    ${this.renderSessionRows(appInstance)}
                </div>

                <div class="log-footer card" style="margin-top:0; border-radius:0; box-shadow:none; background:transparent; padding:0;">
                    <button class="btn-outline btn-block" id="btn-add-set" disabled>
                        + Dodaj serię do ostatniego
                    </button>
                    <button class="btn-primary btn-block" id="btn-save-workout">
                        ${isEdit ? 'Zapisz Zmiany' : 'Zakończ i Zapisz'}
                    </button>
                    ${isEdit ? `<button class="btn-outline btn-block" style="margin-top:0.5rem" id="btn-cancel-edit">Anuluj</button>` : ''}
                </div>
            </div>

            <!-- MODAL -->
            <div id="exercise-modal" class="modal-overlay hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Wybierz ćwiczenie</h3>
                        <button class="btn-outline btn-sm" id="btn-close-modal">✕</button>
                    </div>
                    <div class="modal-body">
                        <input type="text" id="modal-search" placeholder="Szukaj ćwiczenia..." autocomplete="off">
                        
                        <div class="muscle-filter" id="modal-filters">
                            ${MUSCLE_GROUPS.map(g => `
                                <button class="chip ${appInstance.modalFilter === g ? 'active' : ''}" data-group="${g}">
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
        `;
        container.innerHTML = html;
        
        if(appInstance.tempSets.length > 0) {
            const btn = document.getElementById('btn-add-set');
            if(btn) btn.disabled = false;
        }
    },

    renderSessionRows(appInstance) {
        if(appInstance.tempSets.length === 0) {
            return '<div style="text-align:center; color:var(--text-light); padding:2rem;">Brak ćwiczeń. Kliknij "Wybierz ćwiczenie" aby dodać.</div>';
        }
        
        return appInstance.tempSets.map((item, exIndex) => `
            <div class="card" style="padding:1rem; margin-bottom:1rem;">
                <div class="flex flex-between" style="margin-bottom:0.5rem; border-bottom:1px solid var(--border); padding-bottom:0.5rem;">
                    <strong style="color:var(--primary)">${utils.getExerciseName(store.exercises, item.exerciseId)}</strong>
                    <button class="btn-danger btn-sm btn-remove-ex" data-idx="${exIndex}">Usuń ćw.</button>
                </div>
                ${item.sets.map((s, sIdx) => `
                    <div class="set-row">
                        <div class="set-number">Seria ${sIdx + 1}</div>
                        <div>
                            <span class="set-label">Kg</span>
                            <input type="number" step="0.5" inputmode="decimal" class="set-input" data-ex-idx="${exIndex}" data-set-idx="${sIdx}" data-field="weight" placeholder="0" value="${s.weight}">
                        </div>
                        <div>
                            <span class="set-label">Powt.</span>
                            <input type="number" step="1" inputmode="numeric" class="set-input" data-ex-idx="${exIndex}" data-set-idx="${sIdx}" data-field="reps" placeholder="0" value="${s.reps}">
                        </div>
                        <div style="grid-column: 1/-1; display:flex; gap:0.5rem; align-items:end;">
                            <div style="flex:1">
                                <span class="set-label">Notatka</span>
                                <input type="text" class="set-input" data-ex-idx="${exIndex}" data-set-idx="${sIdx}" data-field="notes" placeholder="np. ból" value="${s.notes || ''}" style="margin-bottom:0">
                            </div>
                            <button class="btn-danger btn-sm btn-remove-set" data-ex-idx="${exIndex}" data-set-idx="${sIdx}" style="margin-bottom:1rem">-</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    },

    renderModalList(exercises) {
        const listContainer = document.getElementById('modal-exercise-list');
        if (!listContainer) return;

        if (exercises.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; color:var(--text-light)">Brak wyników</p>';
            return;
        }

        listContainer.innerHTML = exercises.map(ex => `
            <div class="exercise-list-item" data-id="${ex.id}">
                <div style="font-weight:bold">${ex.name}</div>
                <div style="font-size:0.8rem; color:var(--text-light)">${ex.muscleGroup}</div>
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
                    <button class="btn-outline" id="btn-toggle-theme">Przełącz</button>
                </div>
            </div>

            <div class="card settings-group">
                <h2>Dane</h2>
                <div class="flex" style="margin-bottom:1rem">
                    <button class="btn-primary" id="btn-export">Eksportuj JSON</button>
                    <div class="file-input-wrapper">
                        <button class="btn-outline">Importuj JSON</button>
                        <input type="file" id="input-import" accept=".json" style="position:absolute; left:0; top:0; opacity:0; width:100%; height:100%; cursor:pointer;">
                    </div>
                </div>
                <button class="btn-danger" id="btn-reset">Reset Wszystkich Danych</button>
            </div>

            <div class="card settings-group">
                <h2>Dodaj Własne Ćwiczenie</h2>
                <input type="text" id="new-ex-name" placeholder="Nazwa ćwiczenia">
                <select id="new-ex-group">
                    ${MUSCLE_GROUPS.filter(g => g !== 'wszystkie').map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
                <button class="btn-primary" id="btn-add-custom">Dodaj</button>
            </div>
        `;
        container.innerHTML = html;
    }
};
