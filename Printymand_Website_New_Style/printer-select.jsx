// Printer selection — "Pick your pressroom"

const { useState } = React;

function PrinterSelectApp() {
  const cart = useCart();
  const [selected, setSelected] = useState(PRINTERS[0].id);
  const [sortBy, setSortBy] = useState('rating');

  const sorted = [...PRINTERS].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'lead') return a.lead - b.lead;
    if (sortBy === 'price') return a.fromPrice - b.fromPrice;
    return 0;
  });

  return (
    <div>
      <PageMasthead cartCount={cart.count} cartBump={cart.bump} currentPage="printer-select" />

      <PageBread
        no="XIV."
        dept="The pressroom · choose who prints"
        title={<>Who prints<br /><em>this one?</em></>}
        deck="Five verified pressrooms across nine governorates. Each gets the same brief — pick the one whose timeline, location and rating fits."
        breadcrumb={{ href: 'javascript:history.back()', label: 'Back to customize' }}
      />

      <section className="page">
        <div className="filter-row" style={{ borderBottom: '1px solid var(--pm-rule-strong)' }}>
          <span className="label">Rank by:</span>
          {[{k:'rating', l:'Highest rated'}, {k:'lead', l:'Fastest lead'}, {k:'price', l:'Lowest price'}].map(o => (
            <button key={o.k} className={`chip ${sortBy === o.k ? 'active' : ''}`} onClick={() => setSortBy(o.k)}>
              {o.l}
            </button>
          ))}
          <span style={{ marginLeft: 'auto' }} className="market-count">{PRINTERS.length} verified pressrooms</span>
        </div>

        <div style={{ borderBottom: '1px solid var(--pm-rule-strong)' }}>
          {sorted.map(p => (
            <div
              key={p.id}
              className={`printer-pick ${selected === p.id ? 'selected' : ''}`}
              onClick={() => setSelected(p.id)}
            >
              <span className="pidx">{p.idx}</span>
              <div>
                <div className="pname">{p.name}</div>
                <div className="pmeta">
                  <span style={{ color: 'var(--pm-clay)' }}>◦</span> {p.loc} · {p.est} · {p.lead}-day lead · {p.rating} ★ ({p.reviews} reviews) · {p.fulfillment}% fulfilment
                </div>
              </div>
              <div className="pprice">from {p.fromPrice} TND</div>
              <span className="pcheck">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
            </div>
          ))}
        </div>

        <div className="cust-footer">
          <div>
            <div className="ftot-label">Selected pressroom</div>
            <div className="ftot-amt" style={{ fontSize: 28 }}>{PRINTERS.find(p => p.id === selected)?.name}</div>
            <div className="ftot-note">
              {PRINTERS.find(p => p.id === selected)?.loc} ·
              {' '}{PRINTERS.find(p => p.id === selected)?.lead}-day lead ·
              {' '}from {PRINTERS.find(p => p.id === selected)?.fromPrice} TND per item.
            </div>
          </div>
          <div className="ftot-actions">
            <a className="btn btn-ghost" href="javascript:history.back()">← Back</a>
            <a className="btn btn-clay" href="checkout.html">Send the brief <span className="ar">→</span></a>
          </div>
        </div>
      </section>

      <PageColophon />
      <Toast msg={cart.toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PrinterSelectApp />);
