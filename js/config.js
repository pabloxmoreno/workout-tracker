// Konfiguracja aplikacji
const APP_CONFIG = {
    STORAGE_KEY: 'secure_exercise_tracker_data',
    MAX_EXERCISES: 100,
    DEFAULT_EXERCISES: [
        { id: 1, name: 'Pompki', sets: 3, reps: 15 },
        { id: 2, name: 'Przysiady', sets: 4, reps: 12 },
        { id: 3, name: 'Podciąganie', sets: 3, reps: 8 }
    ]
};

// Eksport dla innych modułów (w środowisku bez bundlera używamy obiektu globalnego lub window)
window.APP_CONFIG = APP_CONFIG;
