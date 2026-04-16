import store from './store.js';
import { utils } from './utils.js';
import { MUSCLE_GROUPS } from './config.js';

export const ui = {
    // ... (funkcje renderCalendar, renderStats, renderSettings bez zmian)

    renderLogForm(container, appInstance) {
        const isEdit = !!appInstance.editModeId;
        const title = isEdit ? 'Edytuj Trening' : 'Nowy Trening';

        let html = `
            <div class="log-form-container">
                <!-- Sticky Header -->
                <div class="log-header card" style="margin-bottom:0; border-radius:0; box-shadow:none; padding:1rem 0;">
                    <h2 style="font-size:1.2rem; margin:0;">${title}</h2>
                    <input type="date" value="${appInstance.selectedDate}" onchange="app.selectedDate = this.value" style="margin-top:0.5rem; margin-bottom:0;">
                </div>

                <!-- Scrollable Body -->
                <div class="log-body" id="log-body">
                    ${appInstance.tempSets.length === 0 
                        ? '<div style="text-align:center; color:var(--text-light); margin-top:2rem;">Kliknij "Wybierz ćwiczenie" na dole, aby zacząć.</div>' 
                        : ''}
                    
                    ${appInstance.tempSets.map((item, exIndex) => `
                        <div class="card" style="margin-bottom:1rem;">
                            <div class="flex flex-between" style="margin-bottom:0.8rem; border-bottom:1px solid var(--border); padding-bottom:0.5rem;">
                                <strong style="color:var(--primary);">${utils.getExerciseName(store.exercises, item.exerciseId)}</strong>
                                <button class="btn-danger btn-sm" onclick="app.removeSessionItem(${exIndex})">Usuń ćw.</button>
                            </div>
                            
                            ${item.sets.map((s, sIndex) => `
                                <div class="set-row" style="margin-bottom:0.8rem; position:relative;">
                                    <div style="position:absolute; top:-8px; left:0; font-size:0.7rem; font-weight:bold; color:var(--primary); background:var(--surface); padding:0 4px;">SERIA ${sIndex + 1}</div>
                                    <div>
                                        <span class="set-label">Kg</span>
                                        <input type="number" step="0.5" inputmode="decimal" placeholder="0" value="${s.weight}" oninput="app.updateSet(${exIndex}, ${sIndex}, 'weight', this.value)">
                                    </div>
                                    <div>
                                        <span class="set-label">Powt.</span>
                                        <input type="number" step="1" inputmode="numeric" placeholder="0" value="${s.reps}" oninput="app.updateSet(${exIndex}, ${sIndex}, 'reps', this.value)">
                                    </div>
                                    <div style="flex-grow:1;">
                                        <span class="set-label">Notatka</span>
                                        <input type="text" placeholder="..." value="${s.notes || ''}" oninput="app.updateSet(${exIndex}, ${sIndex}, 'notes', this.value)">
                                    </div>
                                    <div style="display:flex; align-items:end;">
                                        <button class="btn-outline btn-sm" style="padding:0.4rem;" onclick="app.removeSet(${exIndex}, ${sIndex})">×</button>
                                    </div>
                                </div>
                            `).join('')}
                            
                            <button class="btn-outline btn-sm" style="width:100%; margin-top:0.5rem;" onclick="app.addSetToExercise(${exIndex})">+ Dodaj serię</button>
                        </div>
                    `).join('')}
                </div>

                <!-- Sticky Footer Actions -->
                <div class="log-footer">
                    <button class="btn-primary" style="flex:2;" onclick="app.openExerciseModal()">
                        Wybierz ćwiczenie
                    </button>
                    <button class="btn-success" style="flex:1; background:var(--success);" onclick="app.saveWorkout()">
                        Zapisz
                    </button>
                </div>
            </div>

            <!-- Exercise Modal -->
            <div class="modal-overlay" id="exercise-modal" onclick="if(event.target === this) app.closeExerciseModal()">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Wybierz ćwiczenie</h3>
                        <button class="btn-outline btn-sm" onclick="app.closeExerciseModal()">Zamknij</button>
                    </div>
                    
                    <div class="modal-search">
                        <input type="text" id="modal-search-input" placeholder="Szukaj ćwiczenia..." oninput="app.filterModalExercises()" autofocus>
                        <div class="muscle-filter" style="margin-top:0.5rem;">
                             ${MUSCLE_GROUPS.filter(g => g !== 'wszystkie').map(g => `
                                <button class="chip ${appInstance.activeMuscleFilter === g ? 'active' : ''}" 
                                        onclick="app.setModalFilter('${g}')" style="font-size:0.75rem; padding:0.2rem 0.6rem;">
                                    ${g}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <ul class="exercise-list" id="modal-exercise-list">
                        <!-- Lista generowana dynamicznie -->
                    </ul>
                </div>
            </div>
        `;
        container.innerHTML = html;
        
        // Jeśli modal był otwarty przed renderowaniem (np. przy zmianie filtra), otwórz go ponownie
        if(appInstance.isModalOpen) {
            document.getElementById('exercise-modal').classList.add('active');
            setTimeout(() => document.getElementById('modal-search-input').focus(), 100);
            app.renderModalList(); // Odśwież listę
        }
    },

    renderModalList() {
        const listEl = document.getElementById('modal-exercise-list');
        if(!listEl) return;

        const query = (document.getElementById('modal-search-input')?.value || '').toLowerCase();
        const filter = app.activeMuscleFilter;

        const filtered = store.exercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(query);
            const matchesGroup = filter === 'wszystkie' || ex.muscleGroup === filter;
            return matchesSearch && matchesGroup;
        }).sort((a,b) => a.name.localeCompare(b.name));

        listEl.innerHTML = filtered.map(ex => `
            <li class="exercise-item" onclick="app.selectExerciseFromModal('${ex.id}')">
                <div>
                    <strong>${ex.name}</strong>
                    <div style="font-size:0.8rem; color:var(--text-light);">${ex.muscleGroup}</div>
                </div>
                <span>Dodaj</span>
            </li>
        `).join('');
        
        if(filtered.length === 0) {
            listEl.innerHTML = '<li style="padding:1rem; text-align:center; color:var(--text-light)">Brak wyników</li>';
        }
    }
};
