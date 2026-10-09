import './globals.css';

export const metadata = {
  title: 'midi & style',
  description: 'Toko online midi & style',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <header className="header">
          <div className="container">
            <a href="/" className="logo">midi &amp; style</a>
            <nav className="nav">
              <a href="/">Produk</a>
              <a href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        <main>
          <div className="container">{children}</div>
        </main>
        <footer className="footer">
          © {new Date().getFullYear()} midi &amp; style
        </footer>
      </body>
    </html>
  );
}
