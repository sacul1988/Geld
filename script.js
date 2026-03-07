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
            localStorage.setItem('budgetAmountAtStart', amount.toString());
            
            checkSavingsStatus();
            alert('Spar-Modus (dynamisch) gestartet! Dein tägliches Budget wird nun fortlaufend akkumuliert.');
        } else {
            alert('Bitte gib zuerst einen Betrag ein.');
        }
    });

    function checkSavingsStatus() {
        const startTimestamp = localStorage.getItem('savingsStartDate');
        const amountAtStart = parseFloat(localStorage.getItem('budgetAmountAtStart'));
        
        if (startTimestamp && amountAtStart) {
            const startDate = new Date(parseInt(startTimestamp));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let totalAccumulated = 0;
            let currentTempAmount = amountAtStart;
            
            // Wir simulieren jeden Tag von Start bis heute
            const iterDate = new Date(startDate);
            let daysIterated = 0;
            
            while (iterDate <= today) {
                const year = iterDate.getFullYear();
                const month = iterDate.getMonth();
                const day = iterDate.getDate();
                const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                
                const remainingDaysInMonth = lastDayOfMonth - day + 1;
                
                // Tagesbudget für DIESEN spezifischen Tag berechnen
                const dailyRateForThisDay = currentTempAmount / remainingDaysInMonth;
                totalAccumulated += dailyRateForThisDay;
                
                // Wir ziehen den "verbrauchten" (bzw. gesparten) Tagessatz vom fiktiven Restbetrag ab
                currentTempAmount -= dailyRateForThisDay;
                
                // Nächsten Tag vorbereiten
                iterDate.setDate(iterDate.getDate() + 1);
                daysIterated++;
            }
            
            savingsDisplay.style.display = 'flex';
            accumulatedBudgetEl.innerText = `€ ${totalAccumulated.toFixed(2)}`;
            
            const formattedDate = startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            savingsStartInfoEl.innerText = `Gespart seit ${formattedDate} (${daysIterated} Tage)`;
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
