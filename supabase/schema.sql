-- Coffee Land schema for Supabase (Postgres)
-- Run this in Supabase SQL Editor

create table if not exists users (
  id bigserial primary key,
  name text,
  phone text unique,
  avatar text,
  created_at timestamptz default now()
);

create table if not exists loyalty_cards (
  id bigserial primary key,
  user_id bigint unique references users(id) on delete cascade,
  status text default 'inactive',
  discount_percent int default 10,
  created_at timestamptz default now(),
  activated_at timestamptz
);

create table if not exists orders (
  id bigserial primary key,
  customer_name text,
  phone text,
  total int,
  discount_applied int default 0,
  final_total int,
  guest int default 1,
  status text default 'new',
  created_at timestamptz default now(),
  pickup_time text,
  comment text
);

create table if not exists order_items (
  id bigserial primary key,
  order_id bigint references orders(id) on delete cascade,
  item_id text,
  name text,
  size text,
  price int
);

create index if not exists idx_orders_phone on orders(phone);
create index if not exists idx_order_items_order_id on order_items(order_id);
