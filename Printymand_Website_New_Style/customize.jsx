// Customize — "Press configurator" — interactive product configurator

const { useState, useMemo } = React;

function CustomizeApp() {
  const cart = useCart();
  const params = new URLSearchParams(window.location.search);
  const designId = parseInt(params.get('id'), 10) || COVER_DESIGN.id;
  const d = DESIGNS.find(x => x.id === designId) || COVER_DESIGN;

  const productIds = (params.get('products') || PRODUCTS[0].id.toString())
    .split(',').map(s => parseInt(s, 10)).filter(Boolean);
  const products = productIds.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);

  // per-product config
  const [configs, setConfigs] = useState(() => {
    const m = {};
    for (const p of products) {
      m[p.id] = {
        color: p.colors[0],
        size: p.sizes[Math.floor(p.sizes.length / 2)],
        qty: 1,
        x: 50,
        y: 45,
        scale: 0.5,
      };
    }
    return m;
  });

  const patch = (pid, patch) => {
    setConfigs(c => ({ ...c, [pid]: { ...c[pid], ...patch } }));
  };

  const total = useMemo(() => {
    return products.reduce((sum, p) => {
      const c = configs[p.id];
      return sum + (p.basePrice + 4) * (c?.qty || 1);
    }, 0);
  }, [configs, products]);

  const seed = d.seed || `pm-${d.id}`;
  const designImage = d.image || `https://picsum.photos/seed/${seed}/600/600`;

  const onContinue = () => {
    // Add each as cart line
    products.forEach(p => {
      const c = configs[p.id];
      cart.add({
        ...d,
        title: `${d.title} on ${p.name}`,
        price: (p.basePrice + 4) * (c?.qty || 1),
        productId: p.id,
        productName: p.name,
        color: c?.color, size: c?.size, qty: c?.qty,
      });
    });
    setTimeout(() => {
      window.location.href = 'printer-select.html?next=checkout';
    }, 900);
  };

  return (
    <div>
      <PageMasthead cartCount={cart.count} cartBump={cart.bump} currentPage="customize" />

      <PageBread
        no="XIII."
        dept="Press configurator · variants & quantities"
        title={<>Set the<br /><em>press</em> brief.</>}
        deck={`Preview "${d.title}" on each chosen product, then dial in colour, size and quantity. Final price is locked when you pick a pressroom next.`}
        breadcrumb={{ href: `design.html?id=${d.id}`, label: `Back to ${d.title}` }}
      />

      <section className="page">
        {products.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p className="serif-italic" style={{ fontSize: 22, color: 'var(--pm-text-muted)' }}>
              No products selected.
            </p>
            <a href={`design.html?id=${d.id}`} className="btn btn-ghost" style={{ marginTop: 18 }}>← Choose products</a>
          </div>
        ) : products.map((p, idx) => {
          const c = configs[p.id];
          if (!c) return null;
          const colorHex = COLOR_HEX[c.color] || '#999';
          return (
            <div className="cust-card" key={p.id}>
              <div className="head">
                <span className="no">C·{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <div className="pname">{p.name}<small>{p.colors.length} colour{p.colors.length !== 1 ? 's' : ''} · {p.sizes.length} size{p.sizes.length !== 1 ? 's' : ''} · {p.leadTime}-day lead</small></div>
                </div>
                <div className="price">{(p.basePrice + 4) * c.qty}<small style={{ fontSize: 12, fontWeight: 600, color: 'var(--pm-text-muted)', marginLeft: 4 }}> TND</small></div>
              </div>

              <div className="cust-body">
                <div className="cust-preview" style={{ background: colorHex }}>
                  <img className="bg" src={p.image} alt={p.name} style={{ opacity: 0.92, mixBlendMode: 'multiply' }} />
                  <div
                    className="overlay"
                    style={{
                      left: `${c.x}%`,
                      top: `${c.y}%`,
                      width: `${c.scale * 100}%`,
                      backgroundImage: `url('${designImage}')`,
                    }}
                  />
                </div>

                <div className="cust-fields">
                  {p.colors.length > 1 && (
                    <div>
                      <div className="field-label">Colour<span className="v">{c.color}</span></div>
                      <div className="swatch-row">
                        {p.colors.map(col => (
                          <button
                            key={col}
                            className={`swatch-btn ${c.color === col ? 'active' : ''}`}
                            onClick={() => patch(p.id, { color: col })}
                          >
                            <span className="dot" style={{ background: COLOR_HEX[col] || col }}></span>
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.sizes.length > 1 && (
                    <div>
                      <div className="field-label">Size<span className="v">{c.size}</span></div>
                      <div className="size-row">
                        {p.sizes.map(sz => (
                          <button
                            key={sz}
                            className={`size-btn ${c.size === sz ? 'active' : ''}`}
                            onClick={() => patch(p.id, { size: sz })}
                          >{sz}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="field-label">Quantity</div>
                    <div className="qty-row">
                      <button onClick={() => patch(p.id, { qty: Math.max(1, c.qty - 1) })}>−</button>
                      <span className="val">{c.qty}</span>
                      <button onClick={() => patch(p.id, { qty: Math.min(99, c.qty + 1) })}>+</button>
                    </div>
                  </div>

                  <div>
                    <div className="field-label">Print placement<span className="v">artwork {(c.scale * 100).toFixed(0)}% · ({c.x}, {c.y})</span></div>
                    <div className="range-grid">
                      <label>
                        <div className="field-label" style={{ marginBottom: 4 }}>X — {c.x}%</div>
                        <input type="range" className="pm-range" min="15" max="85" value={c.x} onChange={e => patch(p.id, { x: +e.target.value })} />
                      </label>
                      <label>
                        <div className="field-label" style={{ marginBottom: 4 }}>Y — {c.y}%</div>
                        <input type="range" className="pm-range" min="15" max="85" value={c.y} onChange={e => patch(p.id, { y: +e.target.value })} />
                      </label>
                      <label>
                        <div className="field-label" style={{ marginBottom: 4 }}>Scale — {(c.scale * 100).toFixed(0)}%</div>
                        <input type="range" className="pm-range" min="0.15" max="1" step="0.01" value={c.scale} onChange={e => patch(p.id, { scale: +e.target.value })} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {products.length > 0 && (
          <div className="cust-footer">
            <div>
              <div className="ftot-label">Estimated total (from)</div>
              <div className="ftot-amt">{total}<small style={{ fontFamily: 'var(--pm-font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pm-text-muted)', marginLeft: 4 }}> TND</small></div>
              <div className="ftot-note">Final price depends on the pressroom you choose next.</div>
            </div>
            <div className="ftot-actions">
              <a className="btn btn-ghost" href={`design.html?id=${d.id}`}>← Back</a>
              <button className="btn btn-clay" onClick={onContinue}>
                Choose pressroom <span className="ar">→</span>
              </button>
            </div>
          </div>
        )}
      </section>

      <PageColophon />
      <Toast msg={cart.toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CustomizeApp />);
