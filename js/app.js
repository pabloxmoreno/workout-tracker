const App = {
    exercises: [],

    init: () => {
        // Inicjalizacja modułów
        UI.init();
        
        // Ładowanie danych
        App.loadExercises();
        
        // Nasłuchiwanie zdarzeń
        App.attachEventListeners();
    },

    loadExercises: () => {
        const stored = Utils.loadFromStorage(APP_CONFIG.STORAGE_KEY);
        
        if (stored && Array.isArray(stored)) {
            App.exercises = stored;
        } else {
            // Jeśli brak danych, ładujemy domyślne
            App.exercises = [...APP_CONFIG.DEFAULT_EXERCISES];
            App.saveExercises();
        }
        
        App.render();
    },

    saveExercises: () => {
        if (App.exercises.length > APP_CONFIG.MAX_EXERCISES) {
            alert('Osiągnięto maksymalną liczbę ćwiczeń.');
            App.exercises = App.exercises.slice(0, APP_CONFIG.MAX_EXERCISES);
        }
        Utils.saveToStorage(APP_CONFIG.STORAGE_KEY, App.exercises);
    },

    addExercise: (data) => {
        const validation = Utils.validateExercise(data);
        
        if (!validation.isValid) {
            UI.showErrors(validation.errors);
            return false;
        }

        const newExercise = {
            id: Utils.generateId(),
            name: data.name,
            sets: data.sets,
            reps: data.reps,
            createdAt: new Date().toISOString()
        };

        App.exercises.unshift(newExercise); // Dodaj na początek
        App.saveExercises();
        App.render();
        UI.clearForm();
        return true;
    },

    deleteExercise: (id) => {
        if (!confirm('Czy na pewno chcesz usunąć to ćwiczenie?')) {
            return;
        }

        App.exercises = App.exercises.filter(ex => ex.id !== id);
        App.saveExercises();
        App.render();
    },

    filterExercises: (query) => {
        const filtered = App.exercises.filter(ex => 
            ex.name.toLowerCase().includes(query.toLowerCase())
        );
        UI.renderList(filtered);
    },

    render: () => {
        UI.renderList(App.exercises);
    },

    attachEventListeners: () => {
        // Dodawanie ćwiczenia
        UI.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = UI.getFormData();
            App.addExercise(data);
        });

        // Usuwanie ćwiczenia (delegowanie zdarzeń)
        UI.elements.list.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const id = e.target.getAttribute('data-id');
                App.deleteExercise(id);
            }
        });

        // Wyszukiwanie
        UI.elements.searchInput.addEventListener('input', (e) => {
            App.filterExercises(e.target.value);
        });
    }
};

// Uruchomienie aplikacji po załadowaniu DOM
document.addEventListener('DOMContentLoaded', App.init);
