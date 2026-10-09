-- Jalankan seluruh file ini di Supabase > SQL Editor

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table settings (
  id int primary key default 1 check (id = 1),
  dana_number text,
  dana_name text,
  gopay_number text,
  gopay_name text,
  qris_url text,
  wa_number text
);
insert into settings (id) values (1);

create table orders (
  id uuid primary key,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  price integer not null,
  qty integer not null check (qty > 0),
  total integer not null,
  customer_name text not null,
  phone text not null,
  address text not null,
  note text,
  payment_method text not null check (payment_method in ('dana','gopay','qris')),
  status text not null default 'menunggu'
    check (status in ('menunggu','dibayar','dikirim','selesai','batal')),
  created_at timestamptz default now()
);

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid())
$$;

-- Harga & total dihitung di server supaya tidak bisa dimanipulasi pembeli
create function prepare_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare p products;
begin
  select * into p from products where id = new.product_id and active for update;
  if not found then raise exception 'Produk tidak tersedia'; end if;
  if p.stock < new.qty then raise exception 'Stok tidak cukup'; end if;
  new.product_name := p.name;
  new.price := p.price;
  new.total := p.price * new.qty;
  new.status := 'menunggu';
  update products set stock = stock - new.qty where id = p.id;
  return new;
end $$;

create trigger trg_prepare_order
before insert on orders
for each row execute function prepare_order();

-- Keamanan (RLS)
alter table products enable row level security;
alter table settings enable row level security;
alter table orders enable row level security;
alter table admins enable row level security;

create policy "produk dilihat semua" on products for select
  using (active or is_admin());
create policy "admin tambah produk" on products for insert with check (is_admin());
create policy "admin ubah produk" on products for update using (is_admin()) with check (is_admin());
create policy "admin hapus produk" on products for delete using (is_admin());

create policy "pengaturan dilihat semua" on settings for select using (true);
create policy "admin ubah pengaturan" on settings for update using (is_admin()) with check (is_admin());

create policy "siapa saja buat pesanan" on orders for insert with check (true);
create policy "admin lihat pesanan" on orders for select using (is_admin());
create policy "admin ubah pesanan" on orders for update using (is_admin()) with check (is_admin());

create policy "cek diri sendiri admin" on admins for select using (user_id = auth.uid());

-- Penyimpanan gambar
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do nothing;

create policy "gambar dilihat semua" on storage.objects for select
  using (bucket_id = 'products');
create policy "admin upload gambar" on storage.objects for insert
  with check (bucket_id = 'products' and is_admin());
create policy "admin ubah gambar" on storage.objects for update
  using (bucket_id = 'products' and is_admin());
create policy "admin hapus gambar" on storage.objects for delete
  using (bucket_id = 'products' and is_admin());

-- SETELAH daftar akun admin (Authentication > Users > Add user),
-- jalankan ini dengan email admin kamu:
-- insert into admins (user_id) select id from auth.users where email = 'EMAIL_ADMIN_KAMU';
