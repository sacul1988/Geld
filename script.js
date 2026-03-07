document.addEventListener('DOMContentLoaded', () => {
    const budgetInput = document.getElementById('budget-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const daysRemainingEl = document.getElementById('days-remaining');
    const dailyBudgetEl = document.getElementById('daily-budget');
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
        
        daysRemainingEl.innerText = remaining;
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
