import store from './store.js';
import ui from './ui.js';
import { EXERCISES } from './config.js';
import { showToast } from './utils.js';

class App {
    constructor() {
        this.currentView = 'calendar';
        this.pendingExerciseAdd = null;
        
        this.init();
    }

    init() {
        // Inicjalizacja motywu
        if (store.settings.darkMode) {
            document.body.classList.add('dark-mode');
        }

        // Event Delegation dla Nawigacji
        document.querySelector('.bottom-nav').addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                navItem.classList.add('active');
                this.navigate(navItem.dataset.view);
            }
        });

        // Rejestracja Service Workera
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('SW zarejestrowany'))
                .catch(err => console.error('SW błąd:', err));
        }

        this.navigate('calendar');
    }

    navigate(view) {
        this.currentView = view;
        
        switch(view) {
            case 'calendar':
                ui.renderCalendar(this);
                break;
            case 'log':
                ui.renderLogForm(this);
                break;
            case 'stats':
                ui.renderStats();
                break;
            case 'settings':
                ui.renderSettings();
                break;
        }
    }

    openExerciseModal() {
        this.pendingExerciseAdd = true;
        ui.showModal(EXERCISES, (exercise) => {
            ui.addExerciseToForm(exercise);
        });
    }

    saveWorkout() {
        const form = document.getElementById('new-workout-form');
        if (!form) return;

        const date = form.querySelector('input[name="date"]').value;
        const exercises = [];
        
        form.querySelectorAll('.exercise-card').forEach(card => {
            const sets = [];
            card.querySelectorAll('.set-row').forEach(row => {
                const weight = parseFloat(row.querySelector('input[name="weight"]').value);
                const reps = parseInt(row.querySelector('input[name="reps"]').value);
                
                if (!isNaN(weight) && !isNaN(reps)) {
                    sets.push({ weight, reps });
                }
            });

            if (sets.length > 0) {
                exercises.push({
                    id: card.dataset.id,
                    name: card.querySelector('.exercise-name').textContent,
                    sets
                });
            }
        });

        if (exercises.length === 0) {
            showToast('Dodaj przynajmniej jedno ćwiczenie z serią', 'error');
            return;
        }

        store.addLog({
            date,
            exercises
        });

        showToast('Trening zapisany!', 'success');
        this.navigate('calendar');
    }

    toggleDetails(logId) {
        // Implementacja rozwijania szczegółów w kalendarzu
        // W pełnej wersji wymagałoby to dodatkowego UI w renderCalendar
        console.log('Toggle details for:', logId);
        showToast('Funkcja szczegółów w rozwoju', 'info');
    }
}

// Start aplikacji
const app = new App();
// Nie eksponujemy app globalnie: window.app = app;
