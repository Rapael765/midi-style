# midi & style

Next.js + Supabase, siap deploy di Vercel.

## Setup
1. **Supabase**: buat project baru → SQL Editor → jalankan isi `supabase/schema.sql`.
2. Supabase → Authentication → Users → *Add user* (email + password admin).
3. SQL Editor, jalankan (ganti emailnya):
   `insert into admins (user_id) select id from auth.users where email = 'EMAIL_ADMIN_KAMU';`
4. Supabase → Project Settings → API: salin **Project URL** dan **anon public key**.
5. **GitHub**: upload semua file ini ke repository.
6. **Vercel**: Import repository → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   lalu Deploy.
7. Buka `/admin`, login, isi **Pembayaran** (Dana, GoPay, gambar QRIS, WhatsApp), lalu tambah produk.
