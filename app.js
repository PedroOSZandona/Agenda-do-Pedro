(() => {
  'use strict';

  const STORAGE_KEY = 'agenda_financas_app_v1';
  const CLOUD_CONFIG_KEY = 'agenda_financas_cloud_v1';
  const GIST_FILENAME = 'agenda_financas_data.json';

  const PAYMENT_LABELS = {
    card: 'Cartão de Crédito',
    pix: 'Pix',
    debit: 'Débito',
    cash: 'Dinheiro',
    boleto: 'Boleto / Conta'
  };

  const SCOPE_LABELS = {
    pessoal: 'Pessoal',
    trabalho: 'Trabalho'
  };

  const PRIORITY_LABELS = {
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa'
  };

  const MONTH_NAMES_PT = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const WEEKDAY_NAMES_PT = [
    'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
    'quinta-feira', 'sexta-feira', 'sábado'
  ];

  // Utilitários de Data e Formatação
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function getTodayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function getCurrentMonthISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }

  function parseYearMonth(ym) {
    const [y, m] = ym.split('-').map(Number);
    return { year: y, month: m };
  }

  function addMonthsToYM(ym, delta) {
    const { year, month } = parseYearMonth(ym);
    const totalMonths = year * 12 + (month - 1) + delta;
    const newYear = Math.floor(totalMonths / 12);
    const newMonth = (totalMonths % 12) + 1;
    return `${newYear}-${pad2(newMonth)}`;
  }

  function addDaysToISO(isoDate, deltaDays) {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d + deltaDays);
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  }

  function diffMonths(ymStart, ymTarget) {
    const s = parseYearMonth(ymStart);
    const t = parseYearMonth(ymTarget);
    return (t.year - s.year) * 12 + (t.month - s.month);
  }

  function daysInMonth(year, month1Based) {
    return new Date(year, month1Based, 0).getDate();
  }

  function formatMonthLabel(ym) {
    const { year, month } = parseYearMonth(ym);
    return `${MONTH_NAMES_PT[month - 1]} ${year}`;
  }

  function formatShortMonthLabel(ym) {
    const { year, month } = parseYearMonth(ym);
    return `${MONTH_NAMES_PT[month - 1].slice(0, 3)}/${String(year).slice(2)}`;
  }

  function formatDateBR(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatFullDayTitle(isoDate) {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const wd = WEEKDAY_NAMES_PT[dt.getDay()];
    return `${wd}, ${d} de ${MONTH_NAMES_PT[m - 1]} de ${y}`;
  }

  function formatBRL(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  // Geração de Dados Iniciais Realistas
  function createSeedData() {
    const today = getTodayISO();
    const curMonth = getCurrentMonthISO();
    const prevMonth1 = addMonthsToYM(curMonth, -1);
    const prevMonth2 = addMonthsToYM(curMonth, -2);
    const [curYear, curM] = curMonth.split('-').map(Number);
    const maxD = daysInMonth(curYear, curM);
    const dayStr = (d) => `${curMonth}-${pad2(Math.min(d, maxD))}`;
    const prevMonthDayStr = (ym, d) => {
      const { year, month } = parseYearMonth(ym);
      return `${ym}-${pad2(Math.min(d, daysInMonth(year, month)))}`;
    };

    const card1Id = 'card_nubank';
    const card2Id = 'card_itau';

    return {
      cards: [
        {
          id: card1Id,
          name: 'Nubank Principal',
          color: '#8b5cf6',
          limit: 6500,
          closingDay: 5,
          dueDay: 12,
          paidInvoices: []
        },
        {
          id: card2Id,
          name: 'Itaú Secundário',
          color: '#f97316',
          limit: 4000,
          closingDay: 18,
          dueDay: 25,
          paidInvoices: []
        }
      ],
      transactions: [
        {
          id: 'tx_sal_1',
          type: 'income',
          title: 'Salário Mensal',
          category: 'Salário / Renda',
          scope: 'pessoal',
          paymentMethod: 'pix',
          cardId: null,
          purchaseDate: dayStr(5),
          totalAmount: 5800,
          installmentCount: 1,
          installmentAmount: 5800,
          firstBillingMonth: curMonth,
          paidMonths: [curMonth],
          notes: 'Recebimento mensal principal'
        },
        {
          id: 'tx_freela_1',
          type: 'income',
          title: 'Renda Extra / Freelance',
          category: 'Salário / Renda',
          scope: 'pessoal',
          paymentMethod: 'pix',
          cardId: null,
          purchaseDate: dayStr(12),
          totalAmount: 950,
          installmentCount: 1,
          installmentAmount: 950,
          firstBillingMonth: curMonth,
          paidMonths: [curMonth],
          notes: ''
        },
        {
          id: 'tx_parc_1',
          type: 'expense',
          title: 'Notebook Novo',
          category: 'Compras',
          scope: 'pessoal',
          paymentMethod: 'card',
          cardId: card1Id,
          purchaseDate: prevMonthDayStr(prevMonth2, 10),
          totalAmount: 3600,
          installmentCount: 10,
          installmentAmount: 360,
          firstBillingMonth: prevMonth2,
          paidMonths: [],
          notes: 'Parcelado em 10x sem juros'
        },
        {
          id: 'tx_parc_2',
          type: 'expense',
          title: 'Tênis de Corrida',
          category: 'Compras',
          scope: 'pessoal',
          paymentMethod: 'card',
          cardId: card1Id,
          purchaseDate: prevMonthDayStr(prevMonth1, 14),
          totalAmount: 600,
          installmentCount: 4,
          installmentAmount: 150,
          firstBillingMonth: prevMonth1,
          paidMonths: [],
          notes: 'Loja esportiva'
        },
        {
          id: 'tx_card_avista_1',
          type: 'expense',
          title: 'Supermercado do Mês',
          category: 'Alimentação',
          scope: 'pessoal',
          paymentMethod: 'card',
          cardId: card1Id,
          purchaseDate: today,
          totalAmount: 485.9,
          installmentCount: 1,
          installmentAmount: 485.9,
          firstBillingMonth: curMonth,
          paidMonths: [],
          notes: 'Compras da semana'
        },
        {
          id: 'tx_card_2',
          type: 'expense',
          title: 'Assinaturas & Streaming',
          category: 'Lazer',
          scope: 'pessoal',
          paymentMethod: 'card',
          cardId: card2Id,
          purchaseDate: dayStr(8),
          totalAmount: 189,
          installmentCount: 1,
          installmentAmount: 189,
          firstBillingMonth: curMonth,
          paidMonths: [],
          notes: 'Assinaturas mensais'
        },
        {
          id: 'tx_card_3',
          type: 'expense',
          title: 'Cadeira Ergonômica',
          category: 'Compras',
          scope: 'pessoal',
          paymentMethod: 'card',
          cardId: card2Id,
          purchaseDate: prevMonthDayStr(prevMonth1, 20),
          totalAmount: 1200,
          installmentCount: 6,
          installmentAmount: 200,
          firstBillingMonth: curMonth,
          paidMonths: [],
          notes: 'Compra após fechamento entrou neste mês'
        },
        {
          id: 'tx_other_1',
          type: 'expense',
          title: 'Aluguel + Condomínio',
          category: 'Moradia & Contas',
          scope: 'pessoal',
          paymentMethod: 'boleto',
          cardId: null,
          purchaseDate: dayStr(10),
          totalAmount: 1650,
          installmentCount: 1,
          installmentAmount: 1650,
          firstBillingMonth: curMonth,
          paidMonths: [curMonth],
          notes: 'Vencimento dia 10'
        },
        {
          id: 'tx_other_2',
          type: 'expense',
          title: 'Almoço e Café',
          category: 'Alimentação',
          scope: 'pessoal',
          paymentMethod: 'pix',
          cardId: null,
          purchaseDate: today,
          totalAmount: 42.5,
          installmentCount: 1,
          installmentAmount: 42.5,
          firstBillingMonth: curMonth,
          paidMonths: [curMonth],
          notes: 'Pago via Pix'
        },
        {
          id: 'tx_other_3',
          type: 'expense',
          title: 'Combustível',
          category: 'Transporte',
          scope: 'pessoal',
          paymentMethod: 'debit',
          cardId: null,
          purchaseDate: dayStr(15),
          totalAmount: 180,
          installmentCount: 1,
          installmentAmount: 180,
          firstBillingMonth: curMonth,
          paidMonths: [curMonth],
          notes: 'Posto bairro'
        }
      ],
      agendaItems: [
        {
          id: 'ag_1',
          title: 'Reunião de alinhamento semanal',
          date: today,
          itemType: 'event',
          scope: 'trabalho',
          startTime: '09:00',
          endTime: '10:00',
          priority: 'alta',
          completed: false,
          notes: 'Revisar entregas da semana'
        },
        {
          id: 'ag_2',
          title: 'Bloco focado: Relatório mensal',
          date: today,
          itemType: 'event',
          scope: 'trabalho',
          startTime: '14:00',
          endTime: '16:00',
          priority: 'media',
          completed: false,
          notes: ''
        },
        {
          id: 'ag_3',
          title: 'Academia / Treino',
          date: today,
          itemType: 'event',
          scope: 'pessoal',
          startTime: '18:30',
          endTime: '19:30',
          priority: 'media',
          completed: false,
          notes: ''
        },
        {
          id: 'ag_4',
          title: 'Conferir faturas dos cartões do mês',
          date: today,
          itemType: 'task',
          scope: 'pessoal',
          startTime: '',
          endTime: '',
          priority: 'alta',
          completed: false,
          notes: ''
        },
        {
          id: 'ag_5',
          title: 'Enviar proposta para cliente',
          date: today,
          itemType: 'task',
          scope: 'trabalho',
          startTime: '',
          endTime: '',
          priority: 'alta',
          completed: true,
          notes: ''
        },
        {
          id: 'ag_6',
          title: 'Consulta Dentista',
          date: dayStr(22),
          itemType: 'event',
          scope: 'pessoal',
          startTime: '10:00',
          endTime: '11:00',
          priority: 'media',
          completed: false,
          notes: 'Clínica centro'
        }
      ]
    };
  }

  // Estado da Aplicação
  const uiState = {
    activeTab: 'overview',
    selectedMonth: getCurrentMonthISO(),
    selectedDate: getTodayISO(),
    overviewAgendaScope: 'all',
    overviewTxTab: 'out',
    agendaScope: 'all',
    agendaStartDate: '',
    agendaEndDate: '',
    showEarlyHours: false,
    financeDirection: 'out',
    financeTypeFilter: 'all',
    financeCardFilter: 'all',
    financeSearch: '',
    billingMonthManuallyEdited: false
  };

  let appData = loadData();
  let cloudConfig = loadCloudConfig();
  const cloudRuntime = {
    isSyncing: false,
    pendingPushTimer: null,
    pollIntervalId: null,
    status: cloudConfig.enabled ? 'connected' : 'disconnected',
    lastError: ''
  };

  function loadCloudConfig() {
    const defaults = {
      enabled: false,
      provider: 'github',
      githubToken: '',
      gistId: '',
      firebaseUrl: '',
      firebaseKey: '',
      lastSyncedAt: 0
    };
    try {
      const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch (err) {
      return defaults;
    }
  }

  function saveCloudConfig() {
    try {
      localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(cloudConfig));
    } catch (err) {
      console.error('Erro ao salvar config da nuvem:', err);
    }
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = { ...createSeedData(), updatedAt: 0 };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw);
      return {
        cards: Array.isArray(parsed.cards) ? parsed.cards : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        agendaItems: Array.isArray(parsed.agendaItems) ? parsed.agendaItems : [],
        updatedAt: Number(parsed.updatedAt) || 0
      };
    } catch (err) {
      console.error('Erro ao carregar localStorage:', err);
      return { ...createSeedData(), updatedAt: 0 };
    }
  }

  function saveData(options = { sync: true }) {
    try {
      if (options.sync !== false) {
        appData.updatedAt = Date.now();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
      if (options.sync !== false && cloudConfig.enabled) {
        scheduleCloudPush();
      }
    } catch (err) {
      console.error('Erro ao salvar localStorage:', err);
      showToast('Erro ao salvar dados no navegador.', 'error');
    }
  }

  // Toast
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 3200);
  }

  // Motor de Cálculo Financeiro
  function getCardById(cardId) {
    return appData.cards.find((c) => c.id === cardId) || null;
  }

  /**
   * Retorna todos os lançamentos ativos no mês `yearMonth` com metadata da parcela.
   */
  function getMonthTransactions(yearMonth) {
    const results = [];
    for (const tx of appData.transactions) {
      const n = Math.max(1, Number(tx.installmentCount) || 1);
      const startYM = tx.firstBillingMonth || (tx.purchaseDate ? tx.purchaseDate.slice(0, 7) : yearMonth);
      const diff = diffMonths(startYM, yearMonth);
      if (diff >= 0 && diff < n) {
        const currentInstallment = diff + 1;
        const remainingInstallments = n - currentInstallment;
        const installmentAmount = roundMoney(tx.installmentAmount || (tx.totalAmount / n));
        results.push({
          ...tx,
          currentInstallment,
          installmentCount: n,
          remainingInstallments,
          remainingAmount: roundMoney(remainingInstallments * installmentAmount),
          monthAmount: installmentAmount,
          isInstallment: n > 1
        });
      }
    }
    return results.sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''));
  }

  function getMonthSummary(yearMonth) {
    const items = getMonthTransactions(yearMonth);
    let totalIncome = 0;
    let totalCard = 0;
    let totalCardInstallments = 0;
    let totalCardOneTime = 0;
    let totalOtherExpenses = 0;

    for (const item of items) {
      if (item.type === 'income') {
        totalIncome += item.monthAmount;
      } else if (item.paymentMethod === 'card') {
        totalCard += item.monthAmount;
        if (item.isInstallment) {
          totalCardInstallments += item.monthAmount;
        } else {
          totalCardOneTime += item.monthAmount;
        }
      } else {
        totalOtherExpenses += item.monthAmount;
      }
    }

    totalIncome = roundMoney(totalIncome);
    totalCard = roundMoney(totalCard);
    totalCardInstallments = roundMoney(totalCardInstallments);
    totalCardOneTime = roundMoney(totalCardOneTime);
    totalOtherExpenses = roundMoney(totalOtherExpenses);
    const totalExpenses = roundMoney(totalCard + totalOtherExpenses);
    const freeBalance = roundMoney(totalIncome - totalExpenses);

    return {
      items,
      totalIncome,
      totalCard,
      totalCardInstallments,
      totalCardOneTime,
      totalOtherExpenses,
      totalExpenses,
      freeBalance
    };
  }

  function getCardInvoiceForMonth(cardId, yearMonth) {
    const items = getMonthTransactions(yearMonth).filter(
      (t) => t.type === 'expense' && t.paymentMethod === 'card' && t.cardId === cardId
    );
    let total = 0;
    let installmentsTotal = 0;
    let oneTimeTotal = 0;
    for (const item of items) {
      total += item.monthAmount;
      if (item.isInstallment) {
        installmentsTotal += item.monthAmount;
      } else {
        oneTimeTotal += item.monthAmount;
      }
    }
    const card = getCardById(cardId);
    const isPaid = Boolean(card && Array.isArray(card.paidInvoices) && card.paidInvoices.includes(yearMonth));
    return {
      items,
      total: roundMoney(total),
      installmentsTotal: roundMoney(installmentsTotal),
      oneTimeTotal: roundMoney(oneTimeTotal),
      isPaid
    };
  }

  /**
   * Calcula limite comprometido no cartão considerando todas as parcelas de faturas ainda não pagas.
   */
  function getCardCommittedLimit(card) {
    let committed = 0;
    const paidSet = new Set(Array.isArray(card.paidInvoices) ? card.paidInvoices : []);
    for (const tx of appData.transactions) {
      if (tx.type !== 'expense' || tx.paymentMethod !== 'card' || tx.cardId !== card.id) continue;
      const n = Math.max(1, Number(tx.installmentCount) || 1);
      const startYM = tx.firstBillingMonth || tx.purchaseDate.slice(0, 7);
      const instAmt = roundMoney(tx.installmentAmount || tx.totalAmount / n);
      for (let i = 0; i < n; i++) {
        const ym = addMonthsToYM(startYM, i);
        if (!paidSet.has(ym)) {
          committed += instAmt;
        }
      }
    }
    return roundMoney(committed);
  }

  function getSuggestedFirstBillingMonth(purchaseDate, paymentMethod, cardId) {
    if (!purchaseDate) return uiState.selectedMonth;
    const purchaseYM = purchaseDate.slice(0, 7);
    if (paymentMethod !== 'card' || !cardId) {
      return purchaseYM;
    }
    const card = getCardById(cardId);
    if (!card) return purchaseYM;
    const day = Number(purchaseDate.split('-')[2]);
    if (day >= Number(card.closingDay)) {
      return addMonthsToYM(purchaseYM, 1);
    }
    return purchaseYM;
  }

  // Navegação e Renderização Geral
  function renderAll() {
    document.getElementById('currentMonthLabel').textContent = formatMonthLabel(uiState.selectedMonth);
    populateCardFilterSelect();
    renderOverviewTab();
    renderAgendaTab();
    renderFinancesTab();
    renderCardsTab();
    const dayPopupEl = document.getElementById('dayPopupModalBackdrop');
    if (dayPopupEl && !dayPopupEl.classList.contains('hidden')) {
      renderDayPopupModal();
    }
  }

  function switchTab(tabName) {
    uiState.activeTab = tabName;
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });
  }

  function populateCardFilterSelect() {
    const select = document.getElementById('financeCardFilter');
    const prev = uiState.financeCardFilter;
    select.innerHTML = '<option value="all">Todos os Cartões</option>';
    for (const card of appData.cards) {
      const opt = document.createElement('option');
      opt.value = card.id;
      opt.textContent = card.name;
      select.appendChild(opt);
    }
    if (appData.cards.some((c) => c.id === prev) || prev === 'all') {
      select.value = prev;
    } else {
      uiState.financeCardFilter = 'all';
      select.value = 'all';
    }
  }

  // =========================================================================
  // BALANÇO VISUAL COMPARTILHADO (ENTROU VS SAIU)
  // =========================================================================
  function renderBalanceBannerHtml(ym, summary) {
    const maxRef = Math.max(summary.totalIncome, summary.totalExpenses, 1);
    const incomeBarPct = summary.totalIncome > 0 ? Math.round((summary.totalIncome / maxRef) * 100) : 0;
    const cardBarPct = summary.totalCard > 0 ? Math.round((summary.totalCard / maxRef) * 100) : 0;
    const otherBarPct = summary.totalOtherExpenses > 0 ? Math.round((summary.totalOtherExpenses / maxRef) * 100) : 0;
    const commitmentPct = summary.totalIncome > 0
      ? Math.round((summary.totalExpenses / summary.totalIncome) * 100)
      : (summary.totalExpenses > 0 ? 100 : 0);
    const isPositive = summary.freeBalance >= 0;

    return `
      <div class="balance-banner-header">
        <div>
          <h2>Balanço do Mês (${formatMonthLabel(ym)}) &mdash; Quanto Entrou vs. Quanto Saiu</h2>
          <p class="panel-subtitle">Comparativo direto entre suas entradas, faturas de cartão e outros gastos</p>
        </div>
        <span class="badge ${isPositive ? 'badge-paid' : 'badge-prio-alta'}">
          ${isPositive ? 'Saldo Positivo' : 'Gastos acima das Entradas'}
        </span>
      </div>

      <div class="balance-metrics-grid">
        <div class="balance-metric-box inflow">
          <span class="balance-metric-title">Quanto Entrou (Receitas)</span>
          <span class="balance-metric-value">+ ${formatBRL(summary.totalIncome)}</span>
          <span class="balance-metric-sub">Salário e entradas em ${formatShortMonthLabel(ym)}</span>
        </div>

        <div class="balance-metric-box outflow">
          <span class="balance-metric-title">Quanto Saiu (Total de Gastos)</span>
          <span class="balance-metric-value">- ${formatBRL(summary.totalExpenses)}</span>
          <span class="balance-metric-sub">Cartão: ${formatBRL(summary.totalCard)} &bull; Outros: ${formatBRL(summary.totalOtherExpenses)}</span>
        </div>

        <div class="balance-metric-box result ${isPositive ? 'positive' : 'negative'}">
          <span class="balance-metric-title">Resultado (Entrou &minus; Saiu)</span>
          <span class="balance-metric-value">${isPositive ? 'Sobrou' : 'Faltou'} ${formatBRL(Math.abs(summary.freeBalance))}</span>
          <span class="balance-metric-sub">Comprometido: ${commitmentPct}% do que entrou</span>
        </div>
      </div>

      <div class="balance-visual-bars">
        <div class="balance-bar-item">
          <div class="balance-bar-label">
            <span>Entradas</span>
            <span class="amount-income">+ ${formatBRL(summary.totalIncome)}</span>
          </div>
          <div class="dual-progress-track">
            <div class="dual-progress-segment" style="width:${incomeBarPct}%; background:var(--green);"></div>
          </div>
        </div>

        <div class="balance-bar-item">
          <div class="balance-bar-label">
            <span>Saídas (Roxo: Cartão &bull; Laranja: Outras Coisas)</span>
            <span style="color:var(--red-dark);">- ${formatBRL(summary.totalExpenses)}</span>
          </div>
          <div class="dual-progress-track">
            <div class="dual-progress-segment" style="width:${cardBarPct}%; background:var(--purple);" title="Cartão de Crédito: ${formatBRL(summary.totalCard)}"></div>
            <div class="dual-progress-segment" style="width:${otherBarPct}%; background:var(--orange);" title="Outras Coisas: ${formatBRL(summary.totalOtherExpenses)}"></div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // ABA 1: VISÃO GERAL
  // =========================================================================
  function renderOverviewTab() {
    const ym = uiState.selectedMonth;
    const summary = getMonthSummary(ym);
    const commitmentPct = summary.totalIncome > 0
      ? Math.min(100, Math.round((summary.totalExpenses / summary.totalIncome) * 100))
      : (summary.totalExpenses > 0 ? 100 : 0);

    document.getElementById('overviewCardsSubtitle').textContent = `Faturas referentes a ${formatMonthLabel(ym)}`;

    // 4 Cards de Resumo
    const cardsGrid = document.getElementById('overviewSummaryCards');
    const balanceNegative = summary.freeBalance < 0;
    cardsGrid.innerHTML = `
      <div class="stat-card income">
        <span class="stat-label">Receitas / Entradas no Mês</span>
        <span class="stat-value">${formatBRL(summary.totalIncome)}</span>
        <span class="stat-meta">Salário e ganhos em ${formatShortMonthLabel(ym)}</span>
      </div>
      <div class="stat-card card-bill">
        <span class="stat-label">Vou Pagar de Cartão</span>
        <span class="stat-value">${formatBRL(summary.totalCard)}</span>
        <span class="stat-meta">${formatBRL(summary.totalCardInstallments)} parcelado + ${formatBRL(summary.totalCardOneTime)} à vista</span>
      </div>
      <div class="stat-card other-exp">
        <span class="stat-label">Gastei com Outras Coisas</span>
        <span class="stat-value">${formatBRL(summary.totalOtherExpenses)}</span>
        <span class="stat-meta">Pix, Débito, Dinheiro e Contas/Boletos</span>
      </div>
      <div class="stat-card balance ${balanceNegative ? 'negative' : ''}">
        <span class="stat-label">Saldo Livre do Mês</span>
        <span class="stat-value">${formatBRL(summary.freeBalance)}</span>
        <span class="stat-meta">Comprometimento da renda: ${commitmentPct}%</span>
        <div class="progress-track">
          <div class="progress-fill" style="width:${commitmentPct}%; background:${balanceNegative ? 'var(--red)' : 'var(--primary)'};"></div>
        </div>
      </div>
    `;

    // Faturas dos cartões
    const invoicesContainer = document.getElementById('overviewCardInvoices');
    if (appData.cards.length === 0) {
      invoicesContainer.innerHTML = '<div class="empty-state">Nenhum cartão cadastrado ainda. Clique em "Gerenciar Cartões" para adicionar.</div>';
    } else {
      invoicesContainer.innerHTML = appData.cards.map((card) => {
        const inv = getCardInvoiceForMonth(card.id, ym);
        const committed = getCardCommittedLimit(card);
        const limitPct = card.limit > 0 ? Math.min(100, Math.round((committed / card.limit) * 100)) : 0;
        const { year, month } = parseYearMonth(ym);
        const maxD = daysInMonth(year, month);
        const dueStr = `${pad2(Math.min(card.dueDay, maxD))}/${pad2(month)}`;
        return `
          <div class="mini-card-invoice" style="border-left-color: ${escapeHtml(card.color)};">
            <div class="mini-card-top">
              <div class="mini-card-name">
                <span>${escapeHtml(card.name)}</span>
                <span class="badge ${inv.isPaid ? 'badge-paid' : 'badge-open'}">${inv.isPaid ? 'Fatura Paga' : 'Aberta'}</span>
              </div>
              <div class="mini-card-amount amount-card">${formatBRL(inv.total)}</div>
            </div>
            <div class="mini-card-meta">
              <span>Fecha dia ${card.closingDay} &bull; Vence em ${dueStr}</span>
              <span>${inv.items.length} lançamento(s)</span>
            </div>
            <div class="mini-card-meta">
              <span>Parcelas: ${formatBRL(inv.installmentsTotal)} &bull; À vista: ${formatBRL(inv.oneTimeTotal)}</span>
              <span>Limite em uso: ${limitPct}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${limitPct}%; background:${escapeHtml(card.color)};"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Compras parceladas ativas
    const installmentsContainer = document.getElementById('overviewInstallmentsList');
    const activeInstallments = summary.items.filter((t) => t.type === 'expense' && t.isInstallment);
    if (activeInstallments.length === 0) {
      installmentsContainer.innerHTML = '<div class="empty-state">Nenhuma compra parcelada cobrada neste mês.</div>';
    } else {
      installmentsContainer.innerHTML = activeInstallments.slice(0, 6).map((item) => {
        const card = item.cardId ? getCardById(item.cardId) : null;
        const payLabel = card ? card.name : PAYMENT_LABELS[item.paymentMethod];
        return `
          <div class="item-row">
            <div class="item-row-main">
              <div class="item-row-title">
                <span>${escapeHtml(item.title)}</span>
                <span class="badge badge-installment">Parcela ${item.currentInstallment}/${item.installmentCount}</span>
              </div>
              <div class="item-row-sub">
                <span>${escapeHtml(payLabel)}</span>
                <span>&bull; Total: ${formatBRL(item.totalAmount)}</span>
                <span>&bull; ${item.remainingInstallments === 0 ? 'Última parcela!' : `Faltam ${item.remainingInstallments} (${formatBRL(item.remainingAmount)})`}</span>
              </div>
            </div>
            <div class="item-row-amount amount-card">${formatBRL(item.monthAmount)}</div>
          </div>
        `;
      }).join('');
    }

    // Agenda do Dia Selecionado
    const todayISO = getTodayISO();
    const isToday = uiState.selectedDate === todayISO;
    document.getElementById('overviewAgendaTitle').textContent = isToday
      ? 'Minha Agenda de Hoje'
      : `Agenda de ${formatDateBR(uiState.selectedDate)}`;
    document.getElementById('overviewAgendaSubtitle').textContent = formatFullDayTitle(uiState.selectedDate);
    document.getElementById('overviewDayNavLabel').textContent = isToday
      ? 'Hoje'
      : formatDateBR(uiState.selectedDate);

    const agendaContainer = document.getElementById('overviewAgendaList');
    const dayAgenda = appData.agendaItems
      .filter((a) => a.date === uiState.selectedDate)
      .filter((a) => uiState.overviewAgendaScope === 'all' || a.scope === uiState.overviewAgendaScope)
      .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));

    if (dayAgenda.length === 0) {
      agendaContainer.innerHTML = '<div class="empty-state">Sem compromissos ou tarefas para este filtro neste dia.</div>';
    } else {
      agendaContainer.innerHTML = dayAgenda.map((item) => `
        <div class="task-row">
          <input type="checkbox" class="task-checkbox" data-toggle-agenda="${escapeHtml(item.id)}" ${item.completed ? 'checked' : ''} aria-label="Concluir ${escapeHtml(item.title)}">
          <div class="task-content">
            <div class="item-row-title ${item.completed ? 'completed-text' : ''}">
              <span>${escapeHtml(item.title)}</span>
              <span class="badge badge-${item.scope}">${SCOPE_LABELS[item.scope]}</span>
            </div>
            <div class="item-row-sub">
              <span>${item.itemType === 'event' && item.startTime ? `🕒 ${item.startTime}${item.endTime ? ' - ' + item.endTime : ''}` : '☑️ Tarefa'}</span>
              <span class="badge badge-prio-${item.priority}">${PRIORITY_LABELS[item.priority]}</span>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-ghost" data-edit-agenda="${escapeHtml(item.id)}">Editar</button>
        </div>
      `).join('');
    }

    // Movimentações do Mês (Abas O que Saiu / O que Entrou)
    const recentContainer = document.getElementById('overviewRecentExpenses');
    document.querySelectorAll('#overviewTxTabSwitch .seg-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.overviewTxTab === uiState.overviewTxTab);
    });
    const isShowingIn = uiState.overviewTxTab === 'in';
    const filteredOverviewTx = summary.items.filter((t) => (isShowingIn ? t.type === 'income' : t.type === 'expense'));

    if (filteredOverviewTx.length === 0) {
      recentContainer.innerHTML = isShowingIn
        ? '<div class="empty-state">Nenhuma entrada/receita registrada para este mês.</div>'
        : '<div class="empty-state">Nenhum gasto registrado para este mês.</div>';
    } else {
      recentContainer.innerHTML = filteredOverviewTx.slice(0, 6).map((item) => {
        const isCard = item.paymentMethod === 'card';
        const card = item.cardId ? getCardById(item.cardId) : null;
        return `
          <div class="item-row">
            <div class="item-row-main">
              <div class="item-row-title">
                <span>${escapeHtml(item.title)}</span>
                <span class="badge ${item.type === 'income' ? 'badge-income' : (isCard ? 'badge-card' : 'badge-other')}">${isCard ? escapeHtml(card ? card.name : 'Cartão') : PAYMENT_LABELS[item.paymentMethod]}</span>
                ${item.isInstallment ? `<span class="badge badge-installment">${item.currentInstallment}/${item.installmentCount}</span>` : ''}
              </div>
              <div class="item-row-sub">
                <span>Data: ${formatDateBR(item.purchaseDate)}</span>
                <span>&bull; ${escapeHtml(item.category)}</span>
              </div>
            </div>
            <div class="item-row-amount ${item.type === 'income' ? 'amount-income' : (isCard ? 'amount-card' : 'amount-expense')}">${item.type === 'income' ? '+' : ''}${formatBRL(item.monthAmount)}</div>
          </div>
        `;
      }).join('');
    }
  }

  // =========================================================================
  // ABA 2: AGENDA & DIA
  // =========================================================================
  function getNormalizedAgendaRange() {
    const s = uiState.agendaStartDate;
    const e = uiState.agendaEndDate;
    if (!s && !e) return null;
    if (s && e && s > e) return { start: e, end: s };
    return { start: s, end: e };
  }

  function renderAgendaTab() {
    renderAgendaRangeResults();
    renderCalendarGrid();
    renderSelectedDayPanel();
  }

  function renderAgendaRangeResults() {
    const range = getNormalizedAgendaRange();
    const card = document.getElementById('agendaRangeResultsCard');
    const clearBtn = document.getElementById('btnClearAgendaRange');

    if (!range) {
      card.classList.add('hidden');
      clearBtn.classList.add('hidden');
      return;
    }

    clearBtn.classList.remove('hidden');
    card.classList.remove('hidden');

    const subtitleEl = document.getElementById('agendaRangeSubtitle');
    if (range.start && range.end) {
      subtitleEl.textContent = `De ${formatDateBR(range.start)} até ${formatDateBR(range.end)}`;
    } else if (range.start) {
      subtitleEl.textContent = `A partir de ${formatDateBR(range.start)}`;
    } else {
      subtitleEl.textContent = `Até ${formatDateBR(range.end)}`;
    }

    const items = appData.agendaItems
      .filter((a) => uiState.agendaScope === 'all' || a.scope === uiState.agendaScope)
      .filter((a) => (!range.start || a.date >= range.start) && (!range.end || a.date <= range.end))
      .sort((a, b) => {
        const cmpDate = a.date.localeCompare(b.date);
        if (cmpDate !== 0) return cmpDate;
        return (a.startTime || '99:99').localeCompare(b.startTime || '99:99');
      });

    const listEl = document.getElementById('agendaRangeList');
    if (items.length === 0) {
      listEl.innerHTML = '<div class="empty-state">Nenhum compromisso ou tarefa encontrado neste período.</div>';
      return;
    }

    listEl.innerHTML = items.map((item) => `
      <div class="task-row">
        <input type="checkbox" class="task-checkbox" data-toggle-agenda="${escapeHtml(item.id)}" ${item.completed ? 'checked' : ''} aria-label="Marcar ${escapeHtml(item.title)}">
        <div class="task-content">
          <div class="item-row-title ${item.completed ? 'completed-text' : ''}">
            <span>${escapeHtml(item.title)}</span>
            <span class="badge badge-${item.scope}">${SCOPE_LABELS[item.scope]}</span>
            <span class="badge badge-prio-${item.priority}">${PRIORITY_LABELS[item.priority]}</span>
          </div>
          <div class="item-row-sub">
            <button type="button" class="btn btn-sm btn-ghost" style="padding:1px 6px;" data-select-date="${escapeHtml(item.date)}">📅 ${formatDateBR(item.date)}</button>
            <span>${item.itemType === 'event' && item.startTime ? `🕒 ${item.startTime}${item.endTime ? ' - ' + item.endTime : ''}` : '☑️ Tarefa'}</span>
          </div>
        </div>
        <div class="task-actions">
          <button type="button" class="btn btn-sm btn-ghost" data-edit-agenda="${escapeHtml(item.id)}">Editar</button>
          <button type="button" class="btn btn-sm btn-ghost" data-delete-agenda="${escapeHtml(item.id)}" title="Excluir">&times;</button>
        </div>
      </div>
    `).join('');
  }

  function renderCalendarGrid() {
    const ym = uiState.selectedMonth;
    const { year, month } = parseYearMonth(ym);
    document.getElementById('calendarTitle').textContent = formatMonthLabel(ym);

    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const totalDays = daysInMonth(year, month);
    const prevYM = addMonthsToYM(ym, -1);
    const prevParsed = parseYearMonth(prevYM);
    const prevTotalDays = daysInMonth(prevParsed.year, prevParsed.month);
    const nextYM = addMonthsToYM(ym, 1);

    const todayISO = getTodayISO();
    const range = getNormalizedAgendaRange();

    // Pré-indexar vencimentos de faturas neste mês
    const dueCardsByDay = {};
    for (const card of appData.cards) {
      const clampedDue = Math.min(Number(card.dueDay), totalDays);
      if (!dueCardsByDay[clampedDue]) dueCardsByDay[clampedDue] = [];
      dueCardsByDay[clampedDue].push(card);
    }

    const cells = [];
    // Dias do mês anterior
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const d = prevTotalDays - i;
      const iso = `${prevYM}-${pad2(d)}`;
      cells.push({ iso, day: d, isCurrentMonth: false });
    }
    // Dias do mês atual
    for (let d = 1; d <= totalDays; d++) {
      const iso = `${ym}-${pad2(d)}`;
      cells.push({ iso, day: d, isCurrentMonth: true });
    }
    // Completar grade
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      const iso = `${nextYM}-${pad2(nextDay)}`;
      cells.push({ iso, day: nextDay, isCurrentMonth: false });
      nextDay++;
    }

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = cells.map((cell) => {
      const agendaForDay = appData.agendaItems
        .filter((a) => a.date === cell.iso)
        .filter((a) => uiState.agendaScope === 'all' || a.scope === uiState.agendaScope);

      const hasPessoal = agendaForDay.some((a) => a.scope === 'pessoal');
      const hasTrabalho = agendaForDay.some((a) => a.scope === 'trabalho');
      const dayInvoices = cell.isCurrentMonth ? (dueCardsByDay[cell.day] || []) : [];

      const chips = [];
      for (const item of agendaForDay.slice(0, 2)) {
        const timePrefix = item.startTime ? `${item.startTime} ` : '';
        chips.push(`<div class="cal-chip ${item.scope}">${escapeHtml(timePrefix + item.title)}</div>`);
      }
      for (const card of dayInvoices.slice(0, 1)) {
        chips.push(`<div class="cal-chip invoice">Venc. ${escapeHtml(card.name)}</div>`);
      }
      const totalItems = agendaForDay.length + dayInvoices.length;
      if (totalItems > chips.length) {
        chips.push(`<div class="cal-chip" style="background:#f1f5f9;color:#475569;">+${totalItems - chips.length} mais</div>`);
      }

      const inRange = Boolean(
        range &&
        (!range.start || cell.iso >= range.start) &&
        (!range.end || cell.iso <= range.end)
      );

      const classes = [
        'cal-day',
        cell.isCurrentMonth ? '' : 'other-month',
        cell.iso === todayISO ? 'today' : '',
        inRange ? 'in-range' : '',
        cell.iso === uiState.selectedDate ? 'selected' : ''
      ].filter(Boolean).join(' ');

      return `
        <button type="button" class="${classes}" data-select-date="${cell.iso}">
          <div class="cal-day-top">
            <span class="cal-day-num">${cell.day}</span>
            ${totalItems > 0 ? `<span class="cal-count-badge" title="${totalItems} item(ns)">${totalItems}</span>` : ''}
          </div>
          <div class="cal-dots">
            ${hasPessoal ? '<span class="dot dot-pessoal" title="Pessoal"></span>' : ''}
            ${hasTrabalho ? '<span class="dot dot-trabalho" title="Trabalho"></span>' : ''}
            ${dayInvoices.length ? '<span class="dot dot-invoice" title="Vencimento de fatura"></span>' : ''}
          </div>
          <div class="cal-chips">${chips.join('')}</div>
        </button>
      `;
    }).join('');
  }

  function renderSelectedDayPanel() {
    const dateISO = uiState.selectedDate;
    const todayISO = getTodayISO();
    const badgeEl = document.getElementById('selectedDayBadge');
    badgeEl.textContent = dateISO === todayISO ? 'Hoje' : formatDateBR(dateISO);
    document.getElementById('selectedDayFullTitle').textContent = formatFullDayTitle(dateISO);

    const dayAgenda = appData.agendaItems
      .filter((a) => a.date === dateISO)
      .filter((a) => uiState.agendaScope === 'all' || a.scope === uiState.agendaScope);

    // 1. Checklist de Tarefas
    const tasks = dayAgenda.filter((a) => a.itemType === 'task');
    const completedCount = tasks.filter((t) => t.completed).length;
    document.getElementById('dayTasksCount').textContent =
      `${tasks.length} tarefa(s) (${completedCount} concluída(s))`;

    const tasksList = document.getElementById('dayTasksList');
    if (tasks.length === 0) {
      tasksList.innerHTML = '<div class="empty-state">Nenhuma tarefa no checklist para este dia. Use o campo acima para adicionar.</div>';
    } else {
      tasksList.innerHTML = tasks.map((task) => `
        <div class="task-row">
          <input type="checkbox" class="task-checkbox" data-toggle-agenda="${escapeHtml(task.id)}" ${task.completed ? 'checked' : ''} aria-label="Marcar tarefa ${escapeHtml(task.title)}">
          <div class="task-content">
            <div class="item-row-title ${task.completed ? 'completed-text' : ''}">
              <span>${escapeHtml(task.title)}</span>
              <span class="badge badge-${task.scope}">${SCOPE_LABELS[task.scope]}</span>
              <span class="badge badge-prio-${task.priority}">${PRIORITY_LABELS[task.priority]}</span>
            </div>
            ${task.notes ? `<div class="item-row-sub">${escapeHtml(task.notes)}</div>` : ''}
          </div>
          <div class="task-actions">
            <button type="button" class="btn btn-sm btn-ghost" data-edit-agenda="${escapeHtml(task.id)}">Editar</button>
            <button type="button" class="btn btn-sm btn-ghost" data-delete-agenda="${escapeHtml(task.id)}" title="Excluir">&times;</button>
          </div>
        </div>
      `).join('');
    }

    // 2. Grade Horária (Estilo Google Calendar)
    const events = dayAgenda
      .filter((a) => a.itemType === 'event')
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

    const startHour = uiState.showEarlyHours ? 0 : 6;
    const timeline = document.getElementById('dayHourlyTimeline');
    document.getElementById('btnToggleEarlyHours').textContent =
      uiState.showEarlyHours ? 'Ocultar 00h–05h' : 'Mostrar 00h–05h';

    let hoursHtml = '';
    for (let h = startHour; h <= 23; h++) {
      const hourLabel = `${pad2(h)}:00`;
      const slotEvents = events.filter((ev) => {
        const evH = ev.startTime ? Number(ev.startTime.split(':')[0]) : 9;
        return evH === h;
      });
      const eventsHtml = slotEvents.map((ev) => `
        <div class="timeline-event ${ev.scope} ${ev.completed ? 'completed' : ''}" data-edit-agenda="${escapeHtml(ev.id)}">
          <div>
            <span class="timeline-event-title">${escapeHtml(ev.title)}</span>
            <span class="badge badge-${ev.scope}" style="margin-left:6px;">${SCOPE_LABELS[ev.scope]}</span>
          </div>
          <span class="timeline-event-time">${escapeHtml(ev.startTime || hourLabel)}${ev.endTime ? ' – ' + escapeHtml(ev.endTime) : ''}</span>
        </div>
      `).join('');

      hoursHtml += `
        <div class="hour-slot">
          <div class="hour-label">${hourLabel}</div>
          <div class="hour-body" data-slot-hour="${pad2(h)}:00">
            ${eventsHtml || '<span class="hour-empty-hint">+ Clique para agendar neste horário</span>'}
          </div>
        </div>
      `;
    }
    timeline.innerHTML = hoursHtml;
  }

  function openDayPopupModal(isoDate) {
    uiState.selectedDate = isoDate;
    uiState.selectedMonth = isoDate.slice(0, 7);
    renderAll();
    renderDayPopupModal();
    document.getElementById('dayPopupModalBackdrop').classList.remove('hidden');
  }

  function renderDayPopupModal() {
    const dateISO = uiState.selectedDate;
    const todayISO = getTodayISO();
    document.getElementById('dayPopupBadge').textContent = dateISO === todayISO ? 'Hoje' : formatDateBR(dateISO);
    document.getElementById('dayPopupTitle').textContent = formatFullDayTitle(dateISO);

    const dayItems = appData.agendaItems
      .filter((a) => a.date === dateISO)
      .filter((a) => uiState.agendaScope === 'all' || a.scope === uiState.agendaScope)
      .sort((a, b) => {
        if (a.itemType !== b.itemType) return a.itemType === 'event' ? -1 : 1;
        return (a.startTime || '99:99').localeCompare(b.startTime || '99:99');
      });

    const doneCount = dayItems.filter((i) => i.completed).length;
    document.getElementById('dayPopupSummary').textContent =
      `${dayItems.length} item(ns) neste dia (${doneCount} concluído(s))`;

    const listEl = document.getElementById('dayPopupItemsList');
    if (dayItems.length === 0) {
      listEl.innerHTML = '<div class="empty-state">Nenhuma tarefa ou compromisso para este dia. Adicione acima!</div>';
    } else {
      listEl.innerHTML = dayItems.map((item) => {
        const timeText = item.itemType === 'event' && item.startTime
          ? `🕒 ${item.startTime}${item.endTime ? ' – ' + item.endTime : ''}`
          : '☑️ Tarefa';
        return `
          <div class="day-popup-item ${item.scope}">
            <input type="checkbox" class="day-popup-checkbox" data-toggle-agenda="${escapeHtml(item.id)}" ${item.completed ? 'checked' : ''} aria-label="Marcar ${escapeHtml(item.title)}">
            <div class="day-popup-item-content">
              <div class="day-popup-item-title ${item.completed ? 'completed-text' : ''}">
                ${escapeHtml(item.title)}
              </div>
              <div class="day-popup-item-meta">
                <span class="day-popup-time-pill">${escapeHtml(timeText)}</span>
                <span class="badge badge-${item.scope}">${SCOPE_LABELS[item.scope]}</span>
                <span class="badge badge-prio-${item.priority}">${PRIORITY_LABELS[item.priority]}</span>
              </div>
              ${item.notes ? `<p class="panel-subtitle" style="margin-top:6px;">${escapeHtml(item.notes)}</p>` : ''}
              <div class="day-popup-item-actions">
                <button type="button" class="btn btn-sm btn-secondary" data-edit-agenda="${escapeHtml(item.id)}">Editar</button>
                <button type="button" class="btn btn-sm btn-danger" data-delete-agenda="${escapeHtml(item.id)}">Excluir</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Vencimentos de fatura no dia
    const [selY, selM, selD] = dateISO.split('-').map(Number);
    const selYM = `${selY}-${pad2(selM)}`;
    const maxD = daysInMonth(selY, selM);
    const dueCardsToday = appData.cards.filter((c) => Math.min(Number(c.dueDay), maxD) === selD);

    const invoicesSection = document.getElementById('dayPopupInvoicesSection');
    const invoicesList = document.getElementById('dayPopupInvoicesList');
    if (dueCardsToday.length === 0) {
      invoicesSection.classList.add('hidden');
      invoicesList.innerHTML = '';
    } else {
      invoicesSection.classList.remove('hidden');
      invoicesList.innerHTML = dueCardsToday.map((card) => {
        const inv = getCardInvoiceForMonth(card.id, selYM);
        return `
          <div class="invoice-alert-banner" style="margin-bottom:0;">
            <div>
              <strong>Vencimento Fatura ${escapeHtml(card.name)}</strong>
              <span class="badge ${inv.isPaid ? 'badge-paid' : 'badge-open'}" style="margin-left:6px;">${inv.isPaid ? 'Paga' : 'Em aberto'}</span>
              <div style="font-size:0.8rem; margin-top:2px;">Fatura de ${formatShortMonthLabel(selYM)}: <strong>${formatBRL(inv.total)}</strong></div>
            </div>
            <button type="button" class="btn btn-sm btn-secondary" data-goto-tab="cards">Ver Fatura</button>
          </div>
        `;
      }).join('');
    }
  }

  // =========================================================================
  // ABA 3: FINANÇAS & GASTOS
  // =========================================================================
  function renderFinancesTab() {
    const ym = uiState.selectedMonth;
    const summary = getMonthSummary(ym);

    // Balanço Visual no topo da aba Finanças
    document.getElementById('financesBalanceBanner').innerHTML = renderBalanceBannerHtml(ym, summary);

    // Painel Comparativo Visual (Cartão vs Outras Coisas + Categorias)
    const totalExp = summary.totalExpenses || 1;
    const cardPct = summary.totalExpenses > 0 ? Math.round((summary.totalCard / totalExp) * 100) : 0;
    const otherPct = summary.totalExpenses > 0 ? Math.round((summary.totalOtherExpenses / totalExp) * 100) : 0;

    const byCategory = {};
    for (const item of summary.items) {
      if (item.type !== 'expense') continue;
      byCategory[item.category] = roundMoney((byCategory[item.category] || 0) + item.monthAmount);
    }
    const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

    document.getElementById('financesComparisonPanel').innerHTML = `
      <div class="panel-card">
        <h3>Cartão de Crédito vs Outras Coisas</h3>
        <p class="panel-subtitle">Impacto no mês de ${formatMonthLabel(ym)}</p>
        <div class="comparison-bars">
          <div class="bar-row">
            <div class="bar-row-top">
              <span>Cartão de Crédito (Faturas)</span>
              <span class="amount-card">${formatBRL(summary.totalCard)} (${cardPct}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${cardPct}%; background:var(--purple);"></div>
            </div>
          </div>
          <div class="bar-row">
            <div class="bar-row-top">
              <span>Outras Coisas (Pix, Débito, Dinheiro, Contas)</span>
              <span class="amount-expense">${formatBRL(summary.totalOtherExpenses)} (${otherPct}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${otherPct}%; background:var(--orange);"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <h3>Gastos por Categoria</h3>
        <p class="panel-subtitle">Principais despesas do mês</p>
        <div class="comparison-bars">
          ${sortedCats.length === 0 ? '<p class="panel-subtitle">Sem gastos neste mês.</p>' : sortedCats.map(([cat, val]) => {
            const pct = Math.round((val / totalExp) * 100);
            return `
              <div class="bar-row">
                <div class="bar-row-top">
                  <span>${escapeHtml(cat)}</span>
                  <span>${formatBRL(val)} (${pct}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${pct}%; background:var(--primary);"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Abas separadas: O que Saiu (Gastos) vs O que Entrou (Receitas)
    const isOut = uiState.financeDirection === 'out';
    document.getElementById('tabFinancesOutTotal').textContent = formatBRL(summary.totalExpenses);
    document.getElementById('tabFinancesInTotal').textContent = formatBRL(summary.totalIncome);

    const tabOutBtn = document.getElementById('tabBtnFinancesOut');
    const tabInBtn = document.getElementById('tabBtnFinancesIn');
    tabOutBtn.classList.toggle('active', isOut);
    tabOutBtn.setAttribute('aria-selected', String(isOut));
    tabInBtn.classList.toggle('active', !isOut);
    tabInBtn.setAttribute('aria-selected', String(!isOut));

    document.getElementById('financeTypeFilter').classList.toggle('hidden', !isOut);
    document.getElementById('financeCardFilter').classList.toggle('hidden', !isOut);

    // Atualizar pills ativas
    document.querySelectorAll('#financeTypeFilter .pill-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === uiState.financeTypeFilter);
    });

    // Filtrar lançamentos
    const filtered = summary.items.filter((item) => {
      if (isOut) {
        if (item.type !== 'expense') return false;
        if (uiState.financeTypeFilter === 'card' && item.paymentMethod !== 'card') return false;
        if (uiState.financeTypeFilter === 'installments' && !item.isInstallment) return false;
        if (uiState.financeTypeFilter === 'other' && item.paymentMethod === 'card') return false;
        if (uiState.financeCardFilter !== 'all' && item.cardId !== uiState.financeCardFilter) return false;
      } else {
        if (item.type !== 'income') return false;
      }
      if (uiState.financeSearch.trim()) {
        const q = uiState.financeSearch.trim().toLowerCase();
        const hay = `${item.title} ${item.category} ${item.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const tbody = document.getElementById('financesTableBody');
    if (filtered.length === 0) {
      const emptyMsg = isOut
        ? 'Nenhum gasto encontrado para estes filtros neste mês.'
        : 'Nenhuma receita ou entrada registrada neste mês.';
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">${emptyMsg}</div></td></tr>`;
    } else {
      tbody.innerHTML = filtered.map((item) => {
        const isCard = item.paymentMethod === 'card';
        const card = item.cardId ? getCardById(item.cardId) : null;
        const payLabel = isCard ? (card ? card.name : 'Cartão') : PAYMENT_LABELS[item.paymentMethod];
        const isPaidOther = !isCard && Array.isArray(item.paidMonths) && item.paidMonths.includes(ym);

        return `
          <tr>
            <td data-label="Data">${formatDateBR(item.purchaseDate)}</td>
            <td data-label="Descrição">
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                ${item.notes ? `<span class="table-subtext">${escapeHtml(item.notes)}</span>` : ''}
              </div>
            </td>
            <td data-label="Categoria">
              <span>${escapeHtml(item.category)}</span>
            </td>
            <td data-label="Pagamento">
              <div>
                <span class="badge ${item.type === 'income' ? 'badge-income' : (isCard ? 'badge-card' : 'badge-other')}">
                  ${escapeHtml(payLabel)}
                </span>
                ${!isCard && item.type === 'expense' ? `
                  <button type="button" class="badge ${isPaidOther ? 'badge-paid' : 'badge-open'}" style="border:none;cursor:pointer;margin-top:4px;" data-toggle-tx-paid="${escapeHtml(item.id)}">
                    ${isPaidOther ? '✓ Pago' : 'Marcar pago'}
                  </button>
                ` : ''}
              </div>
            </td>
            <td data-label="Parcela">
              <div>
                ${item.isInstallment
                  ? `<span class="badge badge-installment">Parcela ${item.currentInstallment}/${item.installmentCount}</span>
                     <span class="table-subtext">Total ${formatBRL(item.totalAmount)} &bull; ${item.remainingInstallments === 0 ? 'Última' : `Restam ${item.remainingInstallments}`}</span>`
                  : '<span class="badge badge-installment">À vista</span>'}
              </div>
            </td>
            <td data-label="Valor" class="text-right">
              <strong class="${item.type === 'income' ? 'amount-income' : (isCard ? 'amount-card' : 'amount-expense')}">
                ${item.type === 'income' ? '+' : ''}${formatBRL(item.monthAmount)}
              </strong>
            </td>
            <td data-label="Ações" class="text-right">
              <div class="action-btn-group">
                <button type="button" class="btn btn-sm btn-ghost" data-edit-tx="${escapeHtml(item.id)}">Editar</button>
                <button type="button" class="btn btn-sm btn-danger" data-delete-tx="${escapeHtml(item.id)}">Excluir</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    const totalFiltered = filtered.reduce((s, i) => s + i.monthAmount, 0);
    document.getElementById('financesTableFooter').innerHTML = `
      <span>Exibindo ${filtered.length} lançamento(s)</span>
      <span>${isOut
        ? `Total de Saídas (filtradas): <strong style="color:var(--red-dark);">- ${formatBRL(totalFiltered)}</strong>`
        : `Total de Entradas (filtradas): <strong class="amount-income">+ ${formatBRL(totalFiltered)}</strong>`}</span>
    `;
  }

  // =========================================================================
  // ABA 4: CARTÕES & PARCELAS
  // =========================================================================
  function renderCardsTab() {
    const ym = uiState.selectedMonth;
    const { year, month } = parseYearMonth(ym);
    const maxD = daysInMonth(year, month);

    const grid = document.getElementById('cardsDetailGrid');
    if (appData.cards.length === 0) {
      grid.innerHTML = '<div class="empty-state">Você ainda não cadastrou nenhum cartão de crédito. Clique em "+ Cadastrar Novo Cartão" acima.</div>';
    } else {
      grid.innerHTML = appData.cards.map((card) => {
        const inv = getCardInvoiceForMonth(card.id, ym);
        const committed = getCardCommittedLimit(card);
        const available = roundMoney(Math.max(0, card.limit - committed));
        const limitPct = card.limit > 0 ? Math.min(100, Math.round((committed / card.limit) * 100)) : 0;
        const dueStr = `${pad2(Math.min(card.dueDay, maxD))}/${pad2(month)}/${year}`;

        const itemsHtml = inv.items.length === 0
          ? '<div class="empty-state">Sem compras cobradas nesta fatura.</div>'
          : `<div class="stack-list">${inv.items.map((item) => `
              <div class="item-row">
                <div class="item-row-main">
                  <div class="item-row-title">
                    <span>${escapeHtml(item.title)}</span>
                    <span class="badge badge-installment">${item.isInstallment ? `${item.currentInstallment}/${item.installmentCount}` : 'À vista'}</span>
                  </div>
                  <div class="item-row-sub">
                    <span>Compra em ${formatDateBR(item.purchaseDate)}</span>
                    <span>&bull; ${escapeHtml(item.category)}</span>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <div class="item-row-amount amount-card">${formatBRL(item.monthAmount)}</div>
                  <button type="button" class="btn btn-sm btn-ghost" data-edit-tx="${escapeHtml(item.id)}">Editar</button>
                </div>
              </div>
            `).join('')}</div>`;

        return `
          <div class="credit-card-panel">
            <div class="credit-card-banner" style="background: linear-gradient(135deg, ${escapeHtml(card.color)}, #1e293b);">
              <div class="credit-card-banner-top">
                <div>
                  <div class="credit-card-title">${escapeHtml(card.name)}</div>
                  <div class="credit-card-dates">Fecha dia ${card.closingDay} &bull; Vence em ${dueStr}</div>
                </div>
                <button type="button" class="btn btn-sm btn-white-alpha" data-toggle-invoice-paid="${escapeHtml(card.id)}">
                  ${inv.isPaid ? '✓ Fatura Paga (Reabrir)' : 'Marcar Fatura como Paga'}
                </button>
              </div>
              <div class="credit-card-invoice-box">
                <div>
                  <div style="font-size:0.75rem; opacity:0.85;">Fatura de ${formatMonthLabel(ym)}</div>
                  <div class="invoice-big-value">${formatBRL(inv.total)}</div>
                  <div class="invoice-breakdown">Parcelado: ${formatBRL(inv.installmentsTotal)} &bull; À vista: ${formatBRL(inv.oneTimeTotal)}</div>
                </div>
                <span class="badge ${inv.isPaid ? 'badge-paid' : 'badge-open'}">${inv.isPaid ? 'Paga' : 'Aberta'}</span>
              </div>
            </div>

            <div class="credit-card-body">
              <div>
                <div class="limit-info-row">
                  <span>Limite comprometido (faturas abertas): <strong>${formatBRL(committed)}</strong></span>
                  <span>Disponível: <strong>${formatBRL(available)}</strong> de ${formatBRL(card.limit)}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${limitPct}%; background:${escapeHtml(card.color)};"></div>
                </div>
              </div>

              ${itemsHtml}

              <div class="card-actions-bar">
                <button type="button" class="btn btn-sm btn-primary" data-new-tx-for-card="${escapeHtml(card.id)}">+ Lançar neste cartão</button>
                <div style="display:flex;gap:6px;">
                  <button type="button" class="btn btn-sm btn-secondary" data-edit-card="${escapeHtml(card.id)}">Editar Cartão</button>
                  <button type="button" class="btn btn-sm btn-danger" data-delete-card="${escapeHtml(card.id)}">Excluir</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Projeção dos próximos 6 meses
    const nextMonths = [];
    for (let i = 0; i < 6; i++) {
      const m = addMonthsToYM(ym, i);
      const summary = getMonthSummary(m);
      nextMonths.push({ ym: m, totalCard: summary.totalCard });
    }
    const maxCardTotal = Math.max(1, ...nextMonths.map((x) => x.totalCard));

    document.getElementById('cardsProjectionChart').innerHTML = nextMonths.map((m) => {
      const heightPct = Math.round((m.totalCard / maxCardTotal) * 100);
      return `
        <div class="proj-col">
          <span class="proj-amount">${formatBRL(m.totalCard)}</span>
          <div class="proj-bar-track">
            <div class="proj-bar-fill" style="height:${heightPct}%;"></div>
          </div>
          <span class="proj-month">${formatShortMonthLabel(m.ym)}</span>
        </div>
      `;
    }).join('');

    const projTable = document.getElementById('cardsProjectionTable');
    const headerCols = nextMonths.map((m) => `<th class="text-right">${formatShortMonthLabel(m.ym)}</th>`).join('');
    const cardRows = appData.cards.map((card) => {
      const cols = nextMonths.map((m) => {
        const inv = getCardInvoiceForMonth(card.id, m.ym);
        return `<td class="text-right">${formatBRL(inv.total)}</td>`;
      }).join('');
      return `<tr><td><strong>${escapeHtml(card.name)}</strong></td>${cols}</tr>`;
    }).join('');
    const totalCols = nextMonths.map((m) => `<td class="text-right"><strong>${formatBRL(m.totalCard)}</strong></td>`).join('');

    projTable.innerHTML = `
      <thead>
        <tr>
          <th>Cartão</th>
          ${headerCols}
        </tr>
      </thead>
      <tbody>
        ${cardRows}
        <tr style="background:var(--purple-soft);">
          <td><strong>Total Previsto em Cartões</strong></td>
          ${totalCols}
        </tr>
      </tbody>
    `;
  }

  // =========================================================================
  // MODAIS: TRANSAÇÃO FINANCEIRA
  // =========================================================================
  function populateInstallmentSelect() {
    const sel = document.getElementById('txInstallmentCount');
    sel.innerHTML = '';
    for (let i = 1; i <= 48; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = i === 1 ? '1x (À vista)' : `${i}x`;
      sel.appendChild(opt);
    }
  }

  function populateModalCardSelect(selectedId = null) {
    const sel = document.getElementById('txCardId');
    sel.innerHTML = '';
    if (appData.cards.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Nenhum cartão cadastrado';
      sel.appendChild(opt);
      return;
    }
    for (const card of appData.cards) {
      const opt = document.createElement('option');
      opt.value = card.id;
      opt.textContent = `${card.name} (fecha dia ${card.closingDay})`;
      sel.appendChild(opt);
    }
    if (selectedId && appData.cards.some((c) => c.id === selectedId)) {
      sel.value = selectedId;
    }
  }

  function setTxTypeUI(type) {
    document.getElementById('txType').value = type;
    document.querySelectorAll('#transactionForm .type-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.txType === type);
    });
    const payMethodSelect = document.getElementById('txPaymentMethod');
    if (type === 'income') {
      if (payMethodSelect.value === 'card') {
        payMethodSelect.value = 'pix';
      }
      document.getElementById('txCategory').value = 'Salário / Renda';
    } else if (document.getElementById('txCategory').value === 'Salário / Renda') {
      document.getElementById('txCategory').value = 'Compras';
    }
    updateTxFormVisibility();
  }

  function updateTxFormVisibility() {
    const txType = document.getElementById('txType').value;
    const payMethod = document.getElementById('txPaymentMethod').value;
    const isCard = txType === 'expense' && payMethod === 'card';
    document.getElementById('txCardSelectGroup').classList.toggle('hidden', !isCard);
    document.getElementById('txCardId').required = isCard;

    // Para receita, ocultar opção de cartão
    const cardOpt = document.querySelector('#txPaymentMethod option[value="card"]');
    if (cardOpt) cardOpt.disabled = txType === 'income';

    updateSuggestedBillingMonthIfAuto();
    updateInstallmentPreview();
  }

  function updateSuggestedBillingMonthIfAuto() {
    if (uiState.billingMonthManuallyEdited) return;
    const txType = document.getElementById('txType').value;
    const purchaseDate = document.getElementById('txPurchaseDate').value;
    const payMethod = document.getElementById('txPaymentMethod').value;
    const cardId = document.getElementById('txCardId').value;

    const suggested = getSuggestedFirstBillingMonth(
      purchaseDate,
      txType === 'expense' ? payMethod : 'pix',
      cardId
    );
    document.getElementById('txFirstBillingMonth').value = suggested;

    const hintEl = document.getElementById('txBillingHint');
    if (txType === 'expense' && payMethod === 'card' && cardId && purchaseDate) {
      const card = getCardById(cardId);
      const day = Number(purchaseDate.split('-')[2]);
      if (card) {
        if (day >= Number(card.closingDay)) {
          hintEl.textContent = `Como a compra foi a partir do fechamento do ${card.name} (dia ${card.closingDay}), a 1ª parcela foi sugerida para a fatura de ${formatMonthLabel(suggested)}.`;
        } else {
          hintEl.textContent = `Compra antes do fechamento do ${card.name} (dia ${card.closingDay}): entra na fatura de ${formatMonthLabel(suggested)}.`;
        }
        return;
      }
    }
    hintEl.textContent = '';
  }

  function updateInstallmentPreview() {
    const mode = document.querySelector('input[name="amountInputMode"]:checked')?.value || 'total';
    const rawVal = parseFloat(document.getElementById('txAmountInput').value) || 0;
    const count = Math.max(1, parseInt(document.getElementById('txInstallmentCount').value, 10) || 1);
    const firstYM = document.getElementById('txFirstBillingMonth').value || uiState.selectedMonth;

    document.getElementById('txAmountLabel').textContent =
      mode === 'total' ? 'Valor Total (R$) *' : 'Valor da Parcela (R$) *';

    let total = 0;
    let inst = 0;
    if (mode === 'total') {
      total = roundMoney(rawVal);
      inst = roundMoney(rawVal / count);
    } else {
      inst = roundMoney(rawVal);
      total = roundMoney(rawVal * count);
    }

    const lastYM = addMonthsToYM(firstYM, count - 1);
    const preview = document.getElementById('txInstallmentPreview');
    if (rawVal <= 0) {
      preview.textContent = 'Informe o valor para visualizar o resumo das parcelas.';
    } else if (count === 1) {
      preview.textContent = `À vista: ${formatBRL(total)} em ${formatMonthLabel(firstYM)}.`;
    } else {
      preview.textContent = `${count}x de ${formatBRL(inst)} (Total: ${formatBRL(total)}) — de ${formatShortMonthLabel(firstYM)} até ${formatShortMonthLabel(lastYM)}.`;
    }
  }

  function openTransactionModal(options = {}) {
    const form = document.getElementById('transactionForm');
    form.reset();
    populateInstallmentSelect();
    populateModalCardSelect(options.cardId || null);

    const editingTx = options.txId
      ? appData.transactions.find((t) => t.id === options.txId)
      : null;

    if (editingTx) {
      document.getElementById('transactionModalTitle').textContent = 'Editar Lançamento';
      document.getElementById('txId').value = editingTx.id;
      uiState.billingMonthManuallyEdited = true;
      setTxTypeUI(editingTx.type);
      document.getElementById('txTitle').value = editingTx.title;
      const catSelect = document.getElementById('txCategory');
      catSelect.value = editingTx.category;
      if (catSelect.value !== editingTx.category) {
        catSelect.value = editingTx.type === 'income' ? 'Salário / Renda' : 'Outros';
      }
      document.getElementById('txPurchaseDate').value = editingTx.purchaseDate;
      document.getElementById('txPaymentMethod').value = editingTx.paymentMethod;
      if (editingTx.cardId) populateModalCardSelect(editingTx.cardId);
      document.querySelector('input[name="amountInputMode"][value="total"]').checked = true;
      document.getElementById('txAmountInput').value = editingTx.totalAmount;
      document.getElementById('txInstallmentCount').value = String(editingTx.installmentCount || 1);
      document.getElementById('txFirstBillingMonth').value = editingTx.firstBillingMonth || editingTx.purchaseDate.slice(0, 7);
      document.getElementById('txNotes').value = editingTx.notes || '';
      updateTxFormVisibility();
    } else {
      document.getElementById('transactionModalTitle').textContent =
        options.type === 'income' ? 'Lançar Receita / Salário' : 'Lançar Compra / Gasto';
      document.getElementById('txId').value = '';
      uiState.billingMonthManuallyEdited = false;
      const defaultDate = options.date || uiState.selectedDate || getTodayISO();
      document.getElementById('txPurchaseDate').value = defaultDate;
      document.getElementById('txPaymentMethod').value = options.paymentMethod || 'card';
      document.getElementById('txInstallmentCount').value = '1';
      document.querySelector('input[name="amountInputMode"][value="total"]').checked = true;
      setTxTypeUI(options.type || 'expense');
    }

    document.getElementById('transactionModalBackdrop').classList.remove('hidden');
    document.getElementById('txTitle').focus();
  }

  function handleSaveTransaction(e) {
    e.preventDefault();
    const id = document.getElementById('txId').value;
    const type = document.getElementById('txType').value;
    const title = document.getElementById('txTitle').value.trim();
    const scope = 'pessoal';
    const category = document.getElementById('txCategory').value;
    const purchaseDate = document.getElementById('txPurchaseDate').value;
    const paymentMethod = document.getElementById('txPaymentMethod').value;
    const cardId = (type === 'expense' && paymentMethod === 'card')
      ? document.getElementById('txCardId').value
      : null;

    if (!title || !purchaseDate) {
      showToast('Preencha a descrição e a data.', 'error');
      return;
    }
    if (type === 'expense' && paymentMethod === 'card' && !cardId) {
      showToast('Cadastre ou selecione um cartão de crédito.', 'error');
      return;
    }

    const mode = document.querySelector('input[name="amountInputMode"]:checked')?.value || 'total';
    const rawVal = parseFloat(document.getElementById('txAmountInput').value);
    const installmentCount = Math.max(1, parseInt(document.getElementById('txInstallmentCount').value, 10) || 1);
    const firstBillingMonth = document.getElementById('txFirstBillingMonth').value || purchaseDate.slice(0, 7);
    const notes = document.getElementById('txNotes').value.trim();

    if (!(rawVal > 0)) {
      showToast('Informe um valor maior que zero.', 'error');
      return;
    }

    const totalAmount = mode === 'total' ? roundMoney(rawVal) : roundMoney(rawVal * installmentCount);
    const installmentAmount = mode === 'total' ? roundMoney(rawVal / installmentCount) : roundMoney(rawVal);

    const existing = id ? appData.transactions.find((t) => t.id === id) : null;
    const payload = {
      id: id || uid('tx'),
      type,
      title,
      category,
      scope,
      paymentMethod,
      cardId,
      purchaseDate,
      totalAmount,
      installmentCount,
      installmentAmount,
      firstBillingMonth,
      paidMonths: existing ? (existing.paidMonths || []) : (paymentMethod !== 'card' && paymentMethod !== 'boleto' ? [firstBillingMonth] : []),
      notes
    };

    if (existing) {
      appData.transactions = appData.transactions.map((t) => (t.id === id ? payload : t));
      showToast('Lançamento atualizado!', 'success');
    } else {
      appData.transactions.push(payload);
      showToast('Lançamento salvo!', 'success');
    }

    saveData();
    closeModal('transactionModalBackdrop');
    renderAll();
  }

  // =========================================================================
  // MODAIS: AGENDA
  // =========================================================================
  function setAgItemTypeUI(itemType) {
    document.getElementById('agItemType').value = itemType;
    document.querySelectorAll('#agendaForm .type-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.agType === itemType);
    });
    const isEvent = itemType === 'event';
    document.getElementById('agStartTime').required = isEvent;
  }

  function openAgendaModal(options = {}) {
    const form = document.getElementById('agendaForm');
    form.reset();

    const editing = options.agendaId
      ? appData.agendaItems.find((a) => a.id === options.agendaId)
      : null;

    const deleteBtn = document.getElementById('btnDeleteAgendaItem');
    if (editing) {
      document.getElementById('agendaModalTitle').textContent = 'Editar Item da Agenda';
      document.getElementById('agId').value = editing.id;
      setAgItemTypeUI(editing.itemType);
      document.getElementById('agTitle').value = editing.title;
      document.getElementById('agScope').value = editing.scope;
      document.getElementById('agDate').value = editing.date;
      document.getElementById('agStartTime').value = editing.startTime || '';
      document.getElementById('agEndTime').value = editing.endTime || '';
      document.getElementById('agPriority').value = editing.priority || 'media';
      document.getElementById('agCompleted').checked = Boolean(editing.completed);
      document.getElementById('agNotes').value = editing.notes || '';
      deleteBtn.classList.remove('hidden');
    } else {
      document.getElementById('agendaModalTitle').textContent = 'Novo Compromisso / Tarefa';
      document.getElementById('agId').value = '';
      setAgItemTypeUI(options.itemType || 'event');
      document.getElementById('agDate').value = options.date || uiState.selectedDate || getTodayISO();
      const start = options.startTime || '09:00';
      const startH = parseInt(start.split(':')[0], 10);
      const end = `${pad2(Math.min(23, startH + 1))}:00`;
      document.getElementById('agStartTime').value = options.itemType === 'task' ? '' : start;
      document.getElementById('agEndTime').value = options.itemType === 'task' ? '' : end;
      document.getElementById('agPriority').value = 'media';
      document.getElementById('agCompleted').checked = false;
      deleteBtn.classList.add('hidden');
    }

    document.getElementById('agendaModalBackdrop').classList.remove('hidden');
    document.getElementById('agTitle').focus();
  }

  function handleSaveAgendaItem(e) {
    e.preventDefault();
    const id = document.getElementById('agId').value;
    const itemType = document.getElementById('agItemType').value;
    const title = document.getElementById('agTitle').value.trim();
    const scope = document.getElementById('agScope').value;
    const date = document.getElementById('agDate').value;
    const startTime = document.getElementById('agStartTime').value;
    const endTime = document.getElementById('agEndTime').value;
    const priority = document.getElementById('agPriority').value;
    const completed = document.getElementById('agCompleted').checked;
    const notes = document.getElementById('agNotes').value.trim();

    if (!title || !date) {
      showToast('Informe título e data.', 'error');
      return;
    }

    const payload = {
      id: id || uid('ag'),
      title,
      date,
      itemType,
      scope,
      startTime,
      endTime,
      priority,
      completed,
      notes
    };

    if (id) {
      appData.agendaItems = appData.agendaItems.map((a) => (a.id === id ? payload : a));
      showToast('Agenda atualizada!', 'success');
    } else {
      appData.agendaItems.push(payload);
      showToast('Adicionado à agenda!', 'success');
    }

    uiState.selectedDate = date;
    uiState.selectedMonth = date.slice(0, 7);
    saveData();
    closeModal('agendaModalBackdrop');
    renderAll();
  }

  // =========================================================================
  // MODAIS: CARTÃO DE CRÉDITO
  // =========================================================================
  function setCardColorUI(color) {
    document.getElementById('cardColor').value = color;
    document.querySelectorAll('#cardColorPresets .color-swatch').forEach((sw) => {
      sw.classList.toggle('active', sw.dataset.color.toLowerCase() === color.toLowerCase());
    });
  }

  function openCardModal(cardId = null) {
    const form = document.getElementById('cardForm');
    form.reset();
    const editing = cardId ? getCardById(cardId) : null;

    if (editing) {
      document.getElementById('cardModalTitle').textContent = 'Editar Cartão de Crédito';
      document.getElementById('cardId').value = editing.id;
      document.getElementById('cardName').value = editing.name;
      document.getElementById('cardLimit').value = editing.limit;
      document.getElementById('cardClosingDay').value = editing.closingDay;
      document.getElementById('cardDueDay').value = editing.dueDay;
      setCardColorUI(editing.color || '#8b5cf6');
    } else {
      document.getElementById('cardModalTitle').textContent = 'Cadastrar Cartão de Crédito';
      document.getElementById('cardId').value = '';
      document.getElementById('cardLimit').value = '5000';
      document.getElementById('cardClosingDay').value = '5';
      document.getElementById('cardDueDay').value = '12';
      setCardColorUI('#8b5cf6');
    }

    document.getElementById('cardModalBackdrop').classList.remove('hidden');
    document.getElementById('cardName').focus();
  }

  function handleSaveCard(e) {
    e.preventDefault();
    const id = document.getElementById('cardId').value;
    const name = document.getElementById('cardName').value.trim();
    const limit = parseFloat(document.getElementById('cardLimit').value);
    const closingDay = parseInt(document.getElementById('cardClosingDay').value, 10);
    const dueDay = parseInt(document.getElementById('cardDueDay').value, 10);
    const color = document.getElementById('cardColor').value || '#8b5cf6';

    if (!name || !(limit > 0) || closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) {
      showToast('Verifique os campos do cartão.', 'error');
      return;
    }

    const existing = id ? getCardById(id) : null;
    const newId = id || uid('card');
    const payload = {
      id: newId,
      name,
      color,
      limit: roundMoney(limit),
      closingDay,
      dueDay,
      paidInvoices: existing ? (existing.paidInvoices || []) : []
    };

    if (existing) {
      appData.cards = appData.cards.map((c) => (c.id === id ? payload : c));
      showToast('Cartão atualizado!', 'success');
    } else {
      appData.cards.push(payload);
      showToast('Cartão cadastrado!', 'success');
    }

    saveData();
    closeModal('cardModalBackdrop');

    // Se o modal de transação estiver aberto por baixo, atualizar select de cartões
    if (!document.getElementById('transactionModalBackdrop').classList.contains('hidden')) {
      populateModalCardSelect(newId);
      updateTxFormVisibility();
    }
    renderAll();
  }

  function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
  }

  // =========================================================================
  // BACKUP & EXPORTAÇÃO / IMPORTAÇÃO
  // =========================================================================
  function exportJSON() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-agenda-financas-${getTodayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado em JSON!', 'success');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.cards) || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.agendaItems)) {
          throw new Error('Formato de backup inválido.');
        }
        appData = {
          cards: parsed.cards,
          transactions: parsed.transactions,
          agendaItems: parsed.agendaItems,
          updatedAt: Date.now()
        };
        saveData();
        renderAll();
        showToast('Backup importado com sucesso!', 'success');
      } catch (err) {
        showToast('Arquivo JSON inválido ou incompatível.', 'error');
      }
    };
    reader.readAsText(file);
  }

  function copyBackupText() {
    const text = JSON.stringify(appData);
    const finishCopy = () => {
      showToast('Backup copiado! Cole no WhatsApp ou notas e use "Colar Backup" no celular.', 'success');
    };
    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        finishCopy();
      } catch (err) {
        prompt('Copie o texto abaixo e envie para o seu celular:', text);
      }
      ta.remove();
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(finishCopy).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function pasteBackupText() {
    const text = prompt('Cole aqui o texto do backup copiado (do PC ou celular):');
    if (!text) return;
    try {
      const parsed = JSON.parse(text.trim());
      if (!parsed || !Array.isArray(parsed.cards) || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.agendaItems)) {
        throw new Error('Formato de backup inválido.');
      }
      appData = {
        cards: parsed.cards,
        transactions: parsed.transactions,
        agendaItems: parsed.agendaItems,
        updatedAt: Date.now()
      };
      saveData();
      renderAll();
      showToast('Backup restaurado com sucesso!', 'success');
    } catch (err) {
      showToast('Texto de backup inválido. Verifique se copiou tudo.', 'error');
    }
  }

  // =========================================================================
  // SINCRONIZAÇÃO AUTOMÁTICA NA NUVEM (GITHUB GIST / FIREBASE)
  // =========================================================================
  function encodeBase64UTF8(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin);
  }

  function decodeBase64UTF8(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function normalizeRemoteData(parsed) {
    if (!parsed || !Array.isArray(parsed.cards) || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.agendaItems)) {
      return null;
    }
    return {
      cards: parsed.cards,
      transactions: parsed.transactions,
      agendaItems: parsed.agendaItems,
      updatedAt: Number(parsed.updatedAt) || 0
    };
  }

  function updateCloudStatusUI() {
    const btn = document.getElementById('btnCloudSync');
    const dot = document.getElementById('cloudStatusDot');
    const txt = document.getElementById('cloudStatusText');
    const connectedBox = document.getElementById('cloudConnectedBox');
    const statusTitle = document.getElementById('cloudConnectedStatusTitle');
    const lastSyncEl = document.getElementById('cloudLastSyncInfo');

    btn.classList.remove('connected', 'error');
    dot.classList.remove('connected', 'syncing', 'error');

    if (!cloudConfig.enabled) {
      txt.textContent = 'Nuvem';
      connectedBox.classList.add('hidden');
      return;
    }

    connectedBox.classList.remove('hidden');
    const providerName = cloudConfig.provider === 'github' ? 'GitHub Gist' : 'Firebase';
    statusTitle.textContent = `Conectado via ${providerName}`;

    if (cloudConfig.lastSyncedAt) {
      const dt = new Date(cloudConfig.lastSyncedAt);
      const hh = pad2(dt.getHours());
      const mm = pad2(dt.getMinutes());
      const dd = `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}`;
      lastSyncEl.textContent = `Última sincronização: ${dd} às ${hh}:${mm}`;
    } else {
      lastSyncEl.textContent = 'Aguardando primeira sincronização';
    }

    if (cloudRuntime.isSyncing) {
      dot.classList.add('syncing');
      txt.textContent = 'Sincronizando...';
    } else if (cloudRuntime.status === 'error') {
      btn.classList.add('error');
      dot.classList.add('error');
      txt.textContent = 'Erro Nuvem';
      if (cloudRuntime.lastError) {
        lastSyncEl.textContent = `Erro na última tentativa: ${cloudRuntime.lastError}`;
      }
    } else {
      btn.classList.add('connected');
      dot.classList.add('connected');
      txt.textContent = 'Sincronizado';
    }
  }

  function setCloudProviderUI(provider) {
    const chosen = provider === 'firebase' ? 'firebase' : 'github';
    document.getElementById('cloudProviderInput').value = chosen;
    document.querySelectorAll('#cloudProviderTabs .type-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.cloudProvider === chosen);
    });
    document.getElementById('cloudGithubFields').classList.toggle('hidden', chosen !== 'github');
    document.getElementById('cloudFirebaseFields').classList.toggle('hidden', chosen !== 'firebase');
  }

  function openCloudModal() {
    setCloudProviderUI(cloudConfig.provider || 'github');
    document.getElementById('cloudGithubToken').value = cloudConfig.githubToken || '';
    document.getElementById('cloudGithubGistId').value = cloudConfig.gistId || '';
    document.getElementById('cloudFirebaseUrl').value = cloudConfig.firebaseUrl || '';
    document.getElementById('cloudFirebaseKey').value = cloudConfig.firebaseKey || '';
    document.getElementById('cloudInitialConflictMode').value = 'smart';
    updateCloudStatusUI();
    document.getElementById('cloudModalBackdrop').classList.remove('hidden');
  }

  function getFirebaseEndpoint(url, key) {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const safeKey = encodeURIComponent(key.trim().replace(/[.#$\[\]/]/g, '_'));
    return `${cleanUrl}/agenda_financas/${safeKey}.json`;
  }

  async function readCloudRemote(cfg) {
    if (cfg.provider === 'github') {
      if (!cfg.githubToken || !cfg.gistId) return null;
      const resp = await fetch(`https://api.github.com/gists/${encodeURIComponent(cfg.gistId.trim())}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${cfg.githubToken.trim()}`,
          Accept: 'application/vnd.github+json'
        }
      });
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => '');
        throw new Error(`GitHub (${resp.status}): ${errBody || resp.statusText}`);
      }
      const gist = await resp.json();
      const fileObj = gist.files && (gist.files[GIST_FILENAME] || Object.values(gist.files)[0]);
      if (!fileObj) return null;
      let rawContent = fileObj.content || '';
      if (fileObj.truncated && fileObj.raw_url) {
        const rawResp = await fetch(fileObj.raw_url, { cache: 'no-store' });
        if (rawResp.ok) rawContent = await rawResp.text();
      }
      if (!rawContent.trim()) return null;
      return normalizeRemoteData(JSON.parse(rawContent));
    }

    if (!cfg.firebaseUrl || !cfg.firebaseKey) return null;
    const endpoint = getFirebaseEndpoint(cfg.firebaseUrl, cfg.firebaseKey);
    const resp = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(`Firebase (${resp.status}): ${resp.statusText}`);
    }
    const parsed = await resp.json();
    if (!parsed) return null;
    return normalizeRemoteData(parsed);
  }

  async function writeCloudRemote(cfg, dataObj) {
    const payloadToSave = {
      cards: dataObj.cards,
      transactions: dataObj.transactions,
      agendaItems: dataObj.agendaItems,
      updatedAt: Number(dataObj.updatedAt) || Date.now()
    };

    if (cfg.provider === 'github') {
      const token = cfg.githubToken.trim();
      const hasGist = Boolean(cfg.gistId && cfg.gistId.trim());
      const url = hasGist
        ? `https://api.github.com/gists/${encodeURIComponent(cfg.gistId.trim())}`
        : 'https://api.github.com/gists';
      const method = hasGist ? 'PATCH' : 'POST';
      const body = {
        description: 'Sincronização Central Life & Finanças',
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(payloadToSave, null, 2)
          }
        }
      };
      if (!hasGist) body.public = false;

      const resp = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => '');
        throw new Error(`GitHub (${resp.status}): ${errBody || resp.statusText}`);
      }
      const createdOrUpdated = await resp.json();
      return { gistId: createdOrUpdated.id };
    }

    const endpoint = getFirebaseEndpoint(cfg.firebaseUrl, cfg.firebaseKey);
    const resp = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadToSave)
    });
    if (!resp.ok) {
      throw new Error(`Firebase (${resp.status}): ${resp.statusText}`);
    }
    return {};
  }

  function scheduleCloudPush() {
    if (!cloudConfig.enabled) return;
    if (cloudRuntime.pendingPushTimer) {
      clearTimeout(cloudRuntime.pendingPushTimer);
    }
    cloudRuntime.pendingPushTimer = setTimeout(() => {
      cloudRuntime.pendingPushTimer = null;
      pushToCloud({ silent: true });
    }, 700);
  }

  async function pushToCloud(options = {}) {
    if (!cloudConfig.enabled || cloudRuntime.isSyncing) return false;
    cloudRuntime.isSyncing = true;
    cloudRuntime.lastError = '';
    updateCloudStatusUI();
    try {
      if (!appData.updatedAt) {
        appData.updatedAt = Date.now();
        saveData({ sync: false });
      }
      const res = await writeCloudRemote(cloudConfig, appData);
      if (res.gistId && !cloudConfig.gistId) {
        cloudConfig.gistId = res.gistId;
        const gistInput = document.getElementById('cloudGithubGistId');
        if (gistInput) gistInput.value = res.gistId;
      }
      cloudConfig.lastSyncedAt = Date.now();
      cloudRuntime.status = 'connected';
      saveCloudConfig();
      if (options.showToastOnSuccess) {
        showToast('Dados enviados para a nuvem!', 'success');
      }
      return true;
    } catch (err) {
      console.error('Erro ao enviar para nuvem:', err);
      cloudRuntime.status = 'error';
      cloudRuntime.lastError = err.message || 'Falha de conexão';
      if (!options.silent) {
        showToast(`Erro ao sincronizar: ${cloudRuntime.lastError}`, 'error');
      }
      return false;
    } finally {
      cloudRuntime.isSyncing = false;
      updateCloudStatusUI();
    }
  }

  async function pullFromCloud(options = {}) {
    if (!cloudConfig.enabled || cloudRuntime.isSyncing) return false;
    if (cloudRuntime.pendingPushTimer && !options.forceOverwrite) {
      return false;
    }
    cloudRuntime.isSyncing = true;
    cloudRuntime.lastError = '';
    updateCloudStatusUI();
    try {
      const remote = await readCloudRemote(cloudConfig);
      cloudConfig.lastSyncedAt = Date.now();
      cloudRuntime.status = 'connected';
      saveCloudConfig();

      if (remote) {
        const localUpdated = Number(appData.updatedAt) || 0;
        const remoteUpdated = Number(remote.updatedAt) || 0;
        if (options.forceOverwrite || remoteUpdated > localUpdated) {
          appData = remote;
          saveData({ sync: false });
          renderAll();
          if (options.showSuccessToast) {
            showToast('Dados sincronizados da nuvem!', 'success');
          }
          return true;
        }
      }
      if (options.showSuccessToast) {
        showToast('Tudo já está atualizado!', 'success');
      }
      return true;
    } catch (err) {
      console.error('Erro ao baixar da nuvem:', err);
      cloudRuntime.status = 'error';
      cloudRuntime.lastError = err.message || 'Falha de conexão';
      if (!options.silent) {
        showToast(`Erro ao baixar da nuvem: ${cloudRuntime.lastError}`, 'error');
      }
      return false;
    } finally {
      cloudRuntime.isSyncing = false;
      updateCloudStatusUI();
    }
  }

  async function syncNowSmart() {
    if (!cloudConfig.enabled || cloudRuntime.isSyncing) return;
    cloudRuntime.isSyncing = true;
    cloudRuntime.lastError = '';
    updateCloudStatusUI();
    try {
      const remote = await readCloudRemote(cloudConfig);
      const localUpdated = Number(appData.updatedAt) || 0;
      const remoteUpdated = remote ? (Number(remote.updatedAt) || 0) : 0;

      if (!remote || localUpdated > remoteUpdated) {
        if (!appData.updatedAt) {
          appData.updatedAt = Date.now();
          saveData({ sync: false });
        }
        const res = await writeCloudRemote(cloudConfig, appData);
        if (res.gistId && !cloudConfig.gistId) {
          cloudConfig.gistId = res.gistId;
        }
        cloudConfig.lastSyncedAt = Date.now();
        cloudRuntime.status = 'connected';
        saveCloudConfig();
        showToast('Dados locais enviados para a nuvem!', 'success');
      } else if (remoteUpdated > localUpdated) {
        appData = remote;
        saveData({ sync: false });
        cloudConfig.lastSyncedAt = Date.now();
        cloudRuntime.status = 'connected';
        saveCloudConfig();
        renderAll();
        showToast('Atualizações baixadas da nuvem!', 'success');
      } else {
        cloudConfig.lastSyncedAt = Date.now();
        cloudRuntime.status = 'connected';
        saveCloudConfig();
        showToast('PC e celular já estão sincronizados!', 'success');
      }
    } catch (err) {
      console.error('Erro na sincronização manual:', err);
      cloudRuntime.status = 'error';
      cloudRuntime.lastError = err.message || 'Falha de conexão';
      showToast(`Erro ao sincronizar: ${cloudRuntime.lastError}`, 'error');
    } finally {
      cloudRuntime.isSyncing = false;
      updateCloudStatusUI();
    }
  }

  async function handleCloudConnectSubmit(e) {
    e.preventDefault();
    const provider = document.getElementById('cloudProviderInput').value;
    const conflictMode = document.getElementById('cloudInitialConflictMode').value;

    const nextConfig = {
      ...cloudConfig,
      enabled: true,
      provider
    };

    if (provider === 'github') {
      const token = document.getElementById('cloudGithubToken').value.trim();
      const gistId = document.getElementById('cloudGithubGistId').value.trim();
      if (!token) {
        showToast('Informe o Token do GitHub com permissão "gist".', 'error');
        return;
      }
      nextConfig.githubToken = token;
      nextConfig.gistId = gistId;
    } else {
      const url = document.getElementById('cloudFirebaseUrl').value.trim();
      const key = document.getElementById('cloudFirebaseKey').value.trim();
      if (!url || !key) {
        showToast('Informe a URL do Firebase e sua Chave Pessoal.', 'error');
        return;
      }
      nextConfig.firebaseUrl = url;
      nextConfig.firebaseKey = key;
    }

    cloudRuntime.isSyncing = true;
    cloudRuntime.lastError = '';
    updateCloudStatusUI();

    try {
      let didPull = false;
      if (provider === 'github' && !nextConfig.gistId) {
        if (!appData.updatedAt) {
          appData.updatedAt = Date.now();
          saveData({ sync: false });
        }
        const res = await writeCloudRemote(nextConfig, appData);
        nextConfig.gistId = res.gistId;
        document.getElementById('cloudGithubGistId').value = res.gistId;
      } else {
        const remote = await readCloudRemote(nextConfig);
        if (!remote || conflictMode === 'push') {
          if (!appData.updatedAt) {
            appData.updatedAt = Date.now();
            saveData({ sync: false });
          }
          await writeCloudRemote(nextConfig, appData);
        } else if (conflictMode === 'pull' || Number(remote.updatedAt) > (Number(appData.updatedAt) || 0)) {
          appData = remote;
          saveData({ sync: false });
          renderAll();
          didPull = true;
        } else if ((Number(appData.updatedAt) || 0) > Number(remote.updatedAt)) {
          await writeCloudRemote(nextConfig, appData);
        }
      }

      nextConfig.lastSyncedAt = Date.now();
      cloudConfig = nextConfig;
      cloudRuntime.status = 'connected';
      saveCloudConfig();
      showToast(didPull ? 'Conectado e dados baixados da nuvem!' : 'Nuvem conectada e sincronizada!', 'success');
    } catch (err) {
      console.error('Erro ao conectar à nuvem:', err);
      cloudRuntime.status = 'error';
      cloudRuntime.lastError = err.message || 'Verifique token, URL ou permissões';
      showToast(`Não foi possível conectar: ${cloudRuntime.lastError}`, 'error');
    } finally {
      cloudRuntime.isSyncing = false;
      updateCloudStatusUI();
    }
  }

  function copyMagicSyncLink() {
    if (!cloudConfig.enabled) {
      showToast('Conecte a nuvem primeiro antes de gerar o link.', 'error');
      return;
    }
    const payload = {
      provider: cloudConfig.provider,
      githubToken: cloudConfig.provider === 'github' ? cloudConfig.githubToken : '',
      gistId: cloudConfig.provider === 'github' ? cloudConfig.gistId : '',
      firebaseUrl: cloudConfig.provider === 'firebase' ? cloudConfig.firebaseUrl : '',
      firebaseKey: cloudConfig.provider === 'firebase' ? cloudConfig.firebaseKey : ''
    };
    const encoded = encodeBase64UTF8(JSON.stringify(payload));
    const baseUrl = window.location.href.split('#')[0];
    const magicLink = `${baseUrl}#sync=${encoded}`;
    const isLocalFile = window.location.protocol === 'file:';

    const finishCopy = () => {
      showToast(
        isLocalFile
          ? 'Link copiado! Dica: após publicar o site (Netlify/GitHub Pages), gere esse link pelo site para abrir no celular.'
          : 'Link mágico copiado! Envie para seu celular (WhatsApp) e abra lá para conectar automático.',
        'success'
      );
    };

    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = magicLink;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        finishCopy();
      } catch (err) {
        prompt('Copie o Link Mágico abaixo e abra no celular:', magicLink);
      }
      ta.remove();
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(magicLink).then(finishCopy).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function disconnectCloud() {
    if (!confirm('Desconectar sincronização na nuvem? Seus dados atuais continuarão salvos neste aparelho.')) {
      return;
    }
    if (cloudRuntime.pendingPushTimer) {
      clearTimeout(cloudRuntime.pendingPushTimer);
      cloudRuntime.pendingPushTimer = null;
    }
    cloudConfig.enabled = false;
    cloudRuntime.status = 'disconnected';
    cloudRuntime.lastError = '';
    saveCloudConfig();
    updateCloudStatusUI();
    showToast('Sincronização na nuvem desconectada.', 'info');
  }

  function initCloudSync() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#sync=')) {
      try {
        const b64 = hash.slice(6);
        const decoded = JSON.parse(decodeBase64UTF8(b64));
        if (decoded && (decoded.provider === 'github' || decoded.provider === 'firebase')) {
          cloudConfig = {
            enabled: true,
            provider: decoded.provider,
            githubToken: decoded.githubToken || '',
            gistId: decoded.gistId || '',
            firebaseUrl: decoded.firebaseUrl || '',
            firebaseKey: decoded.firebaseKey || '',
            lastSyncedAt: 0
          };
          saveCloudConfig();
          history.replaceState(null, '', window.location.pathname + window.location.search);
          updateCloudStatusUI();
          pullFromCloud({ forceOverwrite: true, showSuccessToast: true });
        }
      } catch (err) {
        console.error('Erro ao ler link mágico de sincronização:', err);
        showToast('Link de sincronização inválido.', 'error');
      }
    } else {
      updateCloudStatusUI();
      if (cloudConfig.enabled) {
        pullFromCloud({ silent: true });
      }
    }

    window.addEventListener('focus', () => {
      if (cloudConfig.enabled) pullFromCloud({ silent: true });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && cloudConfig.enabled) {
        pullFromCloud({ silent: true });
      }
    });

    if (cloudRuntime.pollIntervalId) {
      clearInterval(cloudRuntime.pollIntervalId);
    }
    cloudRuntime.pollIntervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && cloudConfig.enabled && !cloudRuntime.pendingPushTimer) {
        pullFromCloud({ silent: true });
      }
    }, 25000);
  }

  // =========================================================================
  // EVENTOS & DELEGAÇÃO
  // =========================================================================
  function bindEvents() {
    // Abas
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    function navigateMonth(delta) {
      uiState.selectedMonth = addMonthsToYM(uiState.selectedMonth, delta);
      const { year, month } = parseYearMonth(uiState.selectedMonth);
      const curDay = Number(uiState.selectedDate.split('-')[2]);
      uiState.selectedDate = `${uiState.selectedMonth}-${pad2(Math.min(curDay, daysInMonth(year, month)))}`;
      renderAll();
    }

    function navigateOverviewDay(deltaDays) {
      uiState.selectedDate = addDaysToISO(uiState.selectedDate, deltaDays);
      uiState.selectedMonth = uiState.selectedDate.slice(0, 7);
      renderAll();
    }

    function goToToday() {
      uiState.selectedMonth = getCurrentMonthISO();
      uiState.selectedDate = getTodayISO();
      renderAll();
    }

    // Navegador de mês (Cabeçalho e Calendário da Agenda)
    document.getElementById('btnPrevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('btnNextMonth').addEventListener('click', () => navigateMonth(1));
    document.getElementById('btnGoToday').addEventListener('click', goToToday);

    document.getElementById('btnCalPrevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('btnCalNextMonth').addEventListener('click', () => navigateMonth(1));
    document.getElementById('btnCalToday').addEventListener('click', goToToday);

    // Ações rápidas cabeçalho
    document.getElementById('btnQuickNewTransaction').addEventListener('click', () => {
      openTransactionModal({ type: 'expense', date: uiState.selectedDate });
    });

    document.getElementById('btnQuickNewAgenda').addEventListener('click', () => {
      openAgendaModal({ date: uiState.selectedDate });
    });

    // Menu Backup / Dados e Nuvem
    document.getElementById('btnCloudSync').addEventListener('click', openCloudModal);

    document.querySelectorAll('#cloudProviderTabs .type-btn').forEach((btn) => {
      btn.addEventListener('click', () => setCloudProviderUI(btn.dataset.cloudProvider));
    });

    document.getElementById('cloudSetupForm').addEventListener('submit', handleCloudConnectSubmit);
    document.getElementById('btnCloudSyncNow').addEventListener('click', syncNowSmart);
    document.getElementById('btnCopyMagicSyncLink').addEventListener('click', copyMagicSyncLink);
    document.getElementById('btnCloudDisconnect').addEventListener('click', disconnectCloud);

    const dataMenuBtn = document.getElementById('btnToggleDataMenu');
    const dataMenu = document.getElementById('dataDropdownMenu');
    dataMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = dataMenu.classList.toggle('hidden');
      dataMenuBtn.setAttribute('aria-expanded', String(!open));
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.backup-dropdown')) {
        dataMenu.classList.add('hidden');
        dataMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.getElementById('btnCopyBackupText').addEventListener('click', () => {
      dataMenu.classList.add('hidden');
      copyBackupText();
    });

    document.getElementById('btnPasteBackupText').addEventListener('click', () => {
      dataMenu.classList.add('hidden');
      pasteBackupText();
    });

    document.getElementById('btnExportJson').addEventListener('click', () => {
      dataMenu.classList.add('hidden');
      exportJSON();
    });

    document.getElementById('inputImportJson').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importJSON(file);
      e.target.value = '';
      dataMenu.classList.add('hidden');
    });

    document.getElementById('btnRestoreExamples').addEventListener('click', () => {
      dataMenu.classList.add('hidden');
      if (confirm('Substituir os dados atuais pelos exemplos iniciais?')) {
        appData = createSeedData();
        saveData();
        renderAll();
        showToast('Exemplos restaurados.', 'info');
      }
    });

    document.getElementById('btnClearAllData').addEventListener('click', () => {
      dataMenu.classList.add('hidden');
      if (confirm('Tem certeza que deseja limpar todos os lançamentos, cartões e agenda para começar do zero?')) {
        appData = { cards: [], transactions: [], agendaItems: [] };
        saveData();
        renderAll();
        showToast('Todos os dados foram limpos.', 'info');
      }
    });

    // Filtros e Navegação de Dias na Visão Geral
    document.getElementById('btnOverviewPrevDay').addEventListener('click', () => navigateOverviewDay(-1));
    document.getElementById('btnOverviewNextDay').addEventListener('click', () => navigateOverviewDay(1));
    document.getElementById('btnOverviewToday').addEventListener('click', goToToday);

    document.querySelectorAll('#overviewAgendaFilter .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.overviewAgendaScope = btn.dataset.scope;
        document.querySelectorAll('#overviewAgendaFilter .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderOverviewTab();
      });
    });

    document.querySelectorAll('#overviewTxTabSwitch .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.overviewTxTab = btn.dataset.overviewTxTab;
        renderOverviewTab();
      });
    });

    // Filtros Agenda e Período (Data Inicial / Data Final)
    document.querySelectorAll('#agendaScopeFilter .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.agendaScope = btn.dataset.scope;
        document.querySelectorAll('#agendaScopeFilter .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderAgendaTab();
      });
    });

    document.getElementById('agendaStartDate').addEventListener('change', (e) => {
      uiState.agendaStartDate = e.target.value;
      if (e.target.value) {
        uiState.selectedDate = e.target.value;
        uiState.selectedMonth = e.target.value.slice(0, 7);
        renderAll();
      } else {
        renderAgendaTab();
      }
    });

    document.getElementById('agendaEndDate').addEventListener('change', (e) => {
      uiState.agendaEndDate = e.target.value;
      renderAgendaTab();
    });

    document.getElementById('btnClearAgendaRange').addEventListener('click', () => {
      uiState.agendaStartDate = '';
      uiState.agendaEndDate = '';
      document.getElementById('agendaStartDate').value = '';
      document.getElementById('agendaEndDate').value = '';
      renderAgendaTab();
    });

    document.getElementById('btnToggleEarlyHours').addEventListener('click', () => {
      uiState.showEarlyHours = !uiState.showEarlyHours;
      renderSelectedDayPanel();
    });

    document.getElementById('btnAddAgendaForDay').addEventListener('click', () => {
      openAgendaModal({ date: uiState.selectedDate });
    });

    // Eventos da Janelinha do Dia
    document.getElementById('btnPopupPrevDay').addEventListener('click', () => {
      openDayPopupModal(addDaysToISO(uiState.selectedDate, -1));
    });

    document.getElementById('btnPopupNextDay').addEventListener('click', () => {
      openDayPopupModal(addDaysToISO(uiState.selectedDate, 1));
    });

    document.getElementById('btnPopupOpenFullAgendaModal').addEventListener('click', () => {
      closeModal('dayPopupModalBackdrop');
      openAgendaModal({ date: uiState.selectedDate });
    });

    document.getElementById('dayPopupQuickTaskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('dayPopupQuickTaskTitle');
      const title = titleInput.value.trim();
      if (!title) return;
      appData.agendaItems.push({
        id: uid('ag'),
        title,
        date: uiState.selectedDate,
        itemType: 'task',
        scope: document.getElementById('dayPopupQuickTaskScope').value,
        startTime: '',
        endTime: '',
        priority: document.getElementById('dayPopupQuickTaskPriority').value,
        completed: false,
        notes: ''
      });
      titleInput.value = '';
      saveData();
      renderAll();
      showToast('Tarefa adicionada!', 'success');
    });

    // Adição rápida de tarefa no dia
    document.getElementById('quickTaskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('quickTaskTitle');
      const title = titleInput.value.trim();
      if (!title) return;
      appData.agendaItems.push({
        id: uid('ag'),
        title,
        date: uiState.selectedDate,
        itemType: 'task',
        scope: document.getElementById('quickTaskScope').value,
        startTime: '',
        endTime: '',
        priority: document.getElementById('quickTaskPriority').value,
        completed: false,
        notes: ''
      });
      titleInput.value = '';
      saveData();
      renderAll();
      showToast('Tarefa adicionada!', 'success');
    });

    // Abas O que Saiu / O que Entrou e Filtros Finanças
    document.querySelectorAll('#financeDirectionTabs .direction-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.financeDirection = btn.dataset.direction;
        renderFinancesTab();
      });
    });

    document.querySelectorAll('#financeTypeFilter .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.financeTypeFilter = btn.dataset.filter;
        renderFinancesTab();
      });
    });

    document.getElementById('financeCardFilter').addEventListener('change', (e) => {
      uiState.financeCardFilter = e.target.value;
      renderFinancesTab();
    });

    document.getElementById('financeSearchInput').addEventListener('input', (e) => {
      uiState.financeSearch = e.target.value;
      renderFinancesTab();
    });

    document.getElementById('btnAddExpenseShortcut').addEventListener('click', () => {
      openTransactionModal({ type: 'expense', date: uiState.selectedDate });
    });

    document.getElementById('btnAddIncomeShortcut').addEventListener('click', () => {
      openTransactionModal({ type: 'income', date: uiState.selectedDate });
    });

    // Botão Novo Cartão
    document.getElementById('btnNewCard').addEventListener('click', () => openCardModal());

    // Eventos do Modal de Transação
    document.querySelectorAll('#transactionForm .type-btn').forEach((btn) => {
      btn.addEventListener('click', () => setTxTypeUI(btn.dataset.txType));
    });

    document.getElementById('txPaymentMethod').addEventListener('change', updateTxFormVisibility);
    document.getElementById('txCardId').addEventListener('change', updateTxFormVisibility);
    document.getElementById('txPurchaseDate').addEventListener('change', () => {
      uiState.billingMonthManuallyEdited = false;
      updateSuggestedBillingMonthIfAuto();
      updateInstallmentPreview();
    });
    document.getElementById('txFirstBillingMonth').addEventListener('change', () => {
      uiState.billingMonthManuallyEdited = true;
      updateInstallmentPreview();
    });
    document.querySelectorAll('input[name="amountInputMode"]').forEach((r) => {
      r.addEventListener('change', updateInstallmentPreview);
    });
    document.getElementById('txAmountInput').addEventListener('input', updateInstallmentPreview);
    document.getElementById('txInstallmentCount').addEventListener('change', updateInstallmentPreview);
    document.getElementById('btnQuickCreateCard').addEventListener('click', () => openCardModal());
    document.getElementById('transactionForm').addEventListener('submit', handleSaveTransaction);

    // Eventos do Modal de Agenda
    document.querySelectorAll('#agendaForm .type-btn').forEach((btn) => {
      btn.addEventListener('click', () => setAgItemTypeUI(btn.dataset.agType));
    });
    document.getElementById('agendaForm').addEventListener('submit', handleSaveAgendaItem);
    document.getElementById('btnDeleteAgendaItem').addEventListener('click', () => {
      const id = document.getElementById('agId').value;
      if (!id) return;
      appData.agendaItems = appData.agendaItems.filter((a) => a.id !== id);
      saveData();
      closeModal('agendaModalBackdrop');
      renderAll();
      showToast('Item removido da agenda.', 'info');
    });

    // Eventos do Modal de Cartão
    document.querySelectorAll('#cardColorPresets .color-swatch').forEach((sw) => {
      sw.addEventListener('click', () => setCardColorUI(sw.dataset.color));
    });
    document.getElementById('cardColor').addEventListener('input', (e) => setCardColorUI(e.target.value));
    document.getElementById('cardForm').addEventListener('submit', handleSaveCard);

    // Fechar modais
    document.querySelectorAll('.close-modal').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal(backdrop.id);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const agendaModal = document.getElementById('agendaModalBackdrop');
        if (!agendaModal.classList.contains('hidden')) {
          agendaModal.classList.add('hidden');
          return;
        }
        document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach((m) => m.classList.add('hidden'));
      }
    });

    // Delegação Global para Elementos Dinâmicos
    document.addEventListener('click', (e) => {
      const gotoBtn = e.target.closest('[data-goto-tab]');
      if (gotoBtn) {
        closeModal('dayPopupModalBackdrop');
        if (gotoBtn.dataset.financeFilter) {
          uiState.financeDirection = 'out';
          uiState.financeTypeFilter = gotoBtn.dataset.financeFilter;
        }
        switchTab(gotoBtn.dataset.gotoTab);
        renderAll();
        return;
      }

      const calDayBtn = e.target.closest('[data-select-date]');
      if (calDayBtn) {
        openDayPopupModal(calDayBtn.dataset.selectDate);
        return;
      }

      const editAgBtn = e.target.closest('[data-edit-agenda]');
      if (editAgBtn) {
        e.stopPropagation();
        openAgendaModal({ agendaId: editAgBtn.dataset.editAgenda });
        return;
      }

      const delAgBtn = e.target.closest('[data-delete-agenda]');
      if (delAgBtn) {
        const id = delAgBtn.dataset.deleteAgenda;
        appData.agendaItems = appData.agendaItems.filter((a) => a.id !== id);
        saveData();
        renderAll();
        showToast('Item removido.', 'info');
        return;
      }

      const hourBody = e.target.closest('[data-slot-hour]');
      if (hourBody && !e.target.closest('[data-edit-agenda]')) {
        openAgendaModal({
          itemType: 'event',
          date: uiState.selectedDate,
          startTime: hourBody.dataset.slotHour
        });
        return;
      }

      const editTxBtn = e.target.closest('[data-edit-tx]');
      if (editTxBtn) {
        openTransactionModal({ txId: editTxBtn.dataset.editTx });
        return;
      }

      const delTxBtn = e.target.closest('[data-delete-tx]');
      if (delTxBtn) {
        const id = delTxBtn.dataset.deleteTx;
        if (confirm('Excluir este lançamento? (Se for parcelado, removerá todas as parcelas dele)')) {
          appData.transactions = appData.transactions.filter((t) => t.id !== id);
          saveData();
          renderAll();
          showToast('Lançamento excluído.', 'info');
        }
        return;
      }

      const togglePaidTx = e.target.closest('[data-toggle-tx-paid]');
      if (togglePaidTx) {
        const id = togglePaidTx.dataset.toggleTxPaid;
        const tx = appData.transactions.find((t) => t.id === id);
        if (tx) {
          const ym = uiState.selectedMonth;
          const list = Array.isArray(tx.paidMonths) ? tx.paidMonths : [];
          tx.paidMonths = list.includes(ym) ? list.filter((m) => m !== ym) : [...list, ym];
          saveData();
          renderAll();
        }
        return;
      }

      const toggleInvPaid = e.target.closest('[data-toggle-invoice-paid]');
      if (toggleInvPaid) {
        const card = getCardById(toggleInvPaid.dataset.toggleInvoicePaid);
        if (card) {
          const ym = uiState.selectedMonth;
          const list = Array.isArray(card.paidInvoices) ? card.paidInvoices : [];
          const willBePaid = !list.includes(ym);
          card.paidInvoices = willBePaid ? [...list, ym] : list.filter((m) => m !== ym);
          saveData();
          renderAll();
          showToast(willBePaid ? `Fatura de ${card.name} marcada como paga!` : `Fatura de ${card.name} reaberta.`, 'success');
        }
        return;
      }

      const newTxCard = e.target.closest('[data-new-tx-for-card]');
      if (newTxCard) {
        openTransactionModal({
          type: 'expense',
          paymentMethod: 'card',
          cardId: newTxCard.dataset.newTxForCard,
          date: uiState.selectedDate
        });
        return;
      }

      const editCardBtn = e.target.closest('[data-edit-card]');
      if (editCardBtn) {
        openCardModal(editCardBtn.dataset.editCard);
        return;
      }

      const delCardBtn = e.target.closest('[data-delete-card]');
      if (delCardBtn) {
        const cardId = delCardBtn.dataset.deleteCard;
        const linkedCount = appData.transactions.filter((t) => t.cardId === cardId).length;
        const msg = linkedCount > 0
          ? `Este cartão possui ${linkedCount} lançamento(s) vinculados. Deseja excluir o cartão e seus lançamentos?`
          : 'Deseja excluir este cartão?';
        if (confirm(msg)) {
          appData.cards = appData.cards.filter((c) => c.id !== cardId);
          appData.transactions = appData.transactions.filter((t) => t.cardId !== cardId);
          saveData();
          renderAll();
          showToast('Cartão excluído.', 'info');
        }
      }
    });

    // Checkboxes da Agenda
    document.addEventListener('change', (e) => {
      const cb = e.target.closest('[data-toggle-agenda]');
      if (cb) {
        const item = appData.agendaItems.find((a) => a.id === cb.dataset.toggleAgenda);
        if (item) {
          item.completed = cb.checked;
          saveData();
          renderAll();
        }
      }
    });
  }

  // Inicialização
  bindEvents();
  renderAll();
  initCloudSync();
})();
