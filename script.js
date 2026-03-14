document.addEventListener('DOMContentLoaded', () => {
    const budgetInput = document.getElementById('budget-input');
    const budgetModal = document.getElementById('budget-modal');
    const openBudgetModalBtn = document.getElementById('open-budget-modal-btn');
    const closeBudgetModalBtn = document.getElementById('close-budget-modal-btn');
    
    // Sonstiges Menü Elemente
    const moreModal = document.getElementById('more-modal');
    const openMoreModalBtn = document.getElementById('open-more-modal-btn');
    const closeMoreModalBtn = document.getElementById('close-more-modal-btn');

    const expenseInput = document.getElementById('expense-input');
    const expenseTitle = document.getElementById('expense-title');
    const expenseModal = document.getElementById('expense-modal');
    const openExpenseModalBtn = document.getElementById('open-expense-modal-btn');
    const closeExpenseModalBtn = document.getElementById('close-expense-modal-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const resetBtn = document.getElementById('reset-btn');
    const showHistoryBtn = document.getElementById('show-history-btn');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');

    const dailyBudgetEl = document.getElementById('daily-budget');
    const accumulatedBudgetEl = document.getElementById('accumulated-budget');
    const dailySavingsRateEl = document.getElementById('daily-savings-rate');
    const resetSavingsBtn = document.getElementById('reset-savings-btn');
    const savingsDisplay = document.getElementById('savings-display');
    const currentAmountDisplay = document.getElementById('current-amount-display');
    const displayBudgetAmountEl = document.getElementById('display-budget-amount');
    const currentDateEl = document.getElementById('current-date');

    // Aktuelles Datum anzeigen
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.innerText = now.toLocaleDateString('de-DE', options);

    // Initialisierung: Letzten gespeicherten Wert laden
    const savedAmount = localStorage.getItem('budgetAmount');
    if (savedAmount) {
        budgetInput.value = savedAmount;
        
        // ZUERST den eingefrorenen Wert laden (falls vorhanden)
        const frozenDailyBudget = localStorage.getItem('currentDailyBudget');
        
        if (frozenDailyBudget) {
            // Wenn ein Wert existiert, diesen stabil anzeigen (EINGEFROREN)
            dailyBudgetEl.innerText = `€ ${parseFloat(frozenDailyBudget).toFixed(2)}`;
        } else {
            // Nur beim allerersten Mal berechnen
            calculateBudget();
        }
        checkSavingsStatus();
    } else {
        updateDaysRemaining();
    }

    // Sonstiges Menü Öffnen/Schließen
    openMoreModalBtn.addEventListener('click', () => {
        moreModal.style.display = 'flex';
    });
    
    closeMoreModalBtn.addEventListener('click', () => {
        moreModal.style.display = 'none';
    });

    openBudgetModalBtn.addEventListener('click', () => {
        moreModal.style.display = 'none'; // Hauptmenü schließen
        budgetModal.style.display = 'flex';
        budgetInput.focus();
        
        // Initialer Check beim Öffnen
        const amount = budgetInput.value;
        const savedAmount = localStorage.getItem('budgetAmount');
        calculateBtn.disabled = (amount === savedAmount || amount === "");
    });

    closeBudgetModalBtn.addEventListener('click', () => {
        budgetModal.style.display = 'none';
        budgetInput.value = localStorage.getItem('budgetAmount') || '';
    });

    budgetInput.addEventListener('input', () => {
        const amount = budgetInput.value;
        const savedAmount = localStorage.getItem('budgetAmount');
        // Button nur aktivieren, wenn der Wert sich vom gespeicherten unterscheidet und nicht leer ist
        calculateBtn.disabled = (amount === savedAmount || amount === "");
    });

    // Enter-Taste für Budget-Eingabe (Modal)
    budgetInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !calculateBtn.disabled) {
            calculateBtn.click();
        }
    });

    calculateBtn.addEventListener('click', () => {
        const amount = parseFloat(budgetInput.value);
        if (!isNaN(amount)) {
            const oldAmount = parseFloat(localStorage.getItem('budgetAmount')) || 0;
            const difference = oldAmount - amount;
            
            // Wenn gespart wird
            if (localStorage.getItem('savingsStartDate')) {
                let currentAdjustment = parseFloat(localStorage.getItem('savingsAdjustment')) || 0;
                localStorage.setItem('savingsAdjustment', (currentAdjustment + difference).toString());
            }

            localStorage.setItem('budgetAmount', amount.toString());
            
            // Differenz für den Verlauf berechnen (Neu - Alt)
            const diffForHistory = amount - oldAmount;
            const historyNote = diffForHistory >= 0 ? `Kontostand angepasst: +€${diffForHistory.toFixed(2)}` : `Kontostand angepasst: -€${Math.abs(diffForHistory).toFixed(2)}`;
            saveToHistory(amount, historyNote, diffForHistory);
            
            // Tagesbudget berechnen
            const remainingDays = updateDaysRemaining();
            const newDailyRate = amount / remainingDays;
            
            localStorage.setItem('currentDailyBudget', newDailyRate.toString());
            if (localStorage.getItem('savingsStartDate')) {
                localStorage.setItem('savingDailyRate', newDailyRate.toString());
            }

            dailyBudgetEl.innerText = `€ ${newDailyRate.toFixed(2)}`;
            
            // Automatischer Sparmodus-Start, falls noch nicht aktiv
            if (!localStorage.getItem('savingsStartDate')) {
                const today = new Date();
                const startMidnight = new Date(today);
                startMidnight.setHours(0, 0, 0, 0);
                
                localStorage.setItem('savingsStartDate', startMidnight.getTime().toString());
                localStorage.setItem('savingsAdjustment', "0");
                localStorage.setItem('savingDailyRate', newDailyRate.toString());
                // FLAG: Heute ist der allererste Tag
                localStorage.setItem('isInitialDay', "true");
            }

            checkSavingsStatus();
            budgetModal.style.display = 'none'; // Modal schließen
        } else {
            alert('Bitte gib einen gültigen Betrag ein.');
        }
    });

    openExpenseModalBtn.addEventListener('click', () => {
        expenseModal.style.display = 'flex';
        expenseInput.focus();
    });

    closeExpenseModalBtn.addEventListener('click', () => {
        expenseModal.style.display = 'none';
        expenseInput.value = '';
        expenseTitle.value = '';
    });

    // Enter-Taste für Ausgaben-Modal (beide Felder)
    [expenseInput, expenseTitle].forEach(el => {
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addExpenseBtn.click();
            }
        });
    });

    addExpenseBtn.addEventListener('click', () => {
        const expense = parseFloat(expenseInput.value);
        const title = expenseTitle.value.trim();
        if (expense && expense > 0) {
            const currentAmount = parseFloat(localStorage.getItem('budgetAmount')) || 0;
            const newAmount = currentAmount - expense;
            
            if (localStorage.getItem('savingsStartDate')) {
                let currentAdjustment = parseFloat(localStorage.getItem('savingsAdjustment')) || 0;
                localStorage.setItem('savingsAdjustment', (currentAdjustment + expense).toString());
            }

            localStorage.setItem('budgetAmount', newAmount.toString());
            budgetInput.value = newAmount.toFixed(2);
            
            saveToHistory(newAmount, title ? `${title}: -€${expense.toFixed(2)}` : `Ausgabe: -€${expense.toFixed(2)}`, -expense);
            
            // LOGIK-KORREKTUR:
            // Wir berechnen das Tagesbudget NUR DANN neu, wenn man MEHR oder WENIGER 
            // als das heutige Tagesbudget ausgegeben hat.
            const remainingDays = updateDaysRemaining();
            const savedDailyRate = parseFloat(localStorage.getItem('currentDailyBudget')) || 0;
            
            // Wenn man genau das Tagesbudget ausgibt (innerhalb einer Rundungstoleranz von 0.02€),
            // bleibt die Rate für morgen identisch.
            const expectedRemnant = currentAmount - savedDailyRate;
            if (Math.abs(newAmount - expectedRemnant) < 0.02) {
                // Rate bleibt gleich
                dailyBudgetEl.innerText = `€ ${savedDailyRate.toFixed(2)}`;
            } else {
                // Nur bei Abweichungen vom Plan (Sonderausgaben) wird neu berechnet
                const newDailyRate = newAmount / (remainingDays - 1); // Berechne für ALLE FOLGENDEN Tage
                // Da wir aber das Budget für HEUTE anzeigen wollen:
                const dynamicRate = newAmount / remainingDays;
                localStorage.setItem('currentDailyBudget', dynamicRate.toString());
                dailyBudgetEl.innerText = `€ ${dynamicRate.toFixed(2)}`;
            }
            
            checkSavingsStatus();
            
            expenseModal.style.display = 'none';
            expenseInput.value = '';
            expenseTitle.value = '';
        } else {
            alert('Bitte gib einen gültigen Ausgabebetrag ein.');
        }
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Willst du wirklich alle Daten zurücksetzen? Dein Verlauf und Spar-Fortschritt gehen verloren.')) {
            localStorage.clear();
            location.reload();
        }
    });

    showHistoryBtn.addEventListener('click', () => {
        moreModal.style.display = 'none'; // Hauptmenü schließen
        updateHistoryDisplay();
        historyModal.style.display = 'flex';
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });

    resetSavingsBtn.addEventListener('click', () => {
        if (confirm('Spar-Budget wirklich auf 0 setzen? Das Startdatum wird auf heute verschoben.')) {
            moreModal.style.display = 'none'; // Hauptmenü schließen
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Aktuellen Kontostand für den Verlauf beibehalten
            const currentAmount = parseFloat(localStorage.getItem('budgetAmount')) || 0;
            saveToHistory(currentAmount, "Sparen zurückgesetzt");

            // Alles auf "Neuanfang" setzen
            localStorage.setItem('savingsStartDate', today.getTime().toString());
            localStorage.setItem('savingsAdjustment', "0");
            
            checkSavingsStatus();
        }
    });

    // Modals schließen, wenn man daneben klickt (auf das Overlay)
    [budgetModal, expenseModal, historyModal, moreModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Je nach Modal die entsprechenden Schließen-Aktionen ausführen
                if (modal === budgetModal) {
                    closeBudgetModalBtn.click();
                } else if (modal === expenseModal) {
                    closeExpenseModalBtn.click();
                } else if (modal === historyModal) {
                    closeHistoryBtn.click();
                } else if (modal === moreModal) {
                    closeMoreModalBtn.click();
                }
            }
        });
    });

    function saveToHistory(amount, note = "", expenseValue = 0) {
        let history = JSON.parse(localStorage.getItem('budgetHistory')) || [];
        const entry = {
            date: new Date().toLocaleString('de-DE'),
            amount: amount,
            note: note,
            expenseValue: expenseValue // Den reinen Ausgabebetrag speichern
        };
        history.unshift(entry); // Neueste oben
        localStorage.setItem('budgetHistory', JSON.stringify(history.slice(0, 20))); // Max 20 Einträge
    }

    window.deleteHistoryEntry = (index) => {
        if (confirm('Diesen Eintrag wirklich löschen?')) {
            let history = JSON.parse(localStorage.getItem('budgetHistory')) || [];
            const entryToDelete = history[index];
            
            // Korrektur des Spar-Adjustments basierend auf dem gespeicherten Differenzwert
            if (entryToDelete.expenseValue !== undefined && entryToDelete.expenseValue !== 0) {
                let currentAdjustment = parseFloat(localStorage.getItem('savingsAdjustment')) || 0;
                // Wir ziehen den Differenzwert vom Adjustment ab. 
                // Da Ausgaben negativ gespeichert werden (-25€), wird daraus: Adjustment - (-25) = Adjustment + 25.
                // Das ist korrekt, da wir das "verbrauchte Geld" (Adjustment) wieder senken wollen.
                localStorage.setItem('savingsAdjustment', (currentAdjustment + entryToDelete.expenseValue).toString());
            }
            
            history.splice(index, 1);
            localStorage.setItem('budgetHistory', JSON.stringify(history));

            if (history.length > 0) {
                const newCurrentAmount = history[0].amount;
                updateBudgetPostDeletion(newCurrentAmount);
            } else {
                // Wenn alles gelöscht wurde, Sparmodus ebenfalls zurücksetzen
                localStorage.removeItem('savingsStartDate');
                localStorage.removeItem('savingsAdjustment');
                localStorage.removeItem('savingDailyRate');
                updateBudgetPostDeletion(0);
                
                // UI Karten verstecken, die nur im Sparmodus aktiv sind
                savingsDisplay.style.display = 'none';
                openExpenseModalBtn.style.display = 'none';
                currentAmountDisplay.style.display = 'none';
            }

            updateHistoryDisplay();
        }
    };

    function updateBudgetPostDeletion(newAmount) {
        // 1. Internen Betrag updaten
        localStorage.setItem('budgetAmount', newAmount.toString());
        budgetInput.value = newAmount.toFixed(2);
        displayBudgetAmountEl.innerText = `€ ${newAmount.toFixed(2)}`; // Sofortige Anzeige

        // 2. Tagesbudget neu berechnen
        const remainingDays = updateDaysRemaining();
        const newDailyRate = newAmount / remainingDays;
        localStorage.setItem('currentDailyBudget', newDailyRate.toString());
        
        dailyBudgetEl.innerText = `€ ${newDailyRate.toFixed(2)}`;
        
        // UI komplett neu zeichnen
        checkSavingsStatus();
    }

    function updateHistoryDisplay() {
        const history = JSON.parse(localStorage.getItem('budgetHistory')) || [];
        historyList.innerHTML = history.map((item, index) => {
            let displayTitle = "Budget Update";
            if (item.note) {
                displayTitle = item.note.includes(':') ? item.note.split(':')[0] : item.note;
            }

            // Badge-Klasse und Farblogik bestimmen
            let badgeClass = "history-expense-badge";
            let badgeText = "";
            let showBadge = false;

            if (item.expenseValue !== undefined && item.expenseValue !== 0) {
                showBadge = true;
                if (item.expenseValue > 0) {
                    // Es war ein positiver Zuwachs (Kontostand erhöht)
                    badgeText = `+ € ${item.expenseValue.toFixed(2)}`;
                    badgeClass = "history-income-badge";
                } else {
                    // Es war ein Abzug (Ausgabe oder Kontostand gesenkt)
                    badgeText = `- € ${Math.abs(item.expenseValue).toFixed(2)}`;
                    badgeClass = "history-expense-badge";
                }
            }

            return `
                <li class="history-item">
                    <div class="history-item-left">
                        <span class="history-item-date">${item.date}</span>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span class="history-item-title">${displayTitle}</span>
                            ${showBadge ? `<span class="${badgeClass}">${badgeText}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="history-item-amount">€ ${item.amount.toFixed(2)}</span>
                        <button class="history-delete-btn" onclick="deleteHistoryEntry(${index})">
                            <i class="fas fa-trash-alt" style="font-size: 14px;"></i>
                        </button>
                    </div>
                </li>
            `;
        }).join('') || '<li style="padding: 20px 0; text-align: center; color: #8e8e93;">Noch keine Einträge</li>';
    }

    function checkSavingsStatus() {
        const startTimestamp = localStorage.getItem('savingsStartDate');
        const initialDailyRate = parseFloat(localStorage.getItem('savingDailyRate'));
        const adjustment = parseFloat(localStorage.getItem('savingsAdjustment')) || 0;
        const history = JSON.parse(localStorage.getItem('budgetHistory')) || [];
        const isInitialDay = localStorage.getItem('isInitialDay') === "true";
        
        if (startTimestamp && initialDailyRate) {
            const startDate = new Date(parseInt(startTimestamp));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let totalAccumulatedSoll = 0;
            let currentDate = new Date(startDate);
            
            // Logik: Wir gehen alle Tage von Start bis GESTERN durch.
            // AUSNAHME: Wenn es der allererste Tag ist (InitialDay), 
            // berechnen wir HEUTE sofort mit ein.
            
            const calculationEnd = new Date(today);
            if (!isInitialDay) {
                // Wenn wir nicht mehr im Startmodus sind, nur bis gestern rechnen
                calculationEnd.setDate(calculationEnd.getDate() - 1);
            } else {
                // Wenn wir heute gestartet sind, prüfen ob der Tag wirklich noch "heute" ist
                // Wenn heute schon nach dem Starttag liegt, Flag löschen
                if (today > startDate) {
                    localStorage.removeItem('isInitialDay');
                    calculationEnd.setDate(calculationEnd.getDate() - 1);
                }
            }
            
            while (currentDate <= calculationEnd) {
                const eod = new Date(currentDate);
                eod.setHours(23, 59, 59, 999);
                
                let rateAtEndOfDay = initialDailyRate;
                
                for (let i = 0; i < history.length; i++) {
                    const entryDate = new Date(itemDateToISO(history[i].date));
                    if (entryDate <= eod) {
                        const daysInMonth = getDaysInMonth(entryDate.getFullYear(), entryDate.getMonth());
                        const remaining = daysInMonth - entryDate.getDate() + 1;
                        if (remaining > 0) {
                            // Wichtig: Auf 2 Nachkommastellen runden beim Berechnen der historischen Rate
                            rateAtEndOfDay = Math.round((history[i].amount / remaining) * 100) / 100;
                        }
                        break;
                    }
                }
                
                totalAccumulatedSoll += rateAtEndOfDay;
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Das Ergebnis (Soll - Ist) ebenfalls runden und kleine Abweichungen abfangen
            let accumulated = totalAccumulatedSoll - adjustment;
            accumulated = Math.round(accumulated * 100) / 100;
            if (Math.abs(accumulated) < 0.01) accumulated = 0;
            
            savingsDisplay.style.display = 'flex';
            openExpenseModalBtn.style.display = 'flex';
            currentAmountDisplay.style.display = 'block';
            
            accumulatedBudgetEl.innerText = `€ ${accumulated.toFixed(2)}`;
            
            const currentDailyRate = parseFloat(localStorage.getItem('currentDailyBudget')) || initialDailyRate;
            dailySavingsRateEl.innerText = `(+ € ${currentDailyRate.toFixed(2)} / Tag)`;

            const currentAmount = parseFloat(localStorage.getItem('budgetAmount')) || 0;
            displayBudgetAmountEl.innerText = `€ ${currentAmount.toFixed(2)}`;
        }
    }

    // Hilfsfunktion um deutsches Datumsformat (DD.MM.YYYY, HH:MM:SS) für Date() lesbar zu machen
    function itemDateToISO(dateStr) {
        const parts = dateStr.split(', ');
        const dateParts = parts[0].split('.');
        return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${parts[1]}`;
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
        
        // Die Anzeige oben (dailyBudgetEl) wird hier NICHT mehr angerührt,
        // damit sie stabil bleibt, bis eine Ausgabe sie ändert.
        return remaining;
    }

    function calculateBudget() {
        const amount = parseFloat(budgetInput.value);
        const remainingDays = updateDaysRemaining();
        
        if (remainingDays > 0) {
            const dailyBudget = Math.round((amount / remainingDays) * 100) / 100;
            localStorage.setItem('currentDailyBudget', dailyBudget.toString());
            dailyBudgetEl.innerText = `€ ${dailyBudget.toFixed(2)}`;
        }
    }
});
