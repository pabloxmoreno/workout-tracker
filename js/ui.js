import store from './store.js';
import { utils } from './utils.js';
import { MUSCLE_GROUPS } from './config.js';

export const ui = {
    /**
     * Bezpieczne renderowanie z użyciem escapeHtml
     */
    safeHtml(str) {
        return utils.escapeHtml(str);
    },

    renderCalendar(container, appInstance) {
        const year = appInstance.calendarYear;
        const month = appInstance.calendarMonth;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; 

        // Używamy textContent i createElement zamiast innerHTML gdzie to możliwe
        const calendarDiv = document.createElement('div');
        calendarDiv.className = 'card';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'calendar-header';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn-outline';
        prevBtn.textContent = '❮';
        prevBtn.onclick = () => appInstance.changeMonth(-1);
        
        const titleH2 = document.createElement('h2');
        titleH2.textContent = new Date(year, month).toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn-outline';
        nextBtn.textContent = '❯';
        nextBtn.onclick = () => appInstance.changeMonth(1);
        
        headerDiv.appendChild(prevBtn);
        headerDiv.appendChild(titleH2);
        headerDiv.appendChild(nextBtn);
        calendarDiv.appendChild(headerDiv);
        
        const gridDiv = document.createElement('div');
        gridDiv.className = 'calendar-grid';
        
        const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
        dayNames.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'cal-day-name';
            dayEl.textContent = day;
            gridDiv.appendChild(dayEl);
        });

        for(let i=0; i<startDayIndex; i++) {
            const emptyEl = document.createElement('div');
            gridDiv.appendChild(emptyEl);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        for(let d=1; d<=daysInMonth; d++) {
            const currentStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const hasWorkout = store.logs.some(l => l.date === currentStr);
            const isToday = currentStr === todayStr;
            const isSelected = currentStr === appInstance.selectedDate;
            
            const dayEl = document.createElement('div');
            dayEl.className = 'cal-day' + (isToday ? ' today' : '') + (hasWorkout ? ' has-workout' : '') + (isSelected ? ' selected' : '');
            dayEl.textContent = d;
            dayEl.onclick = () => appInstance.selectDate(currentStr);
            gridDiv.appendChild(dayEl);
        }

        calendarDiv.appendChild(gridDiv);
        
        // Workout preview section
        const previewDiv = document.createElement('div');
        previewDiv.className = 'workout-preview';
        
        const previewHeader = document.createElement('div');
        previewHeader.className = 'flex flex-between';
        
        const previewTitle = document.createElement('h3');
        previewTitle.textContent = `Trening: ${appInstance.selectedDate}`;
        
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary';
        addBtn.textContent = '+ Dodaj trening';
        addBtn.onclick = () => appInstance.prepLogForDate(appInstance.selectedDate, false);
        
        previewHeader.appendChild(previewTitle);
        previewHeader.appendChild(addBtn);
        previewDiv.appendChild(previewHeader);
        
        const dayLogs = store.logs.filter(l => l.date === appInstance.selectedDate);
        if(dayLogs.length > 0) {
            dayLogs.forEach(log => {
                let vol = 0;
                let exCount = log.exercises.length;
                log.exercises.forEach(e => {
                    if(!e.isCardio) vol += (e.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0));
                });
                
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

                const summaryItem = document.createElement('div');
                summaryItem.className = 'workout-summary-item';
                summaryItem.onclick = () => appInstance.toggleDetails(log.id);
                
                const flexDiv = document.createElement('div');
                flexDiv.className = 'flex flex-between';
                
                const volStrong = document.createElement('strong');
                volStrong.textContent = `${Math.round(vol)} kg`;
                
                const timeSmall = document.createElement('small');
                timeSmall.textContent = timeStr;
                
                flexDiv.appendChild(volStrong);
                flexDiv.appendChild(timeSmall);
                
                const exCountDiv = document.createElement('div');
                exCountDiv.style.fontSize = '0.85rem';
                exCountDiv.style.color = 'var(--text-light)';
                exCountDiv.textContent = `${exCount} ćwiczeń`;
                
                summaryItem.appendChild(flexDiv);
                summaryItem.appendChild(exCountDiv);
                
                // Details expanded (hidden by default)
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'workout-details-expanded hidden';
                detailsDiv.id = `details-${log.id}`;
                
                log.exercises.forEach(ex => {
                    const exName = utils.getExerciseName(store.exercises, ex.exerciseId);
                    const exBlock = document.createElement('div');
                    exBlock.className = 'exercise-block';
                    
                    const exTitle = document.createElement('div');
                    exTitle.className = 'exercise-title';
                    exTitle.textContent = exName;
                    exBlock.appendChild(exTitle);
                    
                    ex.sets.forEach((s, idx) => {
                        const setDetail = document.createElement('div');
                        setDetail.className = 'set-detail';
                        setDetail.innerHTML = `Seria ${idx+1}: <span>${s.weight}kg</span> x <span>${s.reps}</span>`;
                        if (s.notes) {
                            const notesSpan = document.createElement('span');
                            notesSpan.textContent = ` - ${s.notes}`;
                            setDetail.appendChild(notesSpan);
                        }
                        exBlock.appendChild(setDetail);
                    });
                    
                    detailsDiv.appendChild(exBlock);
                });
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'flex';
                actionsDiv.style.marginTop = '1rem';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-primary btn-sm';
                editBtn.textContent = 'Edytuj';
                editBtn.onclick = (e) => { e.stopPropagation(); appInstance.prepLogForDate(log.date, log.id); };
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-danger btn-sm';
                deleteBtn.textContent = 'Usuń';
                deleteBtn.onclick = (e) => { e.stopPropagation(); appInstance.deleteLog(log.id); };
                
                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);
                detailsDiv.appendChild(actionsDiv);
                
                summaryItem.appendChild(detailsDiv);
                previewDiv.appendChild(summaryItem);
            });
        } else {
            const noWorkoutP = document.createElement('p');
            noWorkoutP.style.color = 'var(--text-light)';
            noWorkoutP.style.marginTop = '1rem';
            noWorkoutP.textContent = 'Brak treningów tego dnia.';
            previewDiv.appendChild(noWorkoutP);
        }
        
        calendarDiv.appendChild(previewDiv);
        container.innerHTML = '';
        container.appendChild(calendarDiv);
    },

    renderLogForm(container, appInstance) {
        const isEdit = !!appInstance.editModeId;
        const title = isEdit ? 'Edytuj Trening' : 'Nowy Trening';

        // Tworzenie struktury z użyciem createElement zamiast innerHTML
        const formContainer = document.createElement('div');
        formContainer.className = 'log-form-container';
        
        // STICKY HEADER
        const headerDiv = document.createElement('div');
        headerDiv.className = 'log-header card';
        headerDiv.style.cssText = 'margin-bottom:0; border-radius:0; box-shadow:none; background:transparent; padding:0;';
        
        const titleH2 = document.createElement('h2');
        titleH2.textContent = title;
        headerDiv.appendChild(titleH2);
        
        const dateLabel = document.createElement('label');
        dateLabel.textContent = 'Data';
        headerDiv.appendChild(dateLabel);
        
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = appInstance.selectedDate;
        dateInput.style.marginBottom = '0.5rem';
        dateInput.onchange = (e) => { appInstance.selectedDate = e.target.value; };
        headerDiv.appendChild(dateInput);
        
        const addExerciseBtn = document.createElement('button');
        addExerciseBtn.className = 'btn-primary btn-block';
        addExerciseBtn.textContent = '+ Wybierz ćwiczenie';
        addExerciseBtn.onclick = () => appInstance.openExerciseModal();
        headerDiv.appendChild(addExerciseBtn);
        
        formContainer.appendChild(headerDiv);
        
        // SCROLL AREA
        const scrollArea = document.createElement('div');
        scrollArea.className = 'log-scroll-area';
        scrollArea.id = 'log-scroll-area';
        scrollArea.innerHTML = this.renderSessionRows(appInstance);
        formContainer.appendChild(scrollArea);
        
        // STICKY FOOTER
        const footerDiv = document.createElement('div');
        footerDiv.className = 'log-footer card';
        footerDiv.style.cssText = 'margin-top:0; border-radius:0; box-shadow:none; background:transparent; padding:0;';
        
        const addSetBtn = document.createElement('button');
        addSetBtn.className = 'btn-outline btn-block';
        addSetBtn.id = 'btn-add-set';
        addSetBtn.disabled = true;
        addSetBtn.textContent = '+ Dodaj serię do ostatniego';
        addSetBtn.onclick = () => appInstance.addSetToLastExercise();
        footerDiv.appendChild(addSetBtn);
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary btn-block';
        saveBtn.textContent = isEdit ? 'Zapisz Zmiany' : 'Zakończ i Zapisz';
        saveBtn.onclick = () => appInstance.saveWorkout();
        footerDiv.appendChild(saveBtn);
        
        if (isEdit) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-outline btn-block';
            cancelBtn.style.marginTop = '0.5rem';
            cancelBtn.textContent = 'Anuluj';
            cancelBtn.onclick = () => appInstance.navigate('calendar');
            footerDiv.appendChild(cancelBtn);
        }
        
        formContainer.appendChild(footerDiv);
        
        // MODAL WYBORU ĆWICZENIA - tworzony dynamicznie
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'exercise-modal';
        modalOverlay.className = 'modal-overlay hidden';
        modalOverlay.onclick = (e) => { if(e.target === modalOverlay) appInstance.closeExerciseModal(); };
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = 'Wybierz ćwiczenie';
        modalHeader.appendChild(modalTitle);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn-outline btn-sm';
        closeBtn.textContent = '✕';
        closeBtn.onclick = () => appInstance.closeExerciseModal();
        modalHeader.appendChild(closeBtn);
        
        modalContent.appendChild(modalHeader);
        
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'modal-search';
        searchInput.placeholder = 'Szukaj ćwiczenia...';
        searchInput.oninput = utils.debounce(() => appInstance.filterModalExercises(), 300);
        modalBody.appendChild(searchInput);
        
        // Filtry grup mięśni
        const filtersDiv = document.createElement('div');
        filtersDiv.className = 'muscle-filter';
        filtersDiv.id = 'modal-filters';
        
        MUSCLE_GROUPS.forEach(g => {
            const chipBtn = document.createElement('button');
            chipBtn.className = 'chip' + (appInstance.modalFilter === g ? ' active' : '');
            chipBtn.textContent = g.charAt(0).toUpperCase() + g.slice(1);
            chipBtn.onclick = () => appInstance.setModalFilter(g);
            filtersDiv.appendChild(chipBtn);
        });
        
        modalBody.appendChild(filtersDiv);
        
        const exerciseListDiv = document.createElement('div');
        exerciseListDiv.id = 'modal-exercise-list';
        modalBody.appendChild(exerciseListDiv);
        
        modalContent.appendChild(modalBody);
        modalOverlay.appendChild(modalContent);
        formContainer.appendChild(modalOverlay);
        
        container.innerHTML = '';
        container.appendChild(formContainer);
        
        // Jeśli edycja, odblokuj przycisk dodawania serii
        if(appInstance.tempSets.length > 0) {
            document.getElementById('btn-add-set').disabled = false;
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
                            <input type="text" placeholder="np. ból, łatwo" value="${s.notes || ''}" oninput="app.updateSet(${exIndex}, ${sIdx}, 'notes', this.value)" style="margin-bottom:0">
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    },

    // Renderuje listę wewnątrz modala - bezpiecznie z użyciem createElement
    renderModalList(exercises, appInstance) {
        const listContainer = document.getElementById('modal-exercise-list');
        if (!listContainer) return;

        // Wyczyść poprzednią zawartość
        listContainer.innerHTML = '';

        if (exercises.length === 0) {
            const noResultsP = document.createElement('p');
            noResultsP.style.textAlign = 'center';
            noResultsP.style.color = 'var(--text-light)';
            noResultsP.textContent = 'Brak wyników';
            listContainer.appendChild(noResultsP);
            return;
        }

        exercises.forEach(ex => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'exercise-list-item';
            
            const nameDiv = document.createElement('div');
            nameDiv.style.fontWeight = 'bold';
            nameDiv.textContent = ex.name; // textContent jest bezpieczny
            
            const groupDiv = document.createElement('div');
            groupDiv.style.fontSize = '0.8rem';
            groupDiv.style.color = 'var(--text-light)';
            groupDiv.textContent = ex.muscleGroup; // textContent jest bezpieczny
            
            itemDiv.appendChild(nameDiv);
            itemDiv.appendChild(groupDiv);
            itemDiv.onclick = () => appInstance.selectExerciseFromModal(ex.id);
            
            listContainer.appendChild(itemDiv);
        });
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
                    const group = utils.escapeHtml(exDef.muscleGroup);
                    muscleVolume[group] = (muscleVolume[group] || 0) + exVol;
                }
            });
        });

        const sortedMuscles = Object.entries(muscleVolume).sort((a,b) => b[1] - a[1]);
        const maxVol = sortedMuscles.length > 0 ? sortedMuscles[0][1] : 1;

        container.innerHTML = '';
        
        const gridDiv = document.createElement('div');
        gridDiv.className = 'grid';
        
        // Karta 1: Treningi w miesiącu
        const card1 = document.createElement('div');
        card1.className = 'card stat-card';
        const h3_1 = document.createElement('h3');
        h3_1.textContent = 'Treningi w tym miesiącu';
        const val1 = document.createElement('div');
        val1.className = 'stat-value';
        val1.textContent = workoutCount;
        card1.appendChild(h3_1);
        card1.appendChild(val1);
        gridDiv.appendChild(card1);
        
        // Karta 2: Łączna objętość
        const card2 = document.createElement('div');
        card2.className = 'card stat-card';
        const h3_2 = document.createElement('h3');
        h3_2.textContent = 'Łączna objętość';
        const val2 = document.createElement('div');
        val2.className = 'stat-value';
        val2.innerHTML = `${Math.round(totalVolume).toLocaleString()} <span style="font-size:1rem">kg</span>`;
        card2.appendChild(h3_2);
        card2.appendChild(val2);
        gridDiv.appendChild(card2);
        
        // Karta 3: Top partie
        const card3 = document.createElement('div');
        card3.className = 'card';
        const h3_3 = document.createElement('h3');
        h3_3.textContent = 'Top Partie (Objętość)';
        card3.appendChild(h3_3);
        
        if (sortedMuscles.length === 0) {
            const noDataP = document.createElement('p');
            noDataP.textContent = 'Brak danych';
            card3.appendChild(noDataP);
        } else {
            const ul = document.createElement('ul');
            ul.className = 'top-list';
            ul.style.listStyle = 'none';
            
            sortedMuscles.slice(0, 5).forEach(([m, v]) => {
                const li = document.createElement('li');
                
                const span1 = document.createElement('span');
                span1.textContent = m;
                const span2 = document.createElement('span');
                span2.textContent = `${Math.round(v).toLocaleString()} kg`;
                
                li.appendChild(span1);
                li.appendChild(span2);
                
                const barContainer = document.createElement('div');
                barContainer.className = 'bar-container';
                const barFill = document.createElement('div');
                barFill.className = 'bar-fill';
                barFill.style.width = `${(v/maxVol)*100}%`;
                barContainer.appendChild(barFill);
                
                ul.appendChild(li);
                ul.appendChild(barContainer);
            });
            
            card3.appendChild(ul);
        }
        
        gridDiv.appendChild(card3);
        container.appendChild(gridDiv);
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
