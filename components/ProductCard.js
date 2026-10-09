import Link from 'next/link';
import { rupiah } from '../lib/supabase';

export default function ProductCard({ p }) {
  const soldOut = p.stock <= 0;
  return (
    <Link href={`/produk/${p.id}`} className="card">
      <div className="thumb-wrap">
        {p.image_url ? (
          <img className="thumb" src={p.image_url} alt={p.name} />
        ) : (
          <div className="thumb" />
        )}
        {soldOut && <span className="sold">Habis</span>}
      </div>
      <div className="card-body">
        <div className="card-name">{p.name}</div>
        <div className="price">{rupiah(p.price)}</div>
      </div>
    </Link>
  );
}
