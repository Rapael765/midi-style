'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/ProductCard';

export default function Produk() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError('Produk gagal dimuat. Coba muat ulang halaman.');
        else setProducts(data || []);
        setLoading(false);
      });
  }, []);

  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="section-head" style={{ marginTop: 8 }}>
        <h1 style={{ margin: 0 }}>Beli produk</h1>
      </div>
      <input
        className="search"
        placeholder="Cari produk"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Memuat produk...</p>}
      {!loading && !error && list.length === 0 && (
        <p className="muted">{q ? 'Produk tidak ditemukan.' : 'Belum ada produk.'}</p>
      )}
      <div className="grid">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </>
  );
                  }
