const UI = {
    elements: {
        form: null,
        list: null,
        searchInput: null,
        emptyState: null,
        nameInput: null,
        setsInput: null,
        repsInput: null,
        nameError: null
    },

    init: () => {
        UI.elements.form = document.getElementById('exercise-form');
        UI.elements.list = document.getElementById('exercise-list');
        UI.elements.searchInput = document.getElementById('search-input');
        UI.elements.emptyState = document.getElementById('empty-state');
        UI.elements.nameInput = document.getElementById('name');
        UI.elements.setsInput = document.getElementById('sets');
        UI.elements.repsInput = document.getElementById('reps');
        UI.elements.nameError = document.getElementById('name-error');
    },

    /**
     * Renderuje listę ćwiczeń
     * @param {Array} exercises - Tablica obiektów ćwiczeń
     */
    renderList: (exercises) => {
        UI.elements.list.innerHTML = '';

        if (!exercises || exercises.length === 0) {
            UI.elements.emptyState.style.display = 'block';
            return;
        }

        UI.elements.emptyState.style.display = 'none';

        exercises.forEach(exercise => {
            const li = document.createElement('li');
            li.className = 'exercise-item';
            
            // Bezpieczne wstawianie danych dzięki escapeHTML
            li.innerHTML = `
                <div class="exercise-info">
                    <strong>${Utils.escapeHTML(exercise.name)}</strong>
                    <span class="exercise-details">
                        ${exercise.sets} serie x ${exercise.reps} powtórzeń
                    </span>
                </div>
                <button class="btn-delete" data-id="${exercise.id}" aria-label="Usuń ${Utils.escapeHTML(exercise.name)}">
                    Usuń
                </button>
            `;
            
            UI.elements.list.appendChild(li);
        });
    },

    /**
     * Pokazuje błędy walidacji
     */
    showErrors: (errors) => {
        // Czyścimy poprzednie błędy
        UI.elements.nameError.textContent = '';
        UI.elements.nameInput.style.borderColor = '#d1d5db';

        if (errors && errors.length > 0) {
            // Pokazujemy pierwszy błąd związany z nazwą lub ogólny
            const nameError = errors.find(e => e.includes('Nazwa'));
            if (nameError) {
                UI.elements.nameError.textContent = nameError;
                UI.elements.nameInput.style.borderColor = '#ef4444';
            } else {
                alert(errors.join('\n')); // Fallback dla innych błędów
            }
        }
    },

    /**
     * Czyści formularz
     */
    clearForm: () => {
        UI.elements.form.reset();
        UI.elements.nameError.textContent = '';
        UI.elements.nameInput.style.borderColor = '#d1d5db';
        UI.elements.nameInput.focus();
    },

    /**
     * Pobiera dane z formularza
     */
    getFormData: () => {
        return {
            name: UI.elements.nameInput.value.trim(),
            sets: parseInt(UI.elements.setsInput.value, 10),
            reps: parseInt(UI.elements.repsInput.value, 10)
        };
    }
};

window.UI = UI;
