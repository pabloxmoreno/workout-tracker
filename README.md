# 💪 Workout Tracker Pro

Lekka, szybka i w pełni responsywna aplikacja do monitorowania treningów siłowych i cardio. Działa całkowicie w przeglądarce, nie wymaga serwera backendowego ani baz danych – wszystkie dane są przechowywane lokalnie w urządzeniu użytkownika (`localStorage`).

Gotowa do wdrożenia na **GitHub Pages** jako statyczna strona WWW.

## ✨ Funkcje

- 📅 **Kalendarz Treningów**: Przeglądaj historię ćwiczeń miesiąc po miesiącu. Dni z treningiem są podświetlone.
- 📝 **Logowanie Sesji**: Dodawaj ćwiczenia, serie, ciężary (kg) i powtórzenia. Możliwość dodawania notatek.
- 📊 **Statystyki**: Automatyczne obliczanie objętości treningowej (volume) i topowych partii mięśniowych w danym miesiącu.
- 🎨 **Tryb Ciemny/Jasny**: Przełączaj motyw zgodnie z preferencjami.
- 💾 **Eksport/Import Danych**: Bezpieczne kopie zapasowe w formacie JSON.
- 📱 **Mobile First**: Zoptymalizowany interfejs dla telefonów komórkowych (czytelne etykiety pól).
- 🔍 **Wyszukiwarka**: Szybkie filtrowanie ćwiczeń z wbudowanej bazy (>40 ćwiczeń) lub dodawanie własnych.

## 🚀 Wdrożenie (GitHub Pages)

Aplikacja jest gotowa do działania natychmiast po wrzuceniu na GitHub.

1. Utwórz nowe repozytorium na GitHub.
2. Wrzuć pliki projektu (zachowując strukturę folderów `css` i `js`).
3. Wejdź w **Settings** -> **Pages**.
4. W sekcji **Build and deployment** wybierz:
   - Source: `Deploy from a branch`
   - Branch: `main` (lub `master`)
   - Folder: `/ (root)`
5. Kliknij **Save**. Po chwili otrzymasz link do działającej aplikacji.

## 🛠 Struktura Projektu

```text
/
├── index.html          # Główny plik HTML
├── css/
│   └── styles.css      # Arkusze stylów (zmienne CSS, responsywność)
└── js/
    ├── app.js          # Główna logika aplikacji i nawigacja
    ├── config.js       # Baza danych ćwiczeń i grup mięśniowych
    ├── store.js        # Zarządzanie localStorage (CRUD)
    ├── ui.js           # Komponenty renderujące widoki
    └── utils.js        # Funkcje pomocnicze (walidacja, powiadomienia)
