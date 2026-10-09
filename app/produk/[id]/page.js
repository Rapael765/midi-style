'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, rupiah } from '../../../lib/supabase';

const METHODS = [
  { id: 'dana', label: 'Dana' },
  { id: 'gopay', label: 'GoPay' },
  { id: 'qris', label: 'QRIS' },
];

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    note: '',
    qty: 1,
    payment_method: 'qris',
  });

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').eq('id', id).maybeSingle(),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ]).then(([p, s]) => {
      setProduct(p.data);
      setSettings(s.data);
      setLoading(false);
    });
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    const qty = Number(form.qty);
    if (!qty || qty < 1) return setError('Jumlah minimal 1.');
    if (qty > product.stock) return setError('Jumlah melebihi stok.');
    setSending(true);
    const orderId = crypto.randomUUID();
    const { error } = await supabase.from('orders').insert({
      id: orderId,
      product_id: product.id,
      qty,
      customer_name: form.customer_name,
      phone: form.phone,
      address: form.address,
      note: form.note || null,
      payment_method: form.payment_method,
      // harga & total dihitung ulang oleh server (trigger di database)
      product_name: product.name,
      price: product.price,
      total: product.price * qty,
    });
    setSending(false);
    if (error) return setError(error.message || 'Pesanan gagal dibuat.');
    setDone({ id: orderId, qty, total: product.price * qty, method: form.payment_method });
  }

  if (loading) return <p className="muted">Memuat...</p>;
  if (!product) return <p>Produk tidak ditemukan. <a href="/" style={{ textDecoration: 'underline' }}>Kembali</a></p>;

  if (done) {
    const s = settings || {};
    const waText = encodeURIComponent(
      `Halo midi & style, saya sudah bayar.\nKode pesanan: ${done.id.slice(0, 8)}\nProduk: ${product.name} x${done.qty}\nTotal: ${rupiah(done.total)}\nMetode: ${done.method.toUpperCase()}`
    );
    return (
      <div style={{ maxWidth: 520 }}>
        <h1>Pesanan dibuat</h1>
        <p className="sub">Kode pesanan: <b>{done.id.slice(0, 8)}</b></p>
        <div className="box">
          <div className="muted">Total pembayaran</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{rupiah(done.total)}</div>
        </div>
        <div className="box">
          <h2>Bayar dengan {done.method === 'qris' ? 'QRIS' : done.method === 'dana' ? 'Dana' : 'GoPay'}</h2>
          {done.method === 'qris' && (s.qris_url
            ? <img className="qris" src={s.qris_url} alt="QRIS" />
            : <p className="muted">QRIS belum diatur penjual.</p>)}
          {done.method === 'dana' && (
            <p>Transfer ke Dana <b>{s.dana_number || '-'}</b><br />a.n. {s.dana_name || '-'}</p>
          )}
          {done.method === 'gopay' && (
            <p>Transfer ke GoPay <b>{s.gopay_number || '-'}</b><br />a.n. {s.gopay_name || '-'}</p>
          )}
          <p className="muted" style={{ marginTop: 8 }}>
            Bayar sesuai total, lalu kirim bukti pembayaran ke penjual.
          </p>
        </div>
        {s.wa_number && (
          <a className="btn full" href={`https://wa.me/${s.wa_number}?text=${waText}`} target="_blank" rel="noreferrer">
            Kirim bukti bayar via WhatsApp
          </a>
        )}
        <p style={{ marginTop: 16 }}><a href="/" style={{ textDecoration: 'underline' }}>Kembali belanja</a></p>
      </div>
    );
  }

  const soldOut = product.stock <= 0;
  const total = product.price * (Number(form.qty) || 0);

  return (
    <div className="two">
      <div>
        {product.image_url
          ? <img className="detail-img" src={product.image_url} alt={product.name} />
          : <div className="detail-img" />}
      </div>
      <div>
        <h1>{product.name}</h1>
        <div className="price" style={{ fontSize: 22, marginBottom: 8 }}>{rupiah(product.price)}</div>
        <p style={{ whiteSpace: 'pre-line', color: '#444' }}>{product.description}</p>
        <p className="muted" style={{ margin: '8px 0 16px' }}>
          {soldOut ? 'Stok habis' : `Stok: ${product.stock}`}
        </p>

        {!soldOut && (
          <form onSubmit={submit} className="box">
            <h2>Beli sekarang</h2>
            <label>Nama</label>
            <input required value={form.customer_name} onChange={set('customer_name')} />
            <label>No. WhatsApp</label>
            <input required inputMode="tel" value={form.phone} onChange={set('phone')} />
            <label>Alamat pengiriman</label>
            <textarea required value={form.address} onChange={set('address')} />
            <label>Catatan (opsional)</label>
            <input value={form.note} onChange={set('note')} />
            <label>Jumlah</label>
            <input type="number" min="1" max={product.stock} required value={form.qty} onChange={set('qty')} />
            <label>Metode pembayaran</label>
            <div className="pay-options">
              {METHODS.map((m) => (
                <div
                  key={m.id}
                  className={'pay-option' + (form.payment_method === m.id ? ' active' : '')}
                  onClick={() => setForm({ ...form, payment_method: m.id })}
                >
                  {m.label}
                </div>
              ))}
            </div>
            <div style={{ margin: '16px 0 8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total</span><b>{rupiah(total)}</b>
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn full" disabled={sending}>
              {sending ? 'Memproses...' : 'Buat pesanan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
    }
