// ... importy

const app = {
    // ... istniejące właściwości
    isModalOpen: false, // Stan modala

    // ... init, navigate, render (bez zmian w logice, ale render wywoła nowy UI)

    // Nowe metody dla modala
    openExerciseModal() {
        this.isModalOpen = true;
        // Renderujemy tylko fragment modala jeśli już istnieje, lub całość jeśli nie
        const modal = document.getElementById('exercise-modal');
        if(modal) {
            modal.classList.add('active');
            setTimeout(() => document.getElementById('modal-search-input').focus(), 100);
            this.renderModalList();
        } else {
            // Jeśli somehow UI nie jest gotowe, odśwież widok (rzadki przypadek)
            this.render(); 
        }
    },

    closeExerciseModal() {
        this.isModalOpen = false;
        const modal = document.getElementById('exercise-modal');
        if(modal) modal.classList.remove('active');
    },

    setModalFilter(group) {
        this.activeMuscleFilter = group;
        this.renderModalList();
        // Aktualizuj wizualnie chipy
        document.querySelectorAll('.muscle-filter .chip').forEach(chip => {
            chip.classList.toggle('active', chip.textContent.toLowerCase() === group);
        });
    },

    filterModalExercises() {
        this.renderModalList();
    },

    selectExerciseFromModal(exId) {
        const ex = store.exercises.find(e => e.id === exId);
        if(ex) {
            this.tempSets.push({
                exerciseId: ex.id,
                isCardio: ex.isCardio || false,
                sets: [{ weight: '', reps: '', notes: '' }]
            });
            this.closeExerciseModal();
            this.render(); // Prze-renderuj formularz z nowym ćwiczeniem
            // Przewiń na dół do nowego ćwiczenia
            setTimeout(() => {
                const body = document.getElementById('log-body');
                if(body) body.scrollTop = body.scrollHeight;
            }, 100);
        }
    },

    // ... reszta metod (addSetToExercise, updateSet, saveWorkout) bez zmian logicznych
    // Upewnij się, że updateSet waliduje dane jak wcześniej
    updateSet(exIdx, setIdx, field, value) {
        if (field === 'weight') {
            // Pozwól wpisywać kropkę/przecinek, ale usuń inne znaki
            if(value !== '' && isNaN(parseFloat(value.replace(',', '.')))) return;
        } else if (field === 'reps') {
            if(value !== '' && !Number.isInteger(parseInt(value))) return;
        }
        this.tempSets[exIdx].sets[setIdx][field] = value;
    },
    
    // ... deleteLog, toggleTheme itp.
};

window.app = app;
app.init();
