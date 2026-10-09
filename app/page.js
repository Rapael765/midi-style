'use client';
import { useEffect, useState } from 'react';
import { supabase, rupiah } from '../lib/supabase';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError('Gagal memuat produk.');
        else setProducts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <h1>Produk</h1>
      <p className="sub">Pilih produk yang kamu suka.</p>
      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Memuat...</p>}
      {!loading && !error && products.length === 0 && (
        <p className="muted">Belum ada produk.</p>
      )}
      <div className="grid">
        {products.map((p) => (
          <a key={p.id} href={`/produk/${p.id}`} className="card">
            {p.image_url ? (
              <img className="thumb" src={p.image_url} alt={p.name} />
            ) : (
              <div className="thumb" />
            )}
            <div className="card-body">
              <div className="card-name">{p.name}</div>
              <div className="price">{rupiah(p.price)}</div>
              {p.stock <= 0 && <div className="muted">Stok habis</div>}
            </div>
          </a>
        ))}
      </div>
    </>
  );
        }
