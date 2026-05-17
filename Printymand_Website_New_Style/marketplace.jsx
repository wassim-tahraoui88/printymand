// Marketplace — "The Archive" — full design listing

const { useState, useMemo } = React;

function MarketplaceApp() {
  const cart = useCart();
  const [cat, setCat] = useState('All works');
  const [sort, setSort] = useState('most-loved');
  const [q, setQ] = useState('');
  const [productFilter, setProductFilter] = useState('any');

  const filtered = useMemo(() => {
    let p = DESIGNS.slice();
    if (cat !== 'All works') p = p.filter(d => d.category === cat);
    if (q.trim()) {
      const Q = q.toLowerCase();
      p = p.filter(d =>
        d.title.toLowerCase().includes(Q) ||
        d.designer.toLowerCase().includes(Q) ||
        (d.tags || []).some(t => t.toLowerCase().includes(Q))
      );
    }
    if (sort === 'most-loved') p.sort((a,b) => b.rating - a.rating);
    else if (sort === 'best-selling') p.sort((a,b) => b.sales - a.sales);
    else if (sort === 'newest') p.sort((a,b) => b.id - a.id);
    else if (sort === 'price-low') p.sort((a,b) => a.price - b.price);
    else if (sort === 'price-high') p.sort((a,b) => b.price - a.price);
    return p;
  }, [cat, sort, q, productFilter]);

  // Magazine-style variant assignment - first item is feat-wide, then alternating doubles
  const withVariant = (idx, total) => {
    if (idx === 0 && total > 4) return 'feat-wide';
    if ((idx === 3 || idx === 4) && total > 5) return 'feat-double';
    return '';
  };

  return (
    <div>
      <PageMasthead cartCount={cart.count} cartBump={cart.bump} currentPage="marketplace" />

      <PageBread
        no="VIII."
        dept="The marketplace · all plates"
        title={<><em>All</em> the works,<br/>in one&nbsp;archive.</>}
        deck="Every active design on Printymand, filtered, sorted, and ready for the press. Updated weekly."
        breadcrumb={{ href: 'index.html', label: 'Back to the cover' }}
      />

      <section className="page">
        <div className="market-toolbar">
          <div className="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
            <input
              className="search-input"
              placeholder="Search designs, designers, or tags…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <div className="toolbar-right">
            <span className="market-count">
              {filtered.length} {filtered.length === 1 ? 'plate' : 'plates'}
            </span>
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="most-loved">sort — most loved</option>
              <option value="best-selling">sort — best selling</option>
              <option value="newest">sort — newest</option>
              <option value="price-low">sort — price, low</option>
              <option value="price-high">sort — price, high</option>
            </select>
          </div>
        </div>

        <div className="filter-row" style={{ borderBottom: 0, paddingTop: 0 }}>
          <span className="label">Filed under:</span>
          {CATEGORIES.map(c => (
            <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        <div className="plate-grid">
          {filtered.length === 0 ? (
            <div style={{ gridColumn: 'span 12', padding: '80px 0', textAlign: 'center' }}>
              <p className="serif-italic" style={{ fontSize: 22, color: 'var(--pm-text-muted)' }}>
                No plates match — try a different category or search.
              </p>
              <button className="btn btn-ghost" onClick={() => { setQ(''); setCat('All works'); }} style={{ marginTop: 18 }}>
                Reset filters
              </button>
            </div>
          ) : filtered.map((d, i) => (
            <MarketCard
              key={d.id}
              design={d}
              variant={withVariant(i, filtered.length)}
              idx={i}
              onAdd={() => cart.add(d)}
            />
          ))}
        </div>
      </section>

      <PageColophon />
      <Toast msg={cart.toast} />
    </div>
  );
}

function MarketCard({ design, variant, idx, onAdd }) {
  const seed = design.seed || `pm-${design.id}`;
  return (
    <article className={`plate ${variant}`}>
      <a href={`design.html?id=${design.id}`} style={{ display: 'block' }}>
        <div className="plate-image">
          <img src={`https://picsum.photos/seed/${seed}/900/1100`} alt={design.title} />
          <span className="plate-no">A·{String(idx + 1).padStart(2, '0')}</span>
          <button className="quick-add" onClick={(e) => { e.preventDefault(); onAdd(); }}>+ add</button>
        </div>
      </a>
      <div className="plate-caption">
        <a href={`design.html?id=${design.id}`} className="title" style={{ color: 'inherit' }}>{design.title}</a>
        <span className="price">{design.price} TND</span>
        <span className="designer">by {design.designer}</span>
        <span className="meta">{design.rating} ★ · {design.category}</span>
      </div>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MarketplaceApp />);
