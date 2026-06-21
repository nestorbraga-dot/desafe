// data-service.js
// Updated to use Supabase backend with fallback to localStorage
// Camada de dados preparada para migração futura para o Supabase

const DB_KEYS = {
  CATEGORIES: 'cardapio_categories',
  PRODUCTS: 'cardapio_products',
  ORDERS: 'cardapio_orders'
};

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
