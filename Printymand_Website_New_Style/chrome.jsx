// Printymand — shared chrome (masthead + colophon + page wrappers)

const { useState, useEffect } = React;

// ─────────────────────────────────────────────────────────
// PAGE MASTHEAD — used across every page
// ─────────────────────────────────────────────────────────
function PageMasthead({ cartCount = 0, cartBump = false, currentPage = 'home', theme, onToggleTheme, onCartClick }) {
  const [t, setT] = useState(theme || 'light');
  useEffect(() => {
    if (!theme) {
      const saved = localStorage.getItem('pm-theme') || 'light';
      setT(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      setT(theme);
    }
  }, [theme]);

  const toggle = () => {
    if (onToggleTheme) return onToggleTheme();
    const next = t === 'light' ? 'dark' : 'light';
    setT(next);
    localStorage.setItem('pm-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const nav = [
    { label: 'Marketplace',  href: 'marketplace.html', key: 'marketplace' },
    { label: 'How it\'s made', href: 'index.html#process', key: 'home-process' },
    { label: 'Pressroom',    href: 'index.html#pressroom', key: 'home-pressroom' },
    { label: 'Editorial',    href: 'index.html#manifesto', key: 'home-manifesto' },
    { label: 'Track order',  href: 'track.html', key: 'track' },
  ];

  return (
    <header className="masthead">
      <div className="page">
        <div className="masthead-row">
          <div className="masthead-meta">
            <span>Issue Nº {ISSUE.number}</span>
            <span className="dot"></span>
            <span>{ISSUE.season}</span>
            <span className="dot"></span>
            <span className="hide-sm">{ISSUE.city} · {ISSUE.date}</span>
          </div>
          <h1 className="masthead-title">
            <a href="index.html" style={{ color: 'inherit' }}>Printy<span className="amp">&amp;</span>mand</a>
          </h1>
          <div className="masthead-actions">
            <a href="marketplace.html" className="iconbtn" title="Search" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
            </a>
            <a href="dashboard.html" className="iconbtn" title="Account" aria-label="Account">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
            </a>
            <button className="iconbtn" onClick={toggle} title="Toggle edition" aria-label="Toggle edition">
              {t === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
              )}
            </button>
            <a href="checkout.html" className="iconbtn" title="Cart" aria-label="Cart" onClick={onCartClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M6 6 5 3H2"/></svg>
              {cartCount > 0 && (
                <span className={`cart-badge ${cartBump ? 'bump' : ''}`}>{cartCount}</span>
              )}
            </a>
          </div>
        </div>
        <hr className="rule" />
        <div className="nav-row">
          <nav className="nav-links">
            {nav.map(n => (
              <a key={n.key} href={n.href} className={currentPage === n.key ? 'is-active' : ''}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="nav-folio">Vol. III — fol. {pageFolio(currentPage)}</div>
        </div>
      </div>
    </header>
  );
}

function pageFolio(key) {
  const folios = {
    'home': '001',
    'marketplace': '008',
    'design': '011',
    'customize': '013',
    'printer-select': '014',
    'checkout': '016',
    'track': '018',
    'dashboard': '020',
    'login': '022',
  };
  return folios[key] || '———';
}

// ─────────────────────────────────────────────────────────
// PAGE COLOPHON — footer
// ─────────────────────────────────────────────────────────
function PageColophon() {
  return (
    <footer id="colophon" className="colophon">
      <div className="colophon-inner">
        <div className="kicker" style={{ color: 'var(--pm-amber)' }}>
          Colophon · imprint · masthead
        </div>
        <h2 className="colophon-title">
          Printy<em>&amp;</em>mand,<br />
          made in Tunisia.
        </h2>

        <div className="colophon-grid">
          <div className="col-block">
            <h4>About this issue</h4>
            <p className="credit">
              Issue Nº {ISSUE.number}, {ISSUE.season}. Set in Bricolage
              Grotesque, Newsreader and Inter. Printed by the Printymand
              network on 100% local presses. Edition of 4,200 · 12 TND.
            </p>
          </div>
          <div className="col-block">
            <h4>Browse</h4>
            <ul>
              <li><a href="marketplace.html">Marketplace</a></li>
              <li><a href="index.html#pressroom">Pressrooms</a></li>
              <li><a href="index.html#process">How it's made</a></li>
              <li><a href="index.html#manifesto">Editorial</a></li>
            </ul>
          </div>
          <div className="col-block">
            <h4>For the makers</h4>
            <ul>
              <li><a href="login.html">Sign in</a></li>
              <li><a href="login.html#register">Become a designer</a></li>
              <li><a href="login.html#register">Open a pressroom</a></li>
              <li><a href="dashboard.html">Your workspace</a></li>
            </ul>
          </div>
          <div className="col-block">
            <h4>Letters &amp; press</h4>
            <ul>
              <li>letters@printymand.tn</li>
              <li>+216 71 000 042</li>
              <li>23 rue de Carthage, Tunis</li>
              <li>Open Mon — Sat, 9—18h</li>
            </ul>
          </div>
        </div>

        <div className="colophon-bottom">
          <span>© 2026 Printymand · Tunisia's first end-to-end print-on-demand press.</span>
          <div className="pays">
            <span className="pay-tile">Visa</span>
            <span className="pay-tile">MC</span>
            <span className="pay-tile">D17</span>
            <span className="pay-tile">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────
// PAGE BREAD — section header used on inner pages
// ─────────────────────────────────────────────────────────
function PageBread({ no, dept, title, deck, breadcrumb }) {
  return (
    <section className="page page-bread">
      {breadcrumb && (
        <div style={{ marginBottom: 16 }}>
          <a href={breadcrumb.href} className="serif-italic" style={{ color: 'var(--pm-text-muted)', fontSize: 14 }}>
            ← {breadcrumb.label}
          </a>
        </div>
      )}
      <div className="section-head">
        <span className="section-no">{no}</span>
        <hr className="line" />
        <span className="title">{dept}</span>
      </div>
      <div className="bread-grid">
        <h1 className="bread-title">{title}</h1>
        {deck && <p className="bread-deck">{deck}</p>}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// TOAST — global toast container
// ─────────────────────────────────────────────────────────
function Toast({ msg }) {
  return (
    <div className={`toast ${msg ? 'show' : ''}`} role="status" aria-live="polite">
      <span className="dot"></span>
      <span>{msg || ''}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CART helpers — persisted via localStorage
// ─────────────────────────────────────────────────────────
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('pm-cart') || '[]');
  } catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem('pm-cart', JSON.stringify(cart));
}

// ─────────────────────────────────────────────────────────
// useCart hook
// ─────────────────────────────────────────────────────────
function useCart() {
  const [cart, setCart] = useState(loadCart());
  const [bump, setBump] = useState(false);
  const [toast, setToast] = useState(null);

  const add = (item) => {
    const next = [...cart, { ...item, _cid: Date.now() + Math.random() }];
    setCart(next); saveCart(next);
    setBump(true);
    setToast(`Added — ${item.title} · ${item.price} TND`);
    setTimeout(() => setBump(false), 360);
    setTimeout(() => setToast(null), 2200);
  };

  const remove = (cid) => {
    const next = cart.filter(c => c._cid !== cid);
    setCart(next); saveCart(next);
  };

  const clear = () => { setCart([]); saveCart([]); };

  return { cart, count: cart.length, bump, toast, add, remove, clear, setToast };
}

Object.assign(window, { PageMasthead, PageColophon, PageBread, Toast, useCart, loadCart, saveCart });
