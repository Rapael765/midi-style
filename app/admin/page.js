'use client';
import { useEffect, useState } from 'react';
import { supabase, rupiah } from '../../lib/supabase';

const STATUSES = ['menunggu', 'dibayar', 'dikirim', 'selesai', 'batal'];
const emptyForm = { id: null, name: '', description: '', price: '', stock: '', image_url: '', active: true };

async function uploadImage(file) {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const { error } = await supabase.storage.from('products').upload(path, file);
  if (error) throw error;
  return supabase.storage.from('products').getPublicUrl(path).data.publicUrl;
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('produk');
  const [login, setLogin] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [qrisFile, setQrisFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const flash = (type, text) => setMsg({ type, text });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        if (data) loadAll();
      });
  }, [user]);

  async function loadAll() {
    const [p, o, s] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    setProducts(p.data || []);
    setOrders(o.data || []);
    setSettings(s.data || {});
  }

  async function doLogin(e) {
    e.preventDefault();
    flash('', '');
    const { error } = await supabase.auth.signInWithPassword(login);
    if (error) flash('error', 'Email atau password salah.');
  }

  async function saveProduct(e) {
    e.preventDefault();
    setBusy(true);
    flash('', '');
    try {
      let image_url = form.image_url || null;
      if (file) image_url = await uploadImage(file);
      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        stock: Number(form.stock),
        image_url,
        active: form.active,
      };
      const q = form.id
        ? supabase.from('products').update(payload).eq('id', form.id)
        : supabase.from('products').insert(payload);
      const { error } = await q;
      if (error) throw error;
      setForm(emptyForm);
      setFile(null);
      e.target.reset();
      flash('ok', 'Produk disimpan.');
      loadAll();
    } catch (err) {
      flash('error', err.message || 'Gagal menyimpan produk.');
    }
    setBusy(false);
  }

  async function deleteProduct(id) {
    if (!confirm('Hapus produk ini?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) flash('error', error.message);
    else { flash('ok', 'Produk dihapus.'); loadAll(); }
  }

  async function setStatus(id, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) flash('error', error.message);
    else loadAll();
  }

  async function saveSettings(e) {
    e.preventDefault();
    setBusy(true);
    flash('', '');
    try {
      let qris_url = settings.qris_url || null;
      if (qrisFile) qris_url = await uploadImage(qrisFile);
      const { error } = await supabase.from('settings').update({
        dana_number: settings.dana_number || null,
        dana_name: settings.dana_name || null,
        gopay_number: settings.gopay_number || null,
        gopay_name: settings.gopay_name || null,
        wa_number: settings.wa_number || null,
        qris_url,
      }).eq('id', 1);
      if (error) throw error;
      setQrisFile(null);
      flash('ok', 'Pengaturan pembayaran disimpan.');
      loadAll();
    } catch (err) {
      flash('error', err.message || 'Gagal menyimpan.');
    }
    setBusy(false);
  }

  const setS = (k) => (e) => setSettings({ ...settings, [k]: e.target.value });
  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!ready) return <p className="muted">Memuat...</p>;

  if (!user) {
    return (
      <form onSubmit={doLogin} className="box" style={{ maxWidth: 380, margin: '0 auto' }}>
        <h1>Login admin</h1>
        <label>Email</label>
        <input type="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
        <label>Password</label>
        <input type="password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
        {msg.text && <div className={msg.type}>{msg.text}</div>}
        <button className="btn full" style={{ marginTop: 16 }}>Masuk</button>
      </form>
    );
  }

  if (!isAdmin) {
    return (
      <div className="box" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h2>Akun ini bukan admin</h2>
        <p className="muted" style={{ marginBottom: 12 }}>Daftarkan akun ke tabel admins di Supabase.</p>
        <button className="btn light" onClick={() => supabase.auth.signOut()}>Keluar</button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Admin</h1>
        <button className="btn light small" onClick={() => supabase.auth.signOut()}>Keluar</button>
      </div>

      <div className="tabs">
        {[['produk', 'Produk'], ['pesanan', `Pesanan (${orders.length})`], ['pembayaran', 'Pembayaran']].map(([k, l]) => (
          <button key={k} className={'tab' + (tab === k ? ' active' : '')} onClick={() => { setTab(k); flash('', ''); }}>{l}</button>
        ))}
      </div>

      {msg.text && <div className={msg.type}>{msg.text}</div>}

      {tab === 'produk' && (
        <div className="two" style={{ alignItems: 'start' }}>
          <form onSubmit={saveProduct} className="box">
            <h2>{form.id ? 'Ubah produk' : 'Tambah produk'}</h2>
            <label>Nama produk</label>
            <input required value={form.name} onChange={setF('name')} />
            <label>Deskripsi</label>
            <textarea value={form.description} onChange={setF('description')} />
            <label>Harga (Rp)</label>
            <input type="number" min="0" required value={form.price} onChange={setF('price')} />
            <label>Stok</label>
            <input type="number" min="0" required value={form.stock} onChange={setF('stock')} />
            <label>Foto {form.id && '(kosongkan jika tidak diganti)'}</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
            {form.image_url && !file && <img src={form.image_url} alt="" style={{ width: 80, marginTop: 8, borderRadius: 6 }} />}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Tampilkan di toko
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button>
              {form.id && <button type="button" className="btn light" onClick={() => { setForm(emptyForm); setFile(null); }}>Batal</button>}
            </div>
          </form>

          <div>
            <h2>Daftar produk</h2>
            {products.length === 0 && <p className="muted">Belum ada produk.</p>}
            {products.map((p) => (
              <div className="row" key={p.id}>
                {p.image_url ? <img src={p.image_url} alt="" /> : <img alt="" />}
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="muted">{rupiah(p.price)} · stok {p.stock} {!p.active && '· disembunyikan'}</div>
                </div>
                <button className="btn light small" onClick={() => { setForm({ ...p, description: p.description || '', image_url: p.image_url || '' }); window.scrollTo(0, 0); }}>Ubah</button>
                <button className="btn danger small" onClick={() => deleteProduct(p.id)}>Hapus</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'pesanan' && (
        <div>
          {orders.length === 0 && <p className="muted">Belum ada pesanan.</p>}
          {orders.map((o) => (
            <div className="box" key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <b>{o.product_name} × {o.qty}</b>
                <b>{rupiah(o.total)}</b>
              </div>
              <div className="muted">
                Kode {o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString('id-ID')} · {o.payment_method.toUpperCase()}
              </div>
              <p style={{ marginTop: 8 }}>
                {o.customer_name} · <a href={`https://wa.me/${o.phone.replace(/\D/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{o.phone}</a><br />
                {o.address}
                {o.note && <><br /><span className="muted">Catatan: {o.note}</span></>}
              </p>
              <select style={{ marginTop: 12, maxWidth: 200 }} value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === 'pembayaran' && (
        <form onSubmit={saveSettings} className="box" style={{ maxWidth: 520 }}>
          <h2>Metode pembayaran</h2>
          <label>Nomor Dana</label>
          <input value={settings.dana_number || ''} onChange={setS('dana_number')} />
          <label>Nama pemilik Dana</label>
          <input value={settings.dana_name || ''} onChange={setS('dana_name')} />
          <label>Nomor GoPay</label>
          <input value={settings.gopay_number || ''} onChange={setS('gopay_number')} />
          <label>Nama pemilik GoPay</label>
          <input value={settings.gopay_name || ''} onChange={setS('gopay_name')} />
          <label>Gambar QRIS</label>
          <input type="file" accept="image/*" onChange={(e) => setQrisFile(e.target.files[0] || null)} />
          {settings.qris_url && !qrisFile && <img className="qris" src={settings.qris_url} alt="QRIS" />}
          <label>No. WhatsApp penjual (format 628xxx)</label>
          <input value={settings.wa_number || ''} onChange={setS('wa_number')} />
          <button className="btn" style={{ marginTop: 16 }} disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button>
        </form>
      )}
    </>
  );
    }
