const categories = {
  expense: [
    { id: 'food', name: 'Yemek', icon: '🍔' },
    { id: 'transport', name: 'Ulaşım', icon: '🚌' },
    { id: 'education', name: 'Eğitim', icon: '📚' },
    { id: 'entertainment', name: 'Eğlence', icon: '🎬' },
    { id: 'shopping', name: 'Alışveriş', icon: '🛍️' },
    { id: 'health', name: 'Sağlık', icon: '💊' },
    { id: 'rent', name: 'Kira', icon: '🏠' },
    { id: 'bills', name: 'Faturalar', icon: '💡' },
    { id: 'other-expense', name: 'Diğer', icon: '📌' }
  ],
  income: [
    { id: 'allowance', name: 'Harçlık', icon: '💵' },
    { id: 'scholarship', name: 'Burs', icon: '🎓' },
    { id: 'part-time', name: 'Yarı Zamanlı İş', icon: '💼' },
    { id: 'freelance', name: 'Freelance', icon: '💻' },
    { id: 'gift', name: 'Hediye', icon: '🎁' },
    { id: 'other-income', name: 'Diğer', icon: '📌' }
  ]
};

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgetGoals = JSON.parse(localStorage.getItem('budgetGoals')) || [];
let expenseChart = null;

const form = document.getElementById('transactionForm');
const typeInput = document.getElementById('type');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const transactionsList = document.getElementById('transactionsList');
const filterCategory = document.getElementById('filterCategory');
const filterMonth = document.getElementById('filterMonth');
const themeToggle = document.getElementById('themeToggle');
const goalModal = document.getElementById('goalModal');
const addGoalBtn = document.getElementById('addGoalBtn');
const closeModal = document.getElementById('closeModal');
const goalForm = document.getElementById('goalForm');

dateInput.valueAsDate = new Date();

function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateStr));
}

function updateCategories() {
  const type = typeInput.value;
  const selectedCategory = categorySelect.value;
  categorySelect.innerHTML = '<option value="">Kategori Seçin</option>';
  categories[type].forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = `${cat.icon} ${cat.name}`;
    categorySelect.appendChild(option);
  });
  if (categories[type].some(c => c.id === selectedCategory)) {
    categorySelect.value = selectedCategory;
  }
}

function updateFilterCategories() {
  const currentValue = filterCategory.value;
  filterCategory.innerHTML = '<option value="all">Tüm Kategoriler</option>';
  const allCategories = [...categories.expense, ...categories.income];
  allCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = `${cat.icon} ${cat.name}`;
    filterCategory.appendChild(option);
  });
  filterCategory.value = currentValue;
}

function updateFilterMonths() {
  const currentValue = filterMonth.value;
  filterMonth.innerHTML = '<option value="all">Tüm Aylar</option>';
  const months = new Set();
  transactions.forEach(t => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.add(key);
  });
  const sortedMonths = Array.from(months).sort().reverse();
  sortedMonths.forEach(month => {
    const [year, monthNum] = month.split('-');
    const option = document.createElement('option');
    option.value = month;
    option.textContent = new Date(year, monthNum - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    filterMonth.appendChild(option);
  });
  filterMonth.value = currentValue;
}

function getCategoryInfo(categoryId) {
  const allCategories = [...categories.expense, ...categories.income];
  return allCategories.find(c => c.id === categoryId) || { name: 'Diğer', icon: '📌' };
}

function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function saveBudgetGoals() {
  localStorage.setItem('budgetGoals', JSON.stringify(budgetGoals));
}

function updateSummary() {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  document.getElementById('totalBalance').textContent = formatCurrency(balance);
  document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
  document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
}

function getFilteredTransactions() {
  let filtered = [...transactions];
  const catFilter = filterCategory.value;
  const monthFilter = filterMonth.value;

  if (catFilter !== 'all') {
    filtered = filtered.filter(t => t.category === catFilter);
  }

  if (monthFilter !== 'all') {
    filtered = filtered.filter(t => t.date.startsWith(monthFilter));
  }

  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderTransactions() {
  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    transactionsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📝</span>
        <p>Henüz işlem yok</p>
        <span class="empty-sub">İlk işleminizi ekleyin!</span>
      </div>
    `;
    return;
  }

  transactionsList.innerHTML = filtered.map(t => {
    const catInfo = getCategoryInfo(t.category);
    const sign = t.type === 'income' ? '+' : '-';
    return `
      <div class="transaction-item ${t.type}" data-id="${t.id}">
        <div class="transaction-icon">${catInfo.icon}</div>
        <div class="transaction-info">
          <div class="transaction-description">${t.description}</div>
          <div class="transaction-meta">
            <span class="transaction-category">${catInfo.name}</span>
            <span>${formatDate(t.date)}</span>
          </div>
        </div>
        <div class="transaction-amount">${sign}${formatCurrency(t.amount)}</div>
        <button class="transaction-delete" onclick="deleteTransaction('${t.id}')">&times;</button>
      </div>
    `;
  }).join('');
}

function updateChart() {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const categoryTotals = {};

  expenseTransactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const labels = [];
  const data = [];
  const colors = [
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
    '#f43f5e', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
  ];

  Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([categoryId, amount], index) => {
      const catInfo = getCategoryInfo(categoryId);
      labels.push(`${catInfo.icon} ${catInfo.name}`);
      data.push(amount);
    });

  if (expenseChart) {
    expenseChart.destroy();
  }

  const ctx = document.getElementById('expenseChart').getContext('2d');

  if (data.length === 0) {
    expenseChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Veri yok'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(156, 163, 175, 0.3)'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') }
          }
        }
      }
    });
    return;
  }

  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((context.parsed / total) * 100).toFixed(1);
              return ` ${formatCurrency(context.parsed)} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

function renderBudgetGoals() {
  const container = document.getElementById('budgetGoals');
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  if (budgetGoals.length === 0) {
    container.innerHTML = `
      <div class="empty-state small">
        <p>Kategori bazlı bütçe hedefi ekleyin</p>
      </div>
    `;
    return;
  }

  container.innerHTML = budgetGoals.map(goal => {
    const catInfo = getCategoryInfo(goal.category);
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === goal.category && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const percent = Math.round((spent / goal.amount) * 100);
    const isOver = percent > 100;

    return `
      <div class="goal-item">
        <div class="goal-header">
          <span class="goal-name">${catInfo.icon} ${catInfo.name}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="goal-amounts">${formatCurrency(spent)} / ${formatCurrency(goal.amount)}</span>
            <button class="goal-delete" onclick="deleteGoal('${goal.id}')">&times;</button>
          </div>
        </div>
        <div class="goal-bar">
          <div class="goal-progress ${isOver ? 'over' : ''}" style="width: ${Math.min(percent, 100)}%"></div>
        </div>
        <div class="goal-percent">${percent}% kullanıldı</div>
      </div>
    `;
  }).join('');
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  updateAll();
}

function deleteGoal(id) {
  budgetGoals = budgetGoals.filter(g => g.id !== id);
  saveBudgetGoals();
  updateAll();
}

function updateAll() {
  updateSummary();
  renderTransactions();
  updateChart();
  renderBudgetGoals();
  updateFilterMonths();
}

toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    typeInput.value = btn.dataset.type;
    updateCategories();
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const transaction = {
    id: Date.now().toString(),
    type: typeInput.value,
    description: descriptionInput.value.trim(),
    amount: parseFloat(amountInput.value),
    category: categorySelect.value,
    date: dateInput.value
  };

  transactions.push(transaction);
  saveTransactions();
  updateAll();

  form.reset();
  dateInput.valueAsDate = new Date();
  updateCategories();
});

filterCategory.addEventListener('change', renderTransactions);
filterMonth.addEventListener('change', renderTransactions);

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  themeToggle.textContent = isDark ? '🌙' : '☀️';
  updateChart();
});

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

addGoalBtn.addEventListener('click', () => {
  const goalCategorySelect = document.getElementById('goalCategory');
  goalCategorySelect.innerHTML = '<option value="">Kategori Seçin</option>';
  categories.expense.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = `${cat.icon} ${cat.name}`;
    goalCategorySelect.appendChild(option);
  });
  goalModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
  goalModal.classList.add('hidden');
});

goalModal.addEventListener('click', (e) => {
  if (e.target === goalModal) {
    goalModal.classList.add('hidden');
  }
});

goalForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const categoryId = document.getElementById('goalCategory').value;
  const amount = parseFloat(document.getElementById('goalAmount').value);

  const existingGoalIndex = budgetGoals.findIndex(g => g.category === categoryId);
  if (existingGoalIndex !== -1) {
    budgetGoals[existingGoalIndex].amount = amount;
  } else {
    budgetGoals.push({
      id: Date.now().toString(),
      category: categoryId,
      amount
    });
  }

  saveBudgetGoals();
  updateAll();
  goalModal.classList.add('hidden');
  goalForm.reset();
});

updateCategories();
updateFilterCategories();
updateAll();
