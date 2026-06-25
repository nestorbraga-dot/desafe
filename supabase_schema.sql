-- supabase_schema.sql
-- -------------------------------------------------------------
--  Supabase schema for the Cardápio Digital application
--  Version: 1.0
-- -------------------------------------------------------------

-- 1️⃣ Categories table (used by products)
create table public.categories (
  id          text primary key,            -- e.g., 'burgers'
  name        text not null,               -- e.g., 'Hambúrgueres'
  icon        text not null,               -- e.g., '🍔'
  created_at  timestamp default now()
);

-- 2️⃣ Products table
create table public.products (
  id          text primary key,
  name        text not null,
  description text not null,
  price       numeric(10,2) not null,
  category    text references public.categories(id) on delete cascade,
  image       text not null,
  available   boolean default true,
  tags        jsonb default '[]'::jsonb,   -- array of strings
  created_at  timestamp default now()
);

-- 3️⃣ Orders table – used by client and admin panels
create table public.orders (
  id           text primary key,
  customer_name text not null,
  table_number  int not null,
  items        jsonb not null,               -- [{productId, name, price, quantity, observations}]
  total_price  numeric(10,2) not null,
  status       text not null default 'pending', -- pending | preparing | delivered | archived
  created_at   timestamp default now()
);

-- 4️⃣ Optional realtime messages table (for custom events)
create table public.realtime (
  id        bigserial primary key,
  type      text not null,
  payload   jsonb not null,
  created_at timestamp default now()
);

-- -------------------------------------------------------------
-- Indexes for performance
-- -------------------------------------------------------------
create index idx_products_category on public.products (category);
create index idx_orders_status    on public.orders (status);
create index idx_orders_created_at on public.orders (created_at desc);

-- -------------------------------------------------------------
-- Insert default data (run once)
-- -------------------------------------------------------------
insert into public.categories (id, name, icon) values
  ('burgers',   'Hambúrgueres',    '🍔'),
  ('sides',    'Acompanhamentos', '🍟'),
  ('drinks',   'Bebidas',         '🥤'),
  ('desserts', 'Sobremesas',      '🍦')
on conflict (id) do nothing;

insert into public.products (id, name, description, price, category, image, available, tags) values
  ('prod-1','Monster Cheddar Bacon','Pão brioche selado na manteiga, dois blends artesanais de 150g, muito cheddar cremoso derretido e tiras crocantes de bacon premium.',38.90,'burgers','assets/monster_cheddar.png',true,'["Mais Pedido","Carne 150g"]'),
  ('prod-2','Smash Duplo Salad','Pão brioche, dois blends smash de 80g ultra prensados com crostinha, queijo prato duplo, alface americana fresca, tomate e maionese da casa.',29.90,'burgers','assets/smash_salada.png',true,'["Clássico"]')
on conflict (id) do nothing;
