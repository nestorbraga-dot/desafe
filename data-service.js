// data-service.js
// Updated to use Supabase backend with fallback to localStorage
// Camada de dados preparada para migração futura para o Supabase

const DB_KEYS = {
  CATEGORIES: 'cardapio_categories',
  PRODUCTS: 'cardapio_products',
  ORDERS: 'cardapio_orders'
}

// Default data for fallback when Supabase is unavailable
const DEFAULT_CATEGORIES = [
  { id: 'burgers', name: 'Hambúrgueres', icon: '🍔' },
  { id: 'sides', name: 'Acompanhamentos', icon: '🍟' },
  { id: 'drinks', name: 'Bebidas', icon: '🥤' },
  { id: 'desserts', name: 'Sobremesas', icon: '🍦' }
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Monster Cheddar Bacon',
    description: 'Pão brioche selado na manteiga, dois blends artesanais de 150g, muito cheddar cremoso derretido e tiras crocantes de bacon premium.',
    price: 38.90,
    category: 'burgers',
    image: 'assets/monster_cheddar.png',
    available: true,
    tags: ['Mais Pedido', 'Carne 150g']
  },
  {
    id: 'prod-2',
    name: 'Smash Duplo Salad',
    description: 'Pão brioche, dois blends smash de 80g ultra prensados com crostinha, queijo prato duplo, alface americana fresca, tomate e maionese da casa.',
    price: 29.90,
    category: 'burgers',
    image: 'assets/smash_salada.png',
    available: true,
    tags: ['Clássico']
  },
  {
    id: 'prod-3',
    name: 'Gourmet Gorgonzola',
    description: 'Pão de brioche, blend de costela de 180g, creme de queijo gorgonzola artesanal e cebola caramelizada na cerveja preta.',
    price: 42.00,
    category: 'burgers',
    image: 'assets/gorgonzola_gourmet.png',
    available: true,
    tags: ['Premium']
  },
  {
    id: 'prod-4',
    name: 'Batata Rústica da Casa',
    description: 'Porção generosa de batatas rústicas fritas com casca, temperadas com sal marinho, alecrim fresco e páprica defumada. Acompanha maionese verde.',
    price: 19.90,
    category: 'sides',
    image: 'assets/batata_rustica.png',
    available: true,
    tags: ['Crocante']
  },
  {
    id: 'prod-5',
    name: 'Anéis de Cebola (Onion Rings)',
    description: 'Anéis de cebola gigantes empanados em farinha panko super crocante. Acompanha molho barbecue artesanal.',
    price: 18.50,
    category: 'sides',
    image: 'assets/onion_rings.png',
    available: true,
    tags: ['Vegetariano']
  },
  {
    id: 'prod-6',
    name: 'Pink Lemonade Artesanal',
    description: 'Suco de limão siciliano espremido na hora com um toque especial de xarope artesanal de amora e cranberry. Refrescante e doce na medida certa.',
    price: 12.00,
    category: 'drinks',
    image: 'assets/pink_lemonade.png',
    available: true,
    tags: ['Gelado', 'Sem Álcool']
  },
  {
    id: 'prod-7',
    name: 'Refrigerante Lata',
    description: 'Lata de 350ml trincando de gelada. Escolha entre Coca-Cola, Guaraná Antarctica ou Fanta Laranja.',
    price: 6.50,
    category: 'drinks',
    image: 'assets/refrigerante.png',
    available: true,
    tags: ['Lata']
  },
  {
    id: 'prod-8',
    name: 'Milkshake de Nutella Real',
    description: 'Milkshake cremoso de sorvete de baunilha batido com muita Nutella legítima, finalizado com chantilly e calda de chocolate belga.',
    price: 22.00,
    category: 'desserts',
    image: 'assets/milkshake_nutella.png',
    available: true,
    tags: ['Sucesso de Vendas']
  },
  {
    id: 'prod-9',
    name: 'Taça Brownie Supremo',
    description: 'Pedaços quentes de brownie fudge artesanal, sorvete de creme, morangos frescos fatiados, raspas de chocolate meio amargo e muita calda quente.',
    price: 24.90,
    category: 'desserts',
    image: 'assets/taca_brownie.png',
    available: true,
    tags: ['Doce']
  }
];

// Existing code continues;

// Canal de comunicação em tempo real entre abas do navegador
const channel = new BroadcastChannel('cardapio_realtime');
// Initialize Supabase client if SDK is loaded
let supabase = null;
if (typeof window !== 'undefined' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY && typeof createClient === 'function') {
  supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

const dataService = {
  // --- CATEGORIAS ---
  async getCategories() {
    // Try Supabase first
    if (supabase) {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data && data.length) {
        return data;
      }
    }
    // Fallback to localStorage
    let categories = localStorage.getItem(DB_KEYS.CATEGORIES);
    if (!categories) {
      categories = DEFAULT_CATEGORIES;
      localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(categories));
    } else {
      categories = JSON.parse(categories);
    }
    return categories;
  },

  async saveCategories(categories) {
    // Save to Supabase if available
    if (supabase) {
      // Upsert each category (assuming each has an 'id' field)
      for (const cat of categories) {
        await supabase.from('categories').upsert(cat, { onConflict: 'id' });
      }
    }
    // Also persist locally for offline fallback
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(categories));
    this._broadcast('CATEGORIES_UPDATED', categories);
  },

  // --- PRODUTOS ---
  async getProducts() {
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data && data.length) {
        return data;
      }
    }
    let products = localStorage.getItem(DB_KEYS.PRODUCTS);
    if (!products) {
      products = DEFAULT_PRODUCTS;
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    } else {
      products = JSON.parse(products);
    }
    return products;
  },

  async saveProducts(products) {
    if (supabase) {
      for (const prod of products) {
        await supabase.from('products').upsert(prod, { onConflict: 'id' });
      }
    }
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    this._broadcast('PRODUCTS_UPDATED', products);
  },

  async addProduct(product) {
    const products = await this.getProducts();
    product.id = 'prod-' + Date.now();
    products.push(product);
    await this.saveProducts(products);
    return product;
  },

  async updateProduct(updatedProduct) {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      products[index] = updatedProduct;
      await this.saveProducts(products);
      return true;
    }
    return false;
  },

  async deleteProduct(productId) {
    let products = await this.getProducts();
    products = products.filter(p => p.id !== productId);
    await this.saveProducts(products);
    return true;
  },

  // --- PEDIDOS (ORDERS) ---
  async getOrders() {
    if (supabase) {
      const { data, error } = await supabase.from('orders').select('*');
      if (!error && data) {
        return data;
      }
    }
    const orders = localStorage.getItem(DB_KEYS.ORDERS);
    return orders ? JSON.parse(orders) : [];
  },

  async saveOrders(orders) {
    if (supabase) {
      // Upsert each order (assuming order.id exists)
      for (const ord of orders) {
        await supabase.from('orders').upsert(ord, { onConflict: 'id' });
      }
    }
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  },

  async createOrder(orderData) {
    const orders = await this.getOrders();
    const newOrder = {
      id: 'order-' + Date.now().toString().slice(-6),
      customerName: orderData.customerName,
      tableNumber: orderData.tableNumber,
      items: orderData.items,
      totalPrice: orderData.totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    await this.saveOrders(orders);
    // Sync to Supabase if available
    if (supabase) {
      await supabase.from('orders').insert([newOrder]);
    }
    this._broadcast('NEW_ORDER', newOrder);
    return newOrder;
  },

  async updateOrderStatus(orderId, newStatus) {
    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = newStatus;
      await this.saveOrders(orders);
      
      // Notifica o cliente e outras abas sobre a atualização do status
      this._broadcast('ORDER_STATUS_UPDATED', { orderId, status: newStatus });
      return true;
    }
    return false;
  },

  // --- COMUNICAÇÃO EM TEMPO REAL ---
  _broadcast(type, payload) {
    channel.postMessage({ type, payload });
  },

  subscribe(callback) {
    const listener = (event) => {
      callback(event.data);
    };
    channel.addEventListener('message', listener);
    return () => {
      channel.removeEventListener('message', listener);
    };
  }
};

window.dataService = dataService;
