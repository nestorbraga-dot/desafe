// seed_products.js
// Script to insert default product data into Supabase.
// Run with: node seed_products.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SB_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultProducts = [
  {
    id: 'prod-1',
    name: 'Monster Cheddar Bacon',
    description: 'Pão brioche selado na manteiga, dois blends artesanais de 150g, muito cheddar cremoso derretido e tiras crocantes de bacon premium.',
    price: 38.90,
    category: 'burgers',
    image: 'assets/monster_cheddar.png',
    available: true,
    tags: ['Mais Pedido', 'Carne 150g'],
  },
  {
    id: 'prod-2',
    name: 'Smash Duplo Salad',
    description: 'Pão brioche, dois blends smash de 80g ultra prensados com crostinha, queijo prato duplo, alface americana fresca, tomate e maionese da casa.',
    price: 29.90,
    category: 'burgers',
    image: 'assets/smash_salada.png',
    available: true,
    tags: ['Clássico'],
  }
];

async function seed() {
  const { data, error } = await supabase.from('products').upsert(defaultProducts, { onConflict: 'id' });
  if (error) {
    console.error('Error inserting products:', error);
    process.exit(1);
  }
  console.log('Inserted/updated products:', data);
}

seed();
