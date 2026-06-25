// admin.js
// Lógica de administração e controle da cozinha

// --- ESTADO GLOBAL DO ADMIN ---
let orders = [];
let products = [];
let categories = [];
let isEditing = false;

// --- ELEMENTOS DO DOM ---
// Abas e Painéis
const tabBtnKitchen = document.getElementById('tab-btn-kitchen');
const tabBtnMenu = document.getElementById('tab-btn-menu');
const panelKitchen = document.getElementById('panel-kitchen');
const panelMenu = document.getElementById('panel-menu');

// Colunas do Kanban
const listPending = document.getElementById('list-pending');
const listPreparing = document.getElementById('list-preparing');
const listDelivered = document.getElementById('list-delivered');
const badgeCountPending = document.getElementById('badge-count-pending');
const badgeCountPreparing = document.getElementById('badge-count-preparing');
const badgeCountDelivered = document.getElementById('badge-count-delivered');

// CRUD Formulário e Tabela
const productsGrid = document.getElementById('products-grid');
const productForm = document.getElementById('product-form');
const formProductId = document.getElementById('form-product-id');
const formProductName = document.getElementById('form-product-name');
const formProductCategory = document.getElementById('form-product-category');
const formProductPrice = document.getElementById('form-product-price');
const formProductDesc = document.getElementById('form-product-desc');
const formProductImage = document.getElementById('form-product-image');
const formProductTags = document.getElementById('form-product-tags');
const formProductAvailable = document.getElementById('form-product-available');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const formTitle = document.getElementById('form-title');
const btnResetInitialMenu = document.getElementById('btn-reset-initial-menu');

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
  // Carrega dados
  await loadData();

  // Inicializa visual do Kanban e Grid CRUD
  renderKitchenBoard();
  renderProductsGrid();
  populateCategoryDropdown();

  // Configura Event Listeners
  setupEventListeners();

  // Inscreve-se nas atualizações em tempo real
  setupRealtimeSubscription();
});

// --- CARREGAR DADOS ---
async function loadData() {
  orders = await dataService.getOrders();
  products = await dataService.getProducts();
  categories = await dataService.getCategories();
}

// --- CONFIGURAR EVENT LISTENERS ---
function setupEventListeners() {
  // Troca de Abas with safety checks
  if (tabBtnKitchen && tabBtnMenu && panelKitchen && panelMenu) {
    tabBtnKitchen.addEventListener('click', () => {
      tabBtnKitchen.classList.add('active');
      tabBtnMenu.classList.remove('active');
      panelKitchen.classList.add('active');
      panelMenu.classList.remove('active');
    });

    tabBtnMenu.addEventListener('click', () => {
      tabBtnMenu.classList.add('active');
      tabBtnKitchen.classList.remove('active');
      panelMenu.classList.add('active');
      panelKitchen.classList.remove('active');
    });
  } else {
    console.warn('Tab buttons or panels missing in DOM');
  }

  // Formulário CRUD - Envio (Adicionar / Editar)
  productForm.addEventListener('submit', handleProductFormSubmit);

  // Cancelar Edição
  btnCancelEdit.addEventListener('click', resetProductForm);

  // Restaurar Padrões
  btnResetInitialMenu.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja restaurar o cardápio padrão da lanchonete? Isso apagará as alterações feitas.')) {
      localStorage.removeItem('cardapio_products');
      await loadData();
      renderProductsGrid();
      // Notifica o cliente
      dataService.saveProducts(products);
    }
  });
}

// --- MONITOR DA COZINHA (KANBAN) ---
function renderKitchenBoard() {
  // Limpa as listas
  listPending.innerHTML = '';
  listPreparing.innerHTML = '';
  listDelivered.innerHTML = '';

  // Filtra apenas os pedidos não arquivados
  const activeOrders = orders.filter(o => o.status !== 'archived');

  let pendingCount = 0;
  let preparingCount = 0;
  let deliveredCount = 0;

  // Renderiza em ordem cronológica (FIFO - mais antigos primeiro)
  activeOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  activeOrders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.id = `card-${order.id}`;

    // Monta itens do pedido
    const itemsHTML = order.items.map(item => {
      const obsHTML = item.observations ? `<div class="order-card-item-obs">Obs: "${item.observations}"</div>` : '';
      return `
        <div class="order-card-item-container">
          <div class="order-card-item">
            <span><span class="order-card-item-qty">${item.quantity}x</span> ${item.name}</span>
            <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
          </div>
          ${obsHTML}
        </div>
      `;
    }).join('');

    // Define botão de ação dependendo do status do pedido
    let actionBtnHTML = '';
    if (order.status === 'pending') {
      actionBtnHTML = `
        <button class="order-action-btn" onclick="changeStatus('${order.id}', 'preparing')">
          🍳 Iniciar Preparo
        </button>
      `;
      pendingCount++;
      listPending.appendChild(card);
    } else if (order.status === 'preparing') {
      actionBtnHTML = `
        <button class="order-action-btn" onclick="changeStatus('${order.id}', 'delivered')" style="background: var(--primary); border-color: var(--primary); color: #fff;">
          ✅ Pronto / Entregar
        </button>
      `;
      preparingCount++;
      listPreparing.appendChild(card);
    } else if (order.status === 'delivered') {
      actionBtnHTML = `
        <button class="order-action-btn" onclick="changeStatus('${order.id}', 'archived')">
          📥 Arquivar
        </button>
      `;
      deliveredCount++;
      listDelivered.appendChild(card);
    }

    const timeString = new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
      <div class="order-card-header">
        <div class="order-card-table">Mesa <span>${order.tableNumber}</span></div>
        <div class="order-card-time">${timeString}</div>
      </div>
      <div class="order-card-customer">Cliente: <span>${order.customerName}</span></div>
      <div class="order-card-items-list">
        ${itemsHTML}
      </div>
      <div class="order-card-footer">
        <div class="order-card-total">Total: <span>R$ ${order.totalPrice.toFixed(2).replace('.', ',')}</span></div>
        ${actionBtnHTML}
      </div>
    `;
  });

  // Atualiza crachás das colunas
  badgeCountPending.textContent = pendingCount;
  badgeCountPreparing.textContent = preparingCount;
  badgeCountDelivered.textContent = deliveredCount;
}

// Mudar status do pedido
window.changeStatus = async (orderId, newStatus) => {
  const success = await dataService.updateOrderStatus(orderId, newStatus);
  if (success) {
    // Atualiza estado local e re-renderiza
    orders = await dataService.getOrders();
    renderKitchenBoard();
  }
};

// --- ALERTA SONORO ---
function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Duplo bip agradável e de alta qualidade
    const time = audioCtx.currentTime;
    
    // Nota 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, time); // D5
    gain1.gain.setValueAtTime(0.08, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(time);
    osc1.stop(time + 0.15);
    
    // Nota 2 (um pouco mais aguda e tocada logo em seguida)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, time + 0.15); // A5
    gain2.gain.setValueAtTime(0.08, time + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(time + 0.15);
    osc2.stop(time + 0.35);

  } catch (e) {
    console.warn("Audio Context bloqueado ou não suportado. Requer clique do usuário primeiro.", e);
  }
}

// --- GERENCIADOR DE CARDÁPIO (CRUD) ---
function populateCategoryDropdown() {
  formProductCategory.innerHTML = '';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = `${cat.icon} ${cat.name}`;
    formProductCategory.appendChild(option);
  });
}

function renderProductsGrid() {
  productsGrid.innerHTML = '';
  
  products.forEach(p => {
    const card = document.createElement('div');
    const categoryName = categories.find(c => c.id === p.category)?.name || p.category;
    
    card.className = 'product-card';
    card.dataset.id = p.id;
    
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=150'" />
      <h4 class="product-name">${p.name}</h4>
      <p class="product-category">${categoryName}</p>
      <p class="product-description" title="${p.description}">${p.description}</p>
      <p class="product-price">R$ ${p.price.toFixed(2).replace('.', ',')}</p>
      <p class="product-status ${p.available ? 'available' : 'unavailable'}">${p.available ? 'Disponível' : 'Indisponível'}</p>
      <div class="card-actions">
        <button class="btn-icon edit" onclick="startEditProduct('${p.id}')" title="Editar item">✏️</button>
        <button class="btn-icon" onclick="toggleProductAvailability('${p.id}')" title="Alternar Disponibilidade">🔌</button>
        <button class="btn-icon delete" onclick="deleteProduct('${p.id}')" title="Excluir item">🗑️</button>
      </div>
    `;
    productsGrid.appendChild(card);
  });
}

// Submissão do Formulário
async function handleProductFormSubmit(e) {
  e.preventDefault();

  const id = formProductId.value;
  const name = formProductName.value.trim();
  const category = formProductCategory.value;
  const price = parseFloat(formProductPrice.value);
  const description = formProductDesc.value.trim();
  const image = formProductImage.value;
  const available = formProductAvailable.checked;
  const tags = formProductTags.value.split(',').map(t => t.trim()).filter(t => t !== '');

  const productData = { name, category, price, description, image, available, tags };

  if (isEditing) {
    productData.id = id;
    const success = await dataService.updateProduct(productData);
    if (success) {
      alert('Produto atualizado com sucesso!');
    }
  } else {
    await dataService.addProduct(productData);
    alert('Produto adicionado com sucesso!');
  }

  // Recarrega lista, recria tabela e reseta form
  await loadData();
  renderProductsGrid();
  resetProductForm();
}

// Inicia modo edição
window.startEditProduct = (productId) => {
  const p = products.find(prod => prod.id === productId);
  if (!p) return;

  isEditing = true;
  formTitle.textContent = 'Editar Produto';
  formProductId.value = p.id;
  formProductName.value = p.name;
  formProductCategory.value = p.category;
  formProductPrice.value = p.price;
  formProductDesc.value = p.description;
  formProductImage.value = p.image;
  formProductTags.value = p.tags ? p.tags.join(', ') : '';
  formProductAvailable.checked = p.available;

  btnCancelEdit.style.display = 'inline-flex';
};

// Reseta o formulário
function resetProductForm() {
  isEditing = false;
  formTitle.textContent = 'Cadastrar Novo Produto';
  productForm.reset();
  formProductId.value = '';
  btnCancelEdit.style.display = 'none';
}

// Deletar Produto
window.deleteProduct = async (productId) => {
  if (confirm('Deseja realmente excluir este item do cardápio?')) {
    const success = await dataService.deleteProduct(productId);
    if (success) {
      await loadData();
      renderProductsGrid();
    }
  }
};

// Alternar Disponibilidade (Rápido)
window.toggleProductAvailability = async (productId) => {
  const p = products.find(prod => prod.id === productId);
  if (!p) return;

  p.available = !p.available;
  await dataService.updateProduct(p);
  await loadData();
  renderProductsGrid();
};

// --- REALTIME SUBSCRIPTION (SINCRONIZAÇÃO E ALERTA) ---
function setupRealtimeSubscription() {
  dataService.subscribe(async (msg) => {
    // 1. Escuta novos pedidos
    if (msg.type === 'NEW_ORDER') {
      // Toca som de alerta
      playNotificationSound();
      
      // Recarrega e re-renderiza kanban
      orders = await dataService.getOrders();
      renderKitchenBoard();
    }

    // 2. Escuta mudanças de produtos feitas em outras abas
    if (msg.type === 'PRODUCTS_UPDATED') {
      products = await dataService.getProducts();
      renderProductsGrid();
    }

    // 3. Escuta atualizações de status feitas em outras abas
    if (msg.type === 'ORDER_STATUS_UPDATED') {
      orders = await dataService.getOrders();
      renderKitchenBoard();
    }
  });
}
