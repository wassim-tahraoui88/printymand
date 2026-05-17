// Checkout — "At the till" — invoice-style cart + payment

const { useState, useMemo } = React;

function CheckoutApp() {
  const cart = useCart();
  const [pay, setPay] = useState('d17');
  const [form, setForm] = useState({
    name: '', phone: '', address: '', city: '', gov: ''
  });
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Default cart items if empty (so the page is browsable)
  const items = cart.cart.length > 0 ? cart.cart : [
    { ...DESIGNS[0], title: 'Carthage Pulse on Premium T-Shirt', productName: 'Premium T-Shirt', color: 'Navy', size: 'L', qty: 1, price: 32, _cid: 'demo-1' },
    { ...DESIGNS[3], title: 'Olive Grove on Canvas Tote Bag', productName: 'Canvas Tote Bag', color: 'Sand', size: 'One Size', qty: 2, price: 56, _cid: 'demo-2' },
  ];

  const subtotal = items.reduce((s, i) => s + (i.price || 0), 0);
  const shipping = subtotal >= 150 ? 0 : 7;
  const tax = Math.round(subtotal * 0.19);
  const total = subtotal + shipping + tax;

  const handlePay = () => {
    if (paying || done) return;
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setDone(true);
      const id = 'PM-' + Math.floor(2000 + Math.random() * 999);
      setOrderId(id);
      cart.clear();
    }, 1800);
  };

  if (done) {
    return (
      <div>
        <PageMasthead cartCount={0} currentPage="checkout" />
        <section className="page" style={{ padding: '60px 0 100px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', width: 80, height: 80, background: 'var(--pm-clay)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 96px)', margin: 0 }}>
            <em style={{ fontFamily: 'var(--pm-font-serif)', fontStyle: 'italic', color: 'var(--pm-clay)', fontWeight: 500 }}>Pressed.</em>
          </h1>
          <p className="serif-italic" style={{ fontSize: 20, color: 'var(--pm-text-muted)', marginTop: 14 }}>
            Order <strong style={{ fontFamily: 'var(--pm-font-display)', fontStyle: 'normal', color: 'var(--pm-ink)' }}>{orderId}</strong> placed. The pressroom has the brief.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <a href={`track.html?id=${orderId}`} className="btn btn-clay">Track this order <span className="ar">→</span></a>
            <a href="marketplace.html" className="btn btn-ghost">Keep browsing</a>
          </div>
        </section>
        <PageColophon />
      </div>
    );
  }

  return (
    <div>
      <PageMasthead cartCount={items.length} currentPage="checkout" />

      <PageBread
        no="XVI."
        dept="At the till · cart, address & payment"
        title={<><em>Settle</em> the brief.</>}
        deck="These items were accepted by the pressroom. Confirm the shipping address, pick a payment method, and we'll start the press."
      />

      <section className="page">
        <div className="invoice-grid">
          {/* LEFT — cart + address */}
          <div>
            <div className="invoice-block">
              <h3>I. The brief</h3>
              <div>
                {items.map(item => (
                  <div className="lineitem" key={item._cid}>
                    <span className="li-img">
                      <img src={item.image || `https://picsum.photos/seed/${item.seed || item.id}/120/120`} alt={item.title} />
                    </span>
                    <div>
                      <div className="li-title">{item.title || item.designTitle || `Plate №${item.id}`}</div>
                      <div className="li-meta">
                        {item.productName ? `${item.productName} · ` : ''}
                        {item.color ? `${item.color} · ` : ''}
                        {item.size ? `${item.size} · ` : ''}
                        Qty {item.qty || 1}
                        {!item.productName && ` · ${item.designer ? `by ${item.designer}` : ''}`}
                      </div>
                    </div>
                    <div>
                      <span className="li-price">{item.price} TND</span>
                      {cart.cart.length > 0 && (
                        <button className="li-remove" onClick={() => cart.remove(item._cid)}>remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="invoice-block">
              <h3>II. Ship it to</h3>
              <div className="form-grid">
                <div className="grid-2">
                  <label>
                    <div className="field-label">Recipient name</div>
                    <input className="pm-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full name on the parcel" />
                  </label>
                  <label>
                    <div className="field-label">Phone</div>
                    <input className="pm-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+216 XX XXX XXX" />
                  </label>
                </div>
                <label>
                  <div className="field-label">Address line</div>
                  <input className="pm-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street, building, apartment, landmark…" />
                </label>
                <div className="grid-2">
                  <label>
                    <div className="field-label">City</div>
                    <input className="pm-input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" />
                  </label>
                  <label>
                    <div className="field-label">Governorate</div>
                    <select className="pm-select" value={form.gov} onChange={e => setForm({...form, gov: e.target.value})}>
                      <option value="">— select —</option>
                      {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — payment + totals */}
          <aside>
            <div className="invoice-block">
              <h3>III. Pay with</h3>
              {[
                { k: 'd17',    mark: 'D17',  name: 'D17 mobile wallet',  desc: 'Pay instantly from the D17 app.', tag: 'Most used' },
                { k: 'card',   mark: 'CARD', name: 'Visa or MasterCard', desc: 'Card processed via Paymee, in TND.' },
                { k: 'paymee', mark: 'PM',   name: 'Paymee',             desc: 'Tunisian gateway, secure tokenized payment.' },
                { k: 'cash',   mark: 'COD',  name: 'Cash on delivery',   desc: 'Pay when the courier hands it over.' },
              ].map(opt => (
                <button key={opt.k} className={`pay-tile-row ${pay === opt.k ? 'selected' : ''}`} onClick={() => setPay(opt.k)}>
                  <span className="pay-mark">{opt.mark}</span>
                  <div>
                    <div className="pay-name">{opt.name}</div>
                    <div className="pay-desc">{opt.desc}</div>
                  </div>
                  {opt.tag && <span className="pay-tag">{opt.tag}</span>}
                </button>
              ))}
            </div>

            <div className="invoice-block">
              <h3>IV. The numbers</h3>
              <div className="totals-row"><span>Subtotal</span><span>{subtotal} TND</span></div>
              <div className="totals-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `${shipping} TND`}</span></div>
              <div className="totals-row"><span>VAT (19%)</span><span>{tax} TND</span></div>
              <div className="totals-row total"><span>Total</span><span>{total} TND</span></div>
            </div>

            <button className="btn btn-clay" onClick={handlePay} style={{ width: '100%', justifyContent: 'center', padding: '18px', fontSize: 13 }} disabled={paying}>
              {paying ? 'Pressing…' : `Pay ${total} TND · ${pay.toUpperCase()}`} <span className="ar">→</span>
            </button>

            <p className="serif-italic" style={{ fontSize: 13, color: 'var(--pm-text-muted)', textAlign: 'center', marginTop: 14 }}>
              Secure checkout. Free returns inside Tunisia for 14 days. The platform pays the pressroom on dispatch.
            </p>
          </aside>
        </div>
      </section>

      <PageColophon />
      <Toast msg={cart.toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CheckoutApp />);
