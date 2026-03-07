document.addEventListener('DOMContentLoaded', () => {
    const budgetInput = document.getElementById('budget-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const startSavingBtn = document.getElementById('start-saving-btn');
    const dailyBudgetEl = document.getElementById('daily-budget');
    const accumulatedBudgetEl = document.getElementById('accumulated-budget');
    const savingsStartInfoEl = document.getElementById('savings-start-info');
    const savingsDisplay = document.getElementById('savings-display');
    const currentDateEl = document.getElementById('current-date');

    // Aktuelles Datum anzeigen
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.innerText = now.toLocaleDateString('de-DE', options);

    // Initialisierung: Letzten gespeicherten Wert laden
    const savedAmount = localStorage.getItem('budgetAmount');
    if (savedAmount) {
        budgetInput.value = savedAmount;
        calculateBudget();
        checkSavingsStatus();
    } else {
        updateDaysRemaining();
    }

    calculateBtn.addEventListener('click', () => {
        const amount = budgetInput.value;
        if (amount && amount > 0) {
            localStorage.setItem('budgetAmount', amount);
            calculateBudget();
        } else {
            alert('Bitte gib einen gültigen Betrag ein.');
        }
    });

    startSavingBtn.addEventListener('click', () => {
        const amount = parseFloat(budgetInput.value);
        if (amount && amount > 0) {
            // Prüfung, ob bereits ein Sparvorgang läuft
            const existingStart = localStorage.getItem('savingsStartDate');
            if (existingStart) {
                const confirmRestart = confirm('Ein Sparvorgang läuft bereits. Willst du wirklich einen neuen Sparvorgang starten? Der aktuelle Fortschritt wird zurückgesetzt.');
                if (!confirmRestart) return;
            }

            const today = new Date();
            // Startdatum auf 00:00 Uhr setzen für saubere Tagesberechnung
            today.setHours(0, 0, 0, 0);
            localStorage.setItem('savingsStartDate', today.getTime().toString());
            
            // Fixen Tagessatz zum Startzeitpunkt berechnen und speichern
            const remainingDays = updateDaysRemaining();
            const dailyRateAtStart = amount / remainingDays;
            localStorage.setItem('savingDailyRate', dailyRateAtStart.toString());
            
            checkSavingsStatus();
            alert(`Spar-Modus gestartet! Dein festes Budget von € ${dailyRateAtStart.toFixed(2)} wird nun täglich akkumuliert.`);
        } else {
            alert('Bitte gib zuerst einen Betrag ein.');
        }
    });

    function checkSavingsStatus() {
        const startTimestamp = localStorage.getItem('savingsStartDate');
        const dailyRate = parseFloat(localStorage.getItem('savingDailyRate'));
        
        if (startTimestamp && dailyRate) {
            const startDate = new Date(parseInt(startTimestamp));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Tage seit Start berechnen (Millisekunden-Differenz)
            const diffTime = today - startDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 für den heutigen Tag
            
            const accumulated = dailyRate * diffDays;
            
            savingsDisplay.style.display = 'flex';
            accumulatedBudgetEl.innerText = `€ ${accumulated.toFixed(2)}`;
            
            const formattedDate = startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            savingsStartInfoEl.innerText = `Gespart seit ${formattedDate} (${diffDays} Tage)`;
        }
    }

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function updateDaysRemaining() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-11
        const day = today.getDate();
        
        const lastDay = getDaysInMonth(year, month);
        const remaining = lastDay - day + 1; // Heute zählt als ein Tag
        
        return remaining;
    }

    function calculateBudget() {
        const amount = parseFloat(budgetInput.value);
        const remainingDays = updateDaysRemaining();
        
        if (remainingDays > 0) {
            const dailyBudget = amount / remainingDays;
            dailyBudgetEl.innerText = `€ ${dailyBudget.toFixed(2)}`;
        }
    }
});
