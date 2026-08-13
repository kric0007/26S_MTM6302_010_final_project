let currentBalance = 0;
let totalIncome = 0;
let totalExpenses = 0;
let allTransactions = [];
let transactions = [];
let selectedFilter = 'all';

const $currentBalance = document.querySelector('.balance span');
const $totalIncome = document.querySelector('.income span');
const $totalExpenses = document.querySelector('.expense span');
const $transactionsTable = document.getElementById('transactionsTable');

document.getElementById("date-input").valueAsDate = new Date();

// Load data from Local Storage first
const savedTransactions = localStorage.getItem("transactions");
if (savedTransactions) {
   allTransactions = JSON.parse(savedTransactions);
}

// Initial load
loadTransactions(selectedFilter);
loadBalances();

function loadBalances() {
   totalExpenses = 0;
   totalIncome = 0;
   currentBalance = 0;

   for (const transaction of allTransactions) {
      if (transaction.isExpense) {
         totalExpenses += transaction.amount;
      } else {
         totalIncome += transaction.amount;
      }
   }

   currentBalance = totalIncome - totalExpenses;

   $currentBalance.textContent = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(currentBalance);
   $totalIncome.textContent = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(totalIncome);
   $totalExpenses.textContent = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(totalExpenses);
}

function loadTransactions(filter) {
   // Sort treats the strings as local midnight timestamps for clean chronological sorting
   allTransactions.sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`));

   // Filter all transactions and keep the filtered ones in a new different array
   transactions = filterBy(filter);

   if (transactions.length > 0) {
      // Appended local midnight safely so the calculated max/min ranges don't drop a day
      const minDate = new Date(Math.min(...transactions.map(item => new Date(`${item.date}T00:00:00`))));
      const minMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(minDate);

      const maxDate = new Date(Math.max(...transactions.map(item => new Date(`${item.date}T00:00:00`))));
      const maxMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(maxDate);

      document.getElementById("transaction-subtitle").textContent = `${minMonth} ${minDate.getFullYear()}- ${maxMonth} ${maxDate.getFullYear()}`;
   } else {
      document.getElementById("transaction-subtitle").textContent = '';
   }

   loadTable();
}

function loadTable() {
   $transactionsTable.innerHTML = '';
   let tableRowsHtml = '';

   if (transactions.length > 0) {
      for (const transaction of transactions) {
         const typeLabel = transaction.isExpense ? 'Expense' : 'Income';
         const badgeClass = transaction.isExpense ? 'alert-danger' : 'alert-success';
         const sign = transaction.isExpense ? '-' : '+';
         const formattedAmount = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(transaction.amount);

         tableRowsHtml += `
            <tr>
               <th class="fw-normal" scope="row">${formatDate(transaction.date)}</th>
               <td>${transaction.description}</td>
               <td><span class="alert border-0 ${badgeClass} px-2 py-1">${typeLabel}</span></td>
               <td>${sign} ${formattedAmount}</td>
               <td>
                  <button class="btn btn-danger btn-sm show-on-hover delete-btn" data-id="${transaction.id}">
                     <i class="bi bi-trash"></i>
                  </button>
               </td>
            </tr>`;
      }
      $transactionsTable.innerHTML = tableRowsHtml;
      setDeleteButtons();
   } else {
      $transactionsTable.innerHTML = '<tr><td class="text-center" colspan="5">No transactions found.</td></tr>';
   }
}

function formatDate(date) {
   // Formats as local time to prevent the display from lagging 1 day behind
   const localDate = new Date(`${date}T00:00:00`);

   const standardFormat = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
   }).format(localDate);

   return standardFormat.replace(' ', '');
}

function setDeleteButtons() {
   const deleteButtons = document.querySelectorAll('.delete-btn');

   deleteButtons.forEach(function (button) {
      button.addEventListener('click', function (e) {
         const confirmDelete = confirm("Are you sure you want to delete this transaction?");

         // If user cancels
         if (!confirmDelete) {
            // Do nothing.
            return;
         }

         const transactionId = Number(button.getAttribute('data-id'));
         allTransactions = allTransactions.filter(t => t.id !== transactionId);

         localStorage.setItem("transactions", JSON.stringify(allTransactions));

         loadTransactions(selectedFilter);
         loadBalances();
      });
   });
}

document.getElementById("form").addEventListener('submit', function (e) {
   e.preventDefault();
   const amount = document.getElementById("amount-input").value;
   const date = document.getElementById("date-input").value;

   const newTransaction = {
      id: Date.now(),
      description: document.getElementById("description-input").value,
      amount: parseFloat(amount),
      isExpense: document.getElementById("btnradio2").checked,
      date: date // Saved as raw YYYY-MM-DD string to avoid timezone parsing variations
   }

   allTransactions.push(newTransaction);
   localStorage.setItem("transactions", JSON.stringify(allTransactions));

   loadTransactions(selectedFilter);
   loadBalances();

   e.target.reset(); // Clear the form
   document.getElementById("date-input").valueAsDate = new Date();
});

const filterRadioButtons = document.getElementsByName('filter-radio');

filterRadioButtons.forEach(function (radio) {
   radio.addEventListener('click', function (event) {
      selectedFilter = event.target.value;
      loadTransactions(selectedFilter);
   });
});

function filterBy(type) {
   // Check if we should also filter by text through the search bar
   const searchText = document.querySelector(".search-input").value.toLowerCase();

   return allTransactions.filter(function (t) {
      // Check if the description string includes the searched text
      const matchesText = t.description.toLowerCase().includes(searchText);

      if (type === "income") {
         return !t.isExpense && matchesText;
      } else if (type === "expense") {
         return t.isExpense && matchesText;
      } else {
         return matchesText;
      }
   });
}

document.getElementById("search-form").addEventListener('submit', function (e) {
   // Avoid refreshing the page when the enter key is pressed
   e.preventDefault();
});

document.querySelector(".search-input").addEventListener('input', function (e) {
   loadTransactions(selectedFilter);
});
