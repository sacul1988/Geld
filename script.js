document.addEventListener('DOMContentLoaded', () => {
    const budgetInput = document.getElementById('budget-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const startSavingBtn = document.getElementById('start-saving-btn');
    const resetBtn = document.getElementById('reset-btn');
    const showHistoryBtn = document.getElementById('show-history-btn');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');

    const dailyBudgetEl = document.getElementById('daily-budget');
    const accumulatedBudgetEl = document.getElementById('accumulated-budget');
    const dailySavingsRateEl = document.getElementById('daily-savings-rate');
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
        // Beim Laden nur den gespeicherten Tagesbudget-Wert anzeigen
        const savedDailyBudget = localStorage.getItem('currentDailyBudget');
        if (savedDailyBudget) {
            dailyBudgetEl.innerText = `€ ${parseFloat(savedDailyBudget).toFixed(2)}`;
        } else {
            calculateBudget();
        }
        checkSavingsStatus();
    } else {
        updateDaysRemaining();
    }

    calculateBtn.addEventListener('click', () => {
        const amount = parseFloat(budgetInput.value);
        if (amount && amount > 0) {
            const oldAmount = parseFloat(localStorage.getItem('budgetAmount')) || amount;
            const difference = oldAmount - amount;
            
            // Wenn gespart wird
            if (localStorage.getItem('savingsStartDate')) {
                let currentAdjustment = parseFloat(localStorage.getItem('savingsAdjustment')) || 0;
                localStorage.setItem('savingsAdjustment', (currentAdjustment + difference).toString());
            }

            localStorage.setItem('budgetAmount', amount.toString());
            saveToHistory(amount);
            
            // Tagesbudget berechnen und FEST speichern
            const remainingDays = updateDaysRemaining();
            const newDailyRate = amount / remainingDays;
            localStorage.setItem('currentDailyBudget', newDailyRate.toString());
            
            // Spar-Zuwachs ebenfalls an diesen neuen Wert koppeln
            if (localStorage.getItem('savingsStartDate')) {
                localStorage.setItem('savingDailyRate', newDailyRate.toString());
            }

            dailyBudgetEl.innerText = `€ ${newDailyRate.toFixed(2)}`;
            checkSavingsStatus();
        } else {
            alert('Bitte gib einen gültigen Betrag ein.');
        }
    });

    startSavingBtn.addEventListener('click', () => {
        const amount = parseFloat(budgetInput.value);
        if (amount && amount > 0) {
            const existingStart = localStorage.getItem('savingsStartDate');
            if (existingStart) {
                const confirmRestart = confirm('Ein Sparvorgang läuft bereits. Willst du wirklich einen neuen Sparvorgang starten? Der aktuelle Fortschritt wird zurückgesetzt.');
                if (!confirmRestart) return;
            }

            // Sicherstellen, dass ein aktuelles Tagesbudget berechnet ist
            const remainingDays = updateDaysRemaining();
            const dailyRateAtStart = amount / remainingDays;
            localStorage.setItem('currentDailyBudget', dailyRateAtStart.toString());
            localStorage.setItem('savingDailyRate', dailyRateAtStart.toString());

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            localStorage.setItem('savingsStartDate', today.getTime().toString());
            localStorage.setItem('savingsAdjustment', "0");
            
            checkSavingsStatus();
            alert(`Spar-Modus gestartet! Dein festes Budget von € ${dailyRateAtStart.toFixed(2)} wird nun täglich akkumuliert.`);
        } else {
            alert('Bitte gib zuerst einen Betrag ein.');
        }
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Willst du wirklich alle Daten zurücksetzen? Dein Verlauf und Spar-Fortschritt gehen verloren.')) {
            localStorage.clear();
            location.reload();
        }
    });

    showHistoryBtn.addEventListener('click', () => {
        updateHistoryDisplay();
        historyModal.style.display = 'flex';
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });

    function saveToHistory(amount) {
        let history = JSON.parse(localStorage.getItem('budgetHistory')) || [];
        const entry = {
            date: new Date().toLocaleString('de-DE'),
            amount: amount
        };
        history.unshift(entry); // Neueste oben
        localStorage.setItem('budgetHistory', JSON.stringify(history.slice(0, 20))); // Max 20 Einträge
    }

    function updateHistoryDisplay() {
        const history = JSON.parse(localStorage.getItem('budgetHistory')) || [];
        historyList.innerHTML = history.map(item => `
            <li style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between;">
                <span style="font-size: 13px; color: #8e8e93;">${item.date}</span>
                <span style="font-weight: 600;">€ ${item.amount.toFixed(2)}</span>
            </li>
        `).join('') || '<li style="padding: 20px 0; text-align: center; color: #8e8e93;">Noch keine Einträge</li>';
    }

    function checkSavingsStatus() {
        const startTimestamp = localStorage.getItem('savingsStartDate');
        const dailyRate = parseFloat(localStorage.getItem('savingDailyRate'));
        const adjustment = parseFloat(localStorage.getItem('savingsAdjustment')) || 0;
        
        if (startTimestamp && dailyRate) {
            const startDate = new Date(parseInt(startTimestamp));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffTime = today - startDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            // Ergebnis: (Rate * Tage) - verbrauchte Differenzen
            const accumulated = (dailyRate * diffDays) - adjustment;
            
            savingsDisplay.style.display = 'flex';
            accumulatedBudgetEl.innerText = `€ ${accumulated.toFixed(2)}`;
            dailySavingsRateEl.innerText = `(+ € ${dailyRate.toFixed(2)} / Tag)`;
            
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
        const month = today.getMonth();
        const day = today.getDate();
        
        const lastDay = getDaysInMonth(year, month);
        const remaining = lastDay - day + 1;
        
        dailyBudgetEl.innerText = dailyBudgetEl.innerText; // Keep current if exists
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
