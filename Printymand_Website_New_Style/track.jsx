// Order tracking — "Press log" — timeline view

function TrackApp() {
  const cart = useCart();
  const params = new URLSearchParams(window.location.search);
  const orderIdParam = params.get('id') || ORDERS[0].id;
  const order = ORDERS.find(o => o.id === orderIdParam) || ORDERS[0];

  // Determine current stage
  const stages = TRACK_STAGES;
  let currentIdx = order.stage || 2;

  // For each stage, fabricate a date string near now
  const days = ['12 May', '13 May', '14 May', '15 May', '16 May'];

  return (
    <div>
      <PageMasthead cartCount={cart.count} cartBump={cart.bump} currentPage="track" />

      <PageBread
        no="XVIII."
        dept="The press log · order tracking"
        title={<>Order<br /><em>{order.id}.</em></>}
        deck={`Status: ${order.status.toLowerCase()}. The press log below tracks every hand your order has passed through.`}
        breadcrumb={{ href: 'dashboard.html', label: 'Back to your desk' }}
      />

      <section className="page">

        {/* Order summary header */}
        <div className="track-head">
          <div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="status-pill production">{order.status}</span>
              <span className="serif-italic" style={{ color: 'var(--pm-text-muted)' }}>placed {order.placed} · {order.printer}, {order.loc}</span>
            </div>
            <h2 className="display" style={{ fontSize: 'clamp(28px, 3vw, 44px)', margin: '14px 0 0', lineHeight: 1.05 }}>
              {order.design}<br />
              <em style={{ fontFamily: 'var(--pm-font-serif)', fontStyle: 'italic', color: 'var(--pm-clay)', fontWeight: 500 }}>on {order.product}.</em>
            </h2>
          </div>
          <div className="h-meta">
            <span>Qty {order.qty} · {order.color} · {order.size}</span>
            <strong>{order.total} TND</strong>
            <span>Paid via D17</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="timeline">
          {stages.map((stage, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            const markerClass = `tl-marker ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${i === 0 ? 'first' : ''} ${i === stages.length - 1 ? 'last' : ''}`;
            const bodyClass = `tl-body ${i === 0 ? 'first' : ''}`;
            return (
              <React.Fragment key={stage.key}>
                <div className={markerClass}>
                  <span className="dot"></span>
                </div>
                <div className={bodyClass}>
                  <div className="stage-no">STAGE {String(i + 1).padStart(2, '0')}</div>
                  <div className="stage-title">{stage.label}</div>
                  <p className="stage-blurb">{stage.blurb}</p>
                  <div className="stage-when">
                    {isDone ? days[i] : isCurrent ? `Current — ${days[i]}` : 'Pending'}
                    {isDone && ` · 14:${20 + i * 7} GMT+1`}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Order detail strip */}
        <div className="stat-strip" style={{ marginTop: 32 }}>
          <div className="stat"><span className="n">{currentIdx + 1}<em>/</em>{stages.length}</span><span className="l">Stages complete</span></div>
          <div className="stat"><span className="n">{order.qty}</span><span className="l">Items pressing</span></div>
          <div className="stat"><span className="n">{order.total}<em> TND</em></span><span className="l">Order total</span></div>
          <div className="stat"><span className="n">2<em>d</em></span><span className="l">Expected delivery</span></div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderTop: '1px solid var(--pm-rule)' }}>
          <p className="serif-italic" style={{ color: 'var(--pm-text-muted)', fontSize: 15, margin: 0 }}>
            Questions about this order? <span style={{ color: 'var(--pm-clay)' }}>The pressroom is open Mon — Sat, 9—18h.</span>
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost">Message pressroom</button>
            <button className="btn btn-ghost">Download invoice</button>
            <a className="btn" href="dashboard.html">Your desk →</a>
          </div>
        </div>

        {/* Other orders */}
        <section style={{ paddingTop: 60 }}>
          <div className="section-head">
            <span className="section-no">↳</span>
            <hr className="line" />
            <span className="title">Your other open orders</span>
          </div>
          <table className="news-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Design / product</th>
                <th>Pressroom</th>
                <th className="r">Total</th>
                <th className="r">Status</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.filter(o => o.id !== order.id).map(o => (
                <tr key={o.id} onClick={() => window.location.href = `track.html?id=${o.id}`} style={{ cursor: 'pointer' }}>
                  <td className="id">{o.id}</td>
                  <td className="title-cell">{o.design}<small>{o.product} · {o.color} · {o.size}</small></td>
                  <td>{o.printer}<br/><small style={{ color: 'var(--pm-text-muted)', fontFamily: 'var(--pm-font-serif)', fontStyle: 'italic' }}>{o.loc}</small></td>
                  <td className="r amt">{o.total} TND</td>
                  <td className="r">
                    <span className={`status-pill ${o.status === 'Delivered' ? 'delivered' : o.status === 'In production' ? 'production' : o.status === 'Out for delivery' ? 'shipping' : 'pending'}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>

      <PageColophon />
      <Toast msg={cart.toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<TrackApp />);
