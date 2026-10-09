'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { STORE_NAME, WA_NUMBER, DEVELOPER } from '../lib/config';

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);
  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo ' + STORE_NAME + ', saya mau tanya.')}`;

  return (
    <>
      <header className="header">
        <div className="container bar">
          <Link href="/" className="logo" onClick={close}>midi &amp; style</Link>
          <button
            className="burger"
            aria-label="Buka menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={'overlay' + (open ? ' show' : '')} onClick={close} />
      <aside className={'drawer' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="drawer-top">
          <span className="logo">midi &amp; style</span>
          <button className="close" aria-label="Tutup menu" onClick={close}>✕</button>
        </div>
        <nav className="drawer-nav">
          <Link href="/" onClick={close}>Beranda</Link>
          <Link href="/produk" onClick={close}>Beli Produk</Link>
          <Link href="/#cara-pesan" onClick={close}>Cara Pesan</Link>
          <a href={waLink} target="_blank" rel="noreferrer" onClick={close}>Hubungi Kami</a>
          <Link href="/admin" onClick={close}>Admin</Link>
        </nav>
        <div className="drawer-foot">Developer: {DEVELOPER}</div>
      </aside>
    </>
  );
}
