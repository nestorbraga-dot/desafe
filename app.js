// app.js
// Lógica do cliente para o Cardápio Digital

// --- ESTADO GLOBAL DA TELA DO CLIENTE ---
let currentCustomerName = '';
let currentTableNumber = '';
let activeCategory = 'burgers';
let currentProducts = [];
let cart = [];
let activeOrderId = null;
let detailProduct = null; // Produto selecionado para o modal de detalhes

// --- ELEMENTOS DO DOM ---
const welcomeOverlay = document.getElementById('welcome-overlay');
const welcomeForm = document.getElementById('welcome-form');
const inputCustomerName = document.getElementById('input-customer-name');
const inputTableNumber = document.getElementById('input-table-number');
const clientBadge = document.getElementById('client-badge');
const badgeName = document.getElementById('badge-name');
const badgeTable = document.getElementById('badge-table');

const searchInput = document.getElementById('search-input');
const categoriesTabsList = document.getElementById('categories-tabs-list');
const productsGridContainer = document.getElementById('products-grid-container');
const currentCategoryTitle = document.getElementById('current-category-title');

const floatCartBtn = document.getElementById('float-cart-btn');
const cartCounter = document.getElementById('cart-counter');
const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotalValue = document.getElementById('cart-total-value');
const btnSubmitOrder = document.getElementById('btn-submit-order');

// Modal de Detalhes
const detailModalOverlay = document.getElementById('detail-modal-overlay');
const modalProductImg = document.getElementById('modal-product-img');
const modalProductName = document.getElementById('modal-product-name');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductDesc = document.getElementById('modal-product-desc');
const modalProductObs = document.getElementById('modal-product-obs');
const modalQtyVal = document.getElementById('modal-qty-val');
const modalBtnMinus = document.getElementById('modal-btn-minus');
const modalBtnPlus = document.getElementById('modal-btn-plus');
const modalBtnAddToCart = document.getElementById('modal-btn-add-to-cart');

// Rastreador de Pedidos
const orderTracker = document.getElementById('order-tracker');
const trackerOrderId = document.getElementById('tracker-order-id');
const trackerProgress = document.getElementById('tracker-progress');
const stepPending = document.getElementById('step-pending');
const stepPreparing = document.getElementById('step-preparing');
const stepDelivered = document.getElementById('step-delivered');

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
  // Carrega sessão do cliente se já existir
  checkClientSession();
  
  // Inscreve-se para atualizações em tempo real (mudança de status do pedido pela cozinha)
  setupRealtimeSubscription();

  // Inicializa Categorias e Produtos
  await loadCategories();
  await loadProducts();

  // Recupera pedido ativo anterior (se houver) para continuar rastreando
  restoreActiveOrder();

  // Event Listeners
  setupEventListeners();
});

// --- CONTROLE DE SESSÃO ---
function checkClientSession() {
  const savedName = localStorage.getItem('client_name');
  const savedTable = localStorage.getItem('client_table');

  if (savedName && savedTable) {
    currentCustomerName = savedName;
    currentTableNumber = savedTable;
    
    // Atualiza badges
    badgeName.textContent = currentCustomerName;
    badgeTable.textContent = currentTableNumber;
    clientBadge.style.display = 'flex';
    floatCartBtn.style.display = 'flex';
    
    // Esconde tela de boas-vindas
    welcomeOverlay.classList.add('hidden');
  } else {
    welcomeOverlay.classList.remove('hidden');
  }
}

welcomeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  currentCustomerName = inputCustomerName.value.trim();
  currentTableNumber = inputTableNumber.value.trim();

  if (currentCustomerName && currentTableNumber) {
    localStorage.setItem('client_name', currentCustomerName);
    localStorage.setItem('client_table', currentTableNumber);

    badgeName.textContent = currentCustomerName;
    badgeTable.textContent = currentTableNumber;
    clientBadge.style.display = 'flex';
    floatCartBtn.style.display = 'flex';

    welcomeOverlay.classList.add('hidden');
  }
});

// --- EVENT LISTENERS GERAIS ---
function setupEventListeners() {
  // Busca por digitação
  searchInput.addEventListener('input', () => {
    renderProducts();
  });

  // Carrinho - Abertura e Fechamento
  floatCartBtn.addEventListener('click', () => {
    cartDrawerOverlay.classList.add('open');
    renderCart();
  });
  closeCartBtn.addEventListener('click', () => {
    cartDrawerOverlay.classList.remove('open');
  });
  cartDrawerOverlay.addEventListener('click', (e) => {
    if (e.target === cartDrawerOverlay) {
      cartDrawerOverlay.classList.remove('open');
    }
  });

  // Modal de Detalhes - Fechamento
  detailModalOverlay.addEventListener('click', (e) => {
    if (e.target === detailModalOverlay) {
      closeDetailModal();
    }
  });

  // Modal - Controle de Quantidade
  modalBtnMinus.addEventListener('click', () => {
    let qty = parseInt(modalQtyVal.textContent);
    if (qty > 1) {
      modalQtyVal.textContent = qty - 1;
    }
  });
  modalBtnPlus.addEventListener('click', () => {
    let qty = parseInt(modalQtyVal.textContent);
    modalQtyVal.textContent = qty + 1;
  });

  // Modal - Adicionar ao carrinho
  modalBtnAddToCart.addEventListener('click', () => {
    const qty = parseInt(modalQtyVal.textContent);
    const obs = modalProductObs.value.trim();
    addToCart(detailProduct, qty, obs);
    closeDetailModal();
  });

  // Enviar Pedido
  btnSubmitOrder.addEventListener('click', submitOrder);
}

// --- CARREGAR DADOS ---
async function loadCategories() {
  const categories = await dataService.getCategories();
  categoriesTabsList.innerHTML = '';
  
  categories.forEach((cat, index) => {
    const tab = document.createElement('button');
    tab.className = `category-tab ${cat.id === activeCategory ? 'active' : ''}`;
    tab.innerHTML = `${cat.icon} <span>${cat.name}</span>`;
    tab.setAttribute('data-id', cat.id);
    
    tab.addEventListener('click', () => {
      // Altera categoria ativa
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = cat.id;
      currentCategoryTitle.textContent = `Nossos ${cat.name}`;
      renderProducts();
    });
    
    categoriesTabsList.appendChild(tab);
  });
}

async function loadProducts() {
  currentProducts = await dataService.getProducts();
  renderProducts();
}

// --- RENDERIZAR PRODUTOS ---
function renderProducts() {
  productsGridContainer.innerHTML = '';
  const searchQ = searchInput.value.toLowerCase().trim();
  
  // Filtra produtos por categoria e palavra-chave da busca
  const filtered = currentProducts.filter(p => {
    const matchesCategory = p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQ) || 
                          p.description.toLowerCase().includes(searchQ);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    productsGridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px 0;">
        <span style="font-size: 40px; display: block; margin-bottom: 10px;">🔍</span>
        Nenhum item encontrado nesta busca.
      </div>
    `;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('article');
    card.className = `product-card ${!p.available ? 'sold-out' : ''}`;
    
    // Tag visual
    let tagHTML = '';
    if (p.tags && p.tags.length > 0) {
      tagHTML = `<div class="product-tags">` + 
        p.tags.map(t => `<span class="tag ${t === 'Mais Pedido' ? 'popular' : ''}">${t}</span>`).join('') + 
        `</div>`;
    }

    card.innerHTML = `
      <div class="product-image-container">
        <img src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300'">
        ${tagHTML}
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <span class="product-price">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
          <button class="btn-add-cart" data-id="${p.id}">${p.available ? '+' : '✕'}</button>
        </div>
      </div>
    `;

    // Evento de abrir o modal de detalhes (se estiver disponível)
    if (p.available) {
      card.addEventListener('click', (e) => {
        // Evita abrir o modal se clicar especificamente no botão de adicionar direto
        if (e.target.closest('.btn-add-cart')) return;
        openDetailModal(p);
      });

      card.querySelector('.btn-add-cart').addEventListener('click', () => {
        openDetailModal(p);
      });
    }

    productsGridContainer.appendChild(card);
  });
}

// --- MODAL DE DETALHES ---
function openDetailModal(product) {
  detailProduct = product;
  modalProductImg.src = product.image;
  modalProductImg.onerror = function() {
    this.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300';
  };
  modalProductName.textContent = product.name;
  modalProductPrice.textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
  modalProductDesc.textContent = product.description;
  modalProductObs.value = '';
  modalQtyVal.textContent = '1';
  
  detailModalOverlay.classList.add('open');
}

function closeDetailModal() {
  detailModalOverlay.classList.remove('open');
  detailProduct = null;
}

// --- GERENCIAMENTO DO CARRINHO ---
function addToCart(product, quantity, observations) {
  // Verifica se já tem o mesmo produto com a mesma observação no carrinho
  const existingIndex = cart.findIndex(item => item.product.id === product.id && item.observations === observations);
  
  if (existingIndex !== -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ product, quantity, observations });
  }

  updateCartBadge();
  renderCart();
  
  // Pequena animação no botão de carrinho flutuante
  floatCartBtn.style.transform = 'scale(1.2)';
  setTimeout(() => {
    floatCartBtn.style.transform = 'scale(1)';
  }, 200);
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCounter.textContent = totalItems;
}

function renderCart() {
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.<br>Escolha produtos deliciosos no menu!</p>';
    cartSubtotal.textContent = 'R$ 0,00';
    cartTotalValue.textContent = 'R$ 0,00';
    btnSubmitOrder.disabled = true;
    btnSubmitOrder.style.opacity = 0.5;
    return;
  }

  btnSubmitOrder.disabled = false;
  btnSubmitOrder.style.opacity = 1;
  let subtotal = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;
    
    const div = document.createElement('div');
    div.className = 'cart-item';
    
    let obsHTML = '';
    if (item.observations) {
      obsHTML = `<div class="cart-item-obs">Obs: "${item.observations}"</div>`;
    }

    div.innerHTML = `
      <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300'">
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.product.name}</h4>
        ${obsHTML}
        <span class="cart-item-price">R$ ${item.product.price.toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn" onclick="updateCartItemQty(${index}, -1)">-</button>
        <span class="qty-val">${item.quantity}</span>
        <button class="qty-btn" onclick="updateCartItemQty(${index}, 1)">+</button>
        <button class="remove-item-btn" onclick="removeCartItem(${index})">🗑️</button>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });

  cartSubtotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
  cartTotalValue.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

// Expõe funções do carrinho globalmente para os botões inline funcionarem
window.updateCartItemQty = (index, delta) => {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  updateCartBadge();
  renderCart();
};

window.removeCartItem = (index) => {
  cart.splice(index, 1);
  updateCartBadge();
  renderCart();
};

// --- ENVIO DO PEDIDO ---
async function submitOrder() {
  if (cart.length === 0) return;

  const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const orderData = {
    customerName: currentCustomerName,
    tableNumber: currentTableNumber,
    items: cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      observations: item.observations
    })),
    totalPrice: totalPrice
  };

  btnSubmitOrder.innerHTML = 'Enviando... ⏳';
  btnSubmitOrder.disabled = true;

  try {
    const createdOrder = await dataService.createOrder(orderData);
    
    // Sucesso! Limpa carrinho e fecha gaveta
    cart = [];
    updateCartBadge();
    cartDrawerOverlay.classList.remove('open');
    btnSubmitOrder.innerHTML = 'Enviar Pedido para a Cozinha 🚀';
    
    // Define pedido ativo para rastreamento
    activeOrderId = createdOrder.id;
    localStorage.setItem('active_order_id', activeOrderId);
    
    // Atualiza e exibe o monitor de status
    updateTrackerUI(createdOrder);
    
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar pedido. Tente novamente.');
    btnSubmitOrder.innerHTML = 'Enviar Pedido para a Cozinha 🚀';
    btnSubmitOrder.disabled = false;
  }
}

// --- RASTREADOR DE PEDIDO (STATUS TRACKER) ---
function updateTrackerUI(order) {
  if (!order) return;
  
  trackerOrderId.textContent = `#${order.id.replace('order-', '')}`;
  orderTracker.classList.add('active');

  // Reseta todos os nós
  stepPending.className = 'step-node';
  stepPreparing.className = 'step-node';
  stepDelivered.className = 'step-node';

  if (order.status === 'pending') {
    stepPending.className = 'step-node active';
    trackerProgress.style.width = '0%';
  } else if (order.status === 'preparing') {
    stepPending.className = 'step-node completed';
    stepPreparing.className = 'step-node active';
    trackerProgress.style.width = '50%';
  } else if (order.status === 'delivered') {
    stepPending.className = 'step-node completed';
    stepPreparing.className = 'step-node completed';
    stepDelivered.className = 'step-node completed';
    trackerProgress.style.width = '100%';
    
    // Se o pedido foi entregue, após 10 segundos esconde o rastreador
    setTimeout(() => {
      if (activeOrderId === order.id) {
        orderTracker.classList.remove('active');
        localStorage.removeItem('active_order_id');
        activeOrderId = null;
      }
    }, 12000);
  }
}

async function restoreActiveOrder() {
  const savedOrderId = localStorage.getItem('active_order_id');
  if (savedOrderId) {
    activeOrderId = savedOrderId;
    const orders = await dataService.getOrders();
    const activeOrder = orders.find(o => o.id === activeOrderId);
    if (activeOrder && activeOrder.status !== 'delivered') {
      updateTrackerUI(activeOrder);
    } else {
      localStorage.removeItem('active_order_id');
      activeOrderId = null;
    }
  }
}

// --- COMUNICAÇÃO EM TEMPO REAL (INSCRIÇÃO) ---
function setupRealtimeSubscription() {
  dataService.subscribe(async (msg) => {
    // Escuta mudanças de produtos (ex: marcar esgotado)
    if (msg.type === 'PRODUCTS_UPDATED') {
      currentProducts = msg.payload;
      renderProducts();
    }
    
    // Escuta atualizações do status do pedido dele
    if (msg.type === 'ORDER_STATUS_UPDATED') {
      const { orderId, status } = msg.payload;
      if (orderId === activeOrderId) {
        // Busca o pedido atualizado no localStorage
        const orders = await dataService.getOrders();
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) {
          updateTrackerUI(updatedOrder);
        }
      }
    }
  });
}
