// Design detail — "The Plate" — single design editorial article

const { useState, useMemo } = React;

function DesignDetailApp() {
  const cart = useCart();

  // Resolve design id from query string
  const params = new URLSearchParams(window.location.search);
  const designId = parseInt(params.get('id'), 10) || COVER_DESIGN.id;
  const d = DESIGNS.find(x => x.id === designId) || COVER_DESIGN;

  const [selectedProductIds, setSelectedProductIds] = useState([PRODUCTS[0].id]);

  const toggleProduct = (id) => {
    setSelectedProductIds(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    );
  };

  const fromPrice = useMemo(() => {
    if (!selectedProductIds.length) return d.price;
    const min = Math.min(...selectedProductIds.map(id => {
      const p = PRODUCTS.find(p => p.id === id);
      return (p?.basePrice || 0) + 4; // platform margin
    }));
    return min;
  }, [selectedProductIds]);

  const moreByDesigner = DESIGNS.filter(x => x.designer === d.designer && x.id !== d.id).slice(0, 3);

  const goToCustomize = () => {
    const ids = selectedProductIds.join(',');
    window.location.href = `customize.html?id=${d.id}&products=${ids}`;
  };

  const seed = d.seed || `pm-${d.id}`;
  const imgUrl = d.image || `https://picsum.photos/seed/${seed}/1400/1600`;

  return (
    <div>
      <PageMasthead cartCount={cart.count} cartBump={cart.bump} currentPage="design" />

      <section className="page">
        <div style={{ paddingTop: 20 }}>
          <a href="marketplace.html" className="serif-italic" style={{ color: 'var(--pm-text-muted)', fontSize: 14 }}>
            ← Back to the marketplace
          </a>
        </div>

        <div className="detail-grid">
          <div className="detail-image">
            <img src={imgUrl} alt={d.title} />
            {d.designerRank === 'Elite' && (
              <span className="stamp">★ Featured by the editors</span>
            )}
          </div>

          <div className="detail-side">
            <div>
              <div className="detail-eyebrow">
                <span className="cat">{d.category}</span>
                <span>·</span>
                <span>Plate №{String(d.id).slice(-3)}</span>
                <span>·</span>
                <span>Issue {ISSUE.number}</span>
              </div>
              <h1 className="detail-title">{d.title}</h1>
            </div>

            <div className="designer-card">
              <span className="avatar">{d.designer.charAt(0)}</span>
              <div>
                <div className="name">{d.designer}</div>
                <div className="meta">{d.designerRank} designer · {d.sales} sales · {d.rating} ★</div>
              </div>
              <span className="rank-pill" style={{ background: d.designerRank === 'Elite' ? 'var(--pm-amber)' : 'transparent' }}>{d.designerRank}</span>
            </div>

            <p className="detail-deck">
              <span className="dropcap">{d.description.charAt(0)}</span>
              {d.description.slice(1)}
            </p>

            <div>
              <div className="field-label">Choose product{selectedProductIds.length !== 1 ? 's' : ''} <span className="v">— pick any combination</span></div>
              {PRODUCTS.map(p => (
                <button
                  key={p.id}
                  className={`product-tile ${selectedProductIds.includes(p.id) ? 'selected' : ''}`}
                  onClick={() => toggleProduct(p.id)}
                >
                  <span className="checkbox">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6 9 17l-5-5"/></svg>
                  </span>
                  <span className="thumb"><img src={p.image} alt={p.name} /></span>
                  <span>
                    <div className="pname">{p.name}</div>
                    <div className="pmeta">{p.colors.length} colour{p.colors.length !== 1 ? 's' : ''} · {p.sizes.length} size{p.sizes.length !== 1 ? 's' : ''} · {p.leadTime}-day lead</div>
                  </span>
                  <span className="pprice">from {p.basePrice + 4} TND</span>
                </button>
              ))}
            </div>

            <div className="price-card">
              <div>
                <div className="label">{selectedProductIds.length ? 'Total from' : 'From'}</div>
                <div className="amount">{fromPrice}<small>TND</small></div>
              </div>
              <div className="note">
                Final price depends on the<br />pressroom you choose.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                className="btn btn-clay"
                onClick={goToCustomize}
                disabled={!selectedProductIds.length}
                style={{ flex: 1, justifyContent: 'center', minWidth: 200, opacity: selectedProductIds.length ? 1 : 0.55, cursor: selectedProductIds.length ? 'pointer' : 'not-allowed' }}
              >
                Customize your order <span className="ar">→</span>
              </button>
              <button className="btn btn-ghost" onClick={() => cart.add(d)}>Quick add</button>
            </div>

            {!selectedProductIds.length && (
              <p className="serif-italic" style={{ fontSize: 13, color: 'var(--pm-text-muted)', textAlign: 'center', margin: 0 }}>
                Select at least one product to continue.
              </p>
            )}

            <div className="accordion" style={{ marginTop: 8 }}>
              <details open>
                <summary>About this plate</summary>
                <p>{d.description}</p>
              </details>
              <details>
                <summary>Shipping &amp; returns</summary>
                <p>Free shipping on orders over 150 TND. Standard delivery 3–7 business days across Tunisia. Returns accepted within 30 days for unused, unworn items in original packaging.</p>
              </details>
              <details>
                <summary>About the designer</summary>
                <p>{d.designer} is a {d.designerRank} designer on Printymand with {d.sales} completed orders and a {d.rating}/5 rating. Tags: {(d.tags || []).join(', ') || 'none'}.</p>
              </details>
            </div>
          </div>
        </div>

        {moreByDesigner.length > 0 && (
          <section style={{ paddingTop: 60, paddingBottom: 40, borderTop: '1px solid var(--pm-rule-strong)' }}>
            <div className="section-head">
              <span className="section-no">↳</span>
              <hr className="line" />
              <span className="title">More from {d.designer}</span>
            </div>
            <div className="plate-grid">
              {moreByDesigner.map((rd, i) => (
                <article className="plate" key={rd.id}>
                  <a href={`design.html?id=${rd.id}`} style={{ display: 'block' }}>
                    <div className="plate-image">
                      <img src={`https://picsum.photos/seed/${rd.seed || rd.id}/900/1100`} alt={rd.title} />
                      <span className="plate-no">{String(i+1).padStart(2,'0')}</span>
                    </div>
                  </a>
                  <div className="plate-caption">
                    <a href={`design.html?id=${rd.id}`} className="title" style={{ color: 'inherit' }}>{rd.title}</a>
                    <span className="price">{rd.price} TND</span>
                    <span className="designer">by {rd.designer}</span>
                    <span className="meta">{rd.rating} ★ · {rd.category}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>

      <PageColophon />
      <Toast msg={cart.toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DesignDetailApp />);
