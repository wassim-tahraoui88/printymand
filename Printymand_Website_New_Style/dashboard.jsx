// Dashboard — "The Editor's Desk" — unified workspace for all roles

const { useState, useMemo } = React;

const ROLES = [
  { key: 'customer', label: 'Customer',  who: 'Karim Dhouib',     handle: 'karim@printymand.tn' },
  { key: 'designer', label: 'Designer',  who: 'Amira Ben Salem',  handle: 'amira@printymand.tn' },
  { key: 'printer',  label: 'Printer',   who: 'PrintPro Tunisia', handle: 'printpro@printymand.tn' },
  { key: 'admin',    label: 'Editor',    who: 'Editorial Desk',   handle: 'editor@printymand.tn' },
];

const NAV = {
  customer: [
    { k: 'overview', l: 'Overview' },
    { k: 'orders',   l: 'My orders' },
    { k: 'addresses',l: 'Addresses' },
    { k: 'wishlist', l: 'Wishlist' },
    { k: 'settings', l: 'Settings' },
  ],
  designer: [
    { k: 'overview',  l: 'Overview' },
    { k: 'designs',   l: 'My designs' },
    { k: 'analytics', l: 'Analytics' },
    { k: 'payouts',   l: 'Payouts' },
    { k: 'storefront',l: 'Storefront' },
  ],
  printer: [
    { k: 'overview',  l: 'Overview' },
    { k: 'queue',     l: 'Press queue' },
    { k: 'orders',    l: 'Order log' },
    { k: 'earnings',  l: 'Earnings' },
    { k: 'profile',   l: 'Pressroom profile' },
  ],
  admin: [
    { k: 'overview',  l: 'Platform pulse' },
    { k: 'approvals', l: 'Approvals' },
    { k: 'users',     l: 'People' },
    { k: 'reports',   l: 'Reports' },
    { k: 'settings',  l: 'Settings' },
  ],
};

function DashboardApp() {
  const cart = useCart();
  const [role, setRole] = useState('customer');
  const [tab, setTab] = useState('overview');

  // Keep tab valid when role changes
  React.useEffect(() => {
    if (!NAV[role].find(n => n.k === tab)) setTab(NAV[role][0].k);
  }, [role]);

  const roleData = ROLES.find(r => r.key === role);

  return (
    <div>
      <PageMasthead cartCount={cart.count} cartBump={cart.bump} currentPage="dashboard" />

      <section className="page">
        <div className="desk">
          {/* SIDEBAR */}
          <aside className="desk-side">
            <span className="kicker">The editor's desk</span>
            <h2 className="desk-role">
              {roleData.label}<br />
              <em>workspace.</em>
            </h2>
            <div className="user-line">— {roleData.who}</div>

            <ul className="desk-nav">
              {NAV[role].map(n => (
                <li key={n.k} className={tab === n.k ? 'active' : ''}>
                  <button onClick={() => setTab(n.k)}>
                    <span>{n.l}</span>
                    <span className="arrow">→</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="kicker" style={{ marginTop: 30, marginBottom: 10 }}>View as</div>
            <div className="role-switch">
              {ROLES.map(r => (
                <button key={r.key} className={role === r.key ? 'active' : ''} onClick={() => setRole(r.key)}>
                  {r.label}
                </button>
              ))}
            </div>

            <p className="serif-italic" style={{ fontSize: 13, color: 'var(--pm-text-muted)', marginTop: 28, lineHeight: 1.55 }}>
              The editorial desk runs four workspaces. Switch between them to see how the same press feels from each side of the counter.
            </p>
          </aside>

          {/* MAIN */}
          <main className="desk-main">
            <DeskView role={role} tab={tab} />
          </main>
        </div>
      </section>

      <PageColophon />
      <Toast msg={cart.toast} />
    </div>
  );
}

function DeskView({ role, tab }) {
  return (
    <div>
      <DeskHeader role={role} tab={tab} />

      {role === 'customer' && <CustomerViews tab={tab} />}
      {role === 'designer' && <DesignerViews tab={tab} />}
      {role === 'printer'  && <PrinterViews tab={tab} />}
      {role === 'admin'    && <AdminViews tab={tab} />}
    </div>
  );
}

function DeskHeader({ role, tab }) {
  const titles = {
    customer: { overview: <>Welcome <em>back.</em></>, orders: <>Your <em>orders.</em></>, addresses: <>Addresses on file.</>, wishlist: <>Things you'd <em>wear.</em></>, settings: <>Account &amp; <em>preferences.</em></> },
    designer: { overview: <>The studio <em>at a glance.</em></>, designs: <>The <em>portfolio.</em></>, analytics: <>What's <em>selling.</em></>, payouts: <>Pay <em>days.</em></>, storefront: <>Public <em>storefront.</em></> },
    printer:  { overview: <>The <em>pressroom.</em></>, queue: <>The <em>queue.</em></>, orders: <>Order log.</>, earnings: <>This week's <em>take.</em></>, profile: <>Public <em>profile.</em></> },
    admin:    { overview: <>Platform <em>pulse.</em></>, approvals: <>Awaiting <em>review.</em></>, users: <>The <em>people.</em></>, reports: <>The <em>numbers.</em></>, settings: <>Platform <em>settings.</em></> },
  };
  const subtitles = {
    customer: 'Last sign-in 14 May · Tunis edition',
    designer: 'Royalties paid every Friday · Elite tier',
    printer:  'Premium pressroom · 98% fulfilment · 2-day lead',
    admin:    'Issue Nº 07 · 14,200 orders fulfilled this quarter',
  };
  return (
    <header className="desk-header">
      <h1 className="h-title">{titles[role][tab]}</h1>
      <div className="h-meta">
        <strong style={{ fontFamily: 'var(--pm-font-display)', fontStyle: 'normal', fontSize: 22, color: 'var(--pm-ink)', display: 'block', letterSpacing: '-0.02em' }}>{ROLES.find(r => r.key === role).who}</strong>
        <em style={{ fontFamily: 'var(--pm-font-serif)', fontStyle: 'italic' }}>{subtitles[role]}</em>
      </div>
    </header>
  );
}

// ── CUSTOMER ──────────────────────────────────────────────
function CustomerViews({ tab }) {
  if (tab === 'overview') {
    return (
      <div>
        <div className="kpi-grid">
          <div className="kpi"><div className="l">Total orders</div><div className="v">{ORDERS.length}</div><div className="delta">+2 this month</div></div>
          <div className="kpi"><div className="l">Delivered</div><div className="v">{ORDERS.filter(o => o.status === 'Delivered').length}</div><div className="delta">on track</div></div>
          <div className="kpi"><div className="l">In progress</div><div className="v">{ORDERS.filter(o => o.status !== 'Delivered').length}</div><div className="delta">2-3 day ETA</div></div>
          <div className="kpi"><div className="l">Total spend</div><div className="v">{ORDERS.reduce((s,o)=>s+o.total,0)}<small> TND</small></div><div className="delta">YTD</div></div>
        </div>

        <div className="desk-section">
          <h3>Recent orders <span className="small">5 most recent</span></h3>
          <OrdersTable rows={ORDERS} />
        </div>

        <div className="desk-section">
          <h3>You might like <span className="small">based on your past orders</span></h3>
          <div className="plate-grid" style={{ paddingTop: 0 }}>
            {DESIGNS.slice(1, 5).map((d, i) => (
              <article className="plate" key={d.id}>
                <a href={`design.html?id=${d.id}`} style={{ display: 'block' }}>
                  <div className="plate-image">
                    <img src={`https://picsum.photos/seed/${d.seed || d.id}/900/1100`} alt={d.title} />
                    <span className="plate-no">R·{String(i+1).padStart(2,'0')}</span>
                  </div>
                </a>
                <div className="plate-caption">
                  <a href={`design.html?id=${d.id}`} className="title" style={{ color: 'inherit' }}>{d.title}</a>
                  <span className="price">{d.price} TND</span>
                  <span className="designer">by {d.designer}</span>
                  <span className="meta">{d.rating} ★</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'orders') {
    return (
      <div className="desk-section">
        <h3>All orders <span className="small">{ORDERS.length} total</span></h3>
        <OrdersTable rows={ORDERS} />
      </div>
    );
  }

  if (tab === 'addresses') {
    const addrs = [
      { label: 'Home', def: true, recipient: 'Karim Dhouib', body: '23 rue de Carthage, ap. 4 · Tunis 1002 · +216 71 234 567' },
      { label: 'Studio', def: false, recipient: 'Karim Dhouib', body: 'Souk el Atarine 7 · Sfax 3000 · +216 74 555 444' },
    ];
    return (
      <div className="desk-section">
        <h3>Saved addresses <span className="small">tap to edit</span></h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {addrs.map(a => (
            <div key={a.label} className="addr-card">
              <div>
                <div className="a-label">{a.label}{a.def && <span className="def">Default</span>}</div>
                <div className="a-body">{a.recipient} · {a.body}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 11 }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn">+ Add new address</button>
        </div>
      </div>
    );
  }

  if (tab === 'wishlist') {
    return (
      <div className="desk-section">
        <h3>Saved for later <span className="small">3 plates</span></h3>
        <div className="plate-grid" style={{ paddingTop: 0 }}>
          {[DESIGNS[1], DESIGNS[5], DESIGNS[8]].map((d, i) => (
            <article className="plate" key={d.id}>
              <a href={`design.html?id=${d.id}`} style={{ display: 'block' }}>
                <div className="plate-image">
                  <img src={`https://picsum.photos/seed/${d.seed || d.id}/900/1100`} alt={d.title} />
                  <span className="plate-no">W·{String(i+1).padStart(2,'0')}</span>
                </div>
              </a>
              <div className="plate-caption">
                <span className="title">{d.title}</span>
                <span className="price">{d.price} TND</span>
                <span className="designer">by {d.designer}</span>
                <span className="meta">{d.rating} ★</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'settings') {
    return <SettingsForm />;
  }
  return null;
}

// ── DESIGNER ──────────────────────────────────────────────
function DesignerViews({ tab }) {
  const myDesigns = DESIGNS.filter(d => d.designer === 'Amira Ben Salem');

  if (tab === 'overview') {
    return (
      <div>
        <div className="kpi-grid">
          <div className="kpi"><div className="l">Total earnings</div><div className="v">3,840<small> TND</small></div><div className="delta">+12% MoM</div></div>
          <div className="kpi"><div className="l">Active designs</div><div className="v">{myDesigns.length}</div><div className="delta">2 in review</div></div>
          <div className="kpi"><div className="l">Orders fulfilled</div><div className="v">{myDesigns.reduce((s,d)=>s+d.sales,0)}</div><div className="delta">+38 this month</div></div>
          <div className="kpi"><div className="l">Avg conversion</div><div className="v">4.2<small>%</small></div><div className="delta">+0.3pt</div></div>
        </div>

        <div className="desk-section">
          <h3>Your top plates <span className="small">by sales this quarter</span></h3>
          <BarChart rows={myDesigns.map(d => ({ name: d.title, value: d.sales }))} />
        </div>

        <div className="desk-section">
          <h3>Recent payouts <span className="small">via D17</span></h3>
          <PayoutsTable rows={PAYOUTS} />
        </div>
      </div>
    );
  }

  if (tab === 'designs') {
    return (
      <div>
        <div className="desk-section">
          <h3>The portfolio <span className="small">tap to edit</span></h3>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button className="btn">+ Upload new plate</button>
          </div>
          <table className="news-table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Category</th>
                <th className="r">Sales</th>
                <th className="r">Rating</th>
                <th className="r">Status</th>
              </tr>
            </thead>
            <tbody>
              {myDesigns.map(d => (
                <tr key={d.id}>
                  <td><div style={{ width: 40, height: 40, background: 'var(--pm-paper-deep)', overflow: 'hidden' }}><img src={`https://picsum.photos/seed/${d.seed || d.id}/80/80`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div></td>
                  <td className="title-cell">{d.title}<small>{(d.tags || []).slice(0,3).join(', ')}</small></td>
                  <td>{d.category}</td>
                  <td className="r amt">{d.sales}</td>
                  <td className="r amt">{d.rating} ★</td>
                  <td className="r"><span className="status-pill delivered">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 'analytics') {
    return (
      <div>
        <div className="desk-section">
          <h3>Sales by plate <span className="small">last 90 days</span></h3>
          <div className="donut-row">
            <DonutChart data={myDesigns.map((d,i) => ({ name: d.title, value: d.sales, color: ['#C74A2B','#E8A23A','#1B3A5C','#6B7A4E'][i % 4] }))} />
            <div className="donut-legend">
              {myDesigns.map((d,i) => (
                <div className="l-item" key={d.id}>
                  <span className="sw" style={{ background: ['#C74A2B','#E8A23A','#1B3A5C','#6B7A4E'][i % 4] }}></span>
                  <span className="name">{d.title}</span>
                  <span className="val">{d.sales}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="desk-section">
          <h3>Plate performance <span className="small">conversion & revenue</span></h3>
          <table className="news-table">
            <thead><tr><th>Plate</th><th className="r">Views</th><th className="r">Orders</th><th className="r">CVR</th><th className="r">Revenue</th></tr></thead>
            <tbody>
              {myDesigns.map(d => {
                const views = d.sales * 24 + 100;
                const cvr = ((d.sales / views) * 100).toFixed(1);
                const rev = d.sales * 4;
                return (
                  <tr key={d.id}>
                    <td className="title-cell">{d.title}</td>
                    <td className="r">{views}</td>
                    <td className="r">{d.sales}</td>
                    <td className="r">{cvr}%</td>
                    <td className="r amt">{rev} TND</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 'payouts') {
    return (
      <div>
        <div className="desk-section">
          <h3>Available balance <span className="small">payout every Friday · min 50 TND</span></h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', padding: '24px 0', borderTop: '1px solid var(--pm-rule-strong)', borderBottom: '1px solid var(--pm-rule-strong)', flexWrap: 'wrap', gap: 18 }}>
            <div>
              <div className="kpi-l" style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--pm-text-muted)' }}>Available</div>
              <div style={{ fontFamily: 'var(--pm-font-display)', fontWeight: 800, fontSize: 64, letterSpacing: '-0.04em', lineHeight: 1 }}>480<small style={{ fontSize: 18, fontWeight: 600, color: 'var(--pm-text-muted)', marginLeft: 6 }}> TND</small></div>
              <div style={{ marginTop: 8, fontFamily: 'var(--pm-font-serif)', fontStyle: 'italic', color: 'var(--pm-text-muted)' }}>Tier: <strong style={{ color: 'var(--pm-clay)', fontFamily: 'var(--pm-font-display)', fontStyle: 'normal' }}>Elite</strong> · Sales score 854</div>
            </div>
            <button className="btn btn-clay">Request payout <span className="ar">→</span></button>
          </div>
        </div>

        <div className="desk-section">
          <h3>Payout history</h3>
          <PayoutsTable rows={PAYOUTS} />
        </div>
      </div>
    );
  }

  if (tab === 'storefront') {
    return <SettingsForm storefront />;
  }
  return null;
}

// ── PRINTER ──────────────────────────────────────────────
function PrinterViews({ tab }) {
  const QUEUE = [
    { id: 'PM-2001', design: 'Carthage Pulse', product: 'Premium T-Shirt', qty: 2, status: 'New brief', received: '2h ago' },
    { id: 'PM-2002', design: 'Olive Grove',    product: 'Canvas Tote Bag', qty: 1, status: 'New brief', received: '4h ago' },
    { id: 'PM-2003', design: 'Sahara Type',    product: 'Oversized Hoodie',qty: 1, status: 'In production', received: 'Yesterday' },
    { id: 'PM-2004', design: 'Souk Pattern',   product: 'Ceramic Mug',     qty: 3, status: 'In production', received: 'Yesterday' },
    { id: 'PM-2005', design: 'Medina Minimal', product: 'Art Print A2',    qty: 1, status: 'Packing', received: '2 days ago' },
  ];

  if (tab === 'overview') {
    return (
      <div>
        <div className="kpi-grid">
          <div className="kpi"><div className="l">New briefs</div><div className="v">2</div><div className="delta">accept within 24h</div></div>
          <div className="kpi"><div className="l">In production</div><div className="v">3</div><div className="delta">on schedule</div></div>
          <div className="kpi"><div className="l">This week</div><div className="v">1,240<small> TND</small></div><div className="delta">+18% WoW</div></div>
          <div className="kpi"><div className="l">Fulfilment</div><div className="v">98<small>%</small></div><div className="delta">premium tier</div></div>
        </div>

        <div className="desk-section">
          <h3>Today's queue <span className="small">tap to accept &amp; press</span></h3>
          <QueueTable rows={QUEUE} />
        </div>
      </div>
    );
  }

  if (tab === 'queue') {
    return (
      <div className="desk-section">
        <h3>Press queue <span className="small">{QUEUE.length} jobs · sorted by age</span></h3>
        <QueueTable rows={QUEUE} />
      </div>
    );
  }

  if (tab === 'orders') {
    return (
      <div className="desk-section">
        <h3>Order log <span className="small">all-time fulfilled</span></h3>
        <OrdersTable rows={ORDERS} />
      </div>
    );
  }

  if (tab === 'earnings') {
    return (
      <div>
        <div className="kpi-grid">
          <div className="kpi"><div className="l">This week</div><div className="v">1,240<small> TND</small></div><div className="delta">+18% WoW</div></div>
          <div className="kpi"><div className="l">This month</div><div className="v">4,820<small> TND</small></div><div className="delta">+9% MoM</div></div>
          <div className="kpi"><div className="l">Year to date</div><div className="v">48.6k<small> TND</small></div><div className="delta">tracking +25%</div></div>
          <div className="kpi"><div className="l">Avg per order</div><div className="v">28<small> TND</small></div><div className="delta">steady</div></div>
        </div>
        <div className="desk-section">
          <h3>Top categories pressed <span className="small">last 30 days</span></h3>
          <BarChart rows={[
            { name: 'Premium T-Shirt', value: 142 },
            { name: 'Oversized Hoodie', value: 86 },
            { name: 'Canvas Tote Bag', value: 64 },
            { name: 'Art Print A2', value: 38 },
            { name: 'Ceramic Mug', value: 24 },
          ]} />
        </div>
      </div>
    );
  }

  if (tab === 'profile') {
    return <SettingsForm pressroom />;
  }
  return null;
}

// ── ADMIN ──────────────────────────────────────────────
function AdminViews({ tab }) {
  if (tab === 'overview') {
    return (
      <div>
        <div className="kpi-grid">
          <div className="kpi"><div className="l">Customers</div><div className="v">4.28k</div><div className="delta">+312 MTD</div></div>
          <div className="kpi"><div className="l">Designers</div><div className="v">126</div><div className="delta">+8 MTD</div></div>
          <div className="kpi"><div className="l">Pressrooms</div><div className="v">38</div><div className="delta">+2 MTD</div></div>
          <div className="kpi"><div className="l">GMV YTD</div><div className="v">412k<small> TND</small></div><div className="delta">+34% YoY</div></div>
        </div>

        <div className="desk-section">
          <h3>Approvals queue <span className="small">3 plates · 1 pressroom · 2 disputes</span></h3>
          <ApprovalsTable />
        </div>

        <div className="desk-section">
          <h3>Pressrooms by fulfilment <span className="small">last 30 days</span></h3>
          <BarChart rows={PRINTERS.map(p => ({ name: p.name, value: p.fulfillment }))} suffix="%" />
        </div>
      </div>
    );
  }

  if (tab === 'approvals') {
    return (
      <div className="desk-section">
        <h3>Awaiting editorial review</h3>
        <ApprovalsTable extended />
      </div>
    );
  }

  if (tab === 'users') {
    const people = [
      ...DESIGNS.slice(0, 4).map(d => ({ name: d.designer, role: 'Designer', tier: d.designerRank, items: d.sales })),
      ...PRINTERS.slice(0, 3).map(p => ({ name: p.name, role: 'Printer', tier: p.rank, items: p.reviews })),
    ];
    return (
      <div className="desk-section">
        <h3>People on the platform <span className="small">{people.length} shown · tap to view profile</span></h3>
        <table className="news-table">
          <thead><tr><th>Name</th><th>Role</th><th>Tier</th><th className="r">Volume</th></tr></thead>
          <tbody>
            {people.map((p, i) => (
              <tr key={i}>
                <td className="title-cell">{p.name}</td>
                <td>{p.role}</td>
                <td>{p.tier}</td>
                <td className="r amt">{p.items}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'reports') {
    return (
      <div>
        <div className="kpi-grid">
          <div className="kpi"><div className="l">Orders YTD</div><div className="v">14.2k</div><div className="delta">on track for 30k</div></div>
          <div className="kpi"><div className="l">Royalties paid</div><div className="v">208k<small> TND</small></div><div className="delta">+22% YoY</div></div>
          <div className="kpi"><div className="l">Avg order</div><div className="v">42<small> TND</small></div><div className="delta">steady</div></div>
          <div className="kpi"><div className="l">Refund rate</div><div className="v">1.8<small>%</small></div><div className="delta neg">+0.2pt</div></div>
        </div>
        <div className="desk-section">
          <h3>Category mix <span className="small">share of GMV</span></h3>
          <div className="donut-row">
            <DonutChart data={[
              { name: 'Culture',    value: 32, color: '#C74A2B' },
              { name: 'Streetwear', value: 22, color: '#E8A23A' },
              { name: 'Minimal',    value: 18, color: '#1B3A5C' },
              { name: 'Retro',      value: 14, color: '#6B7A4E' },
              { name: 'Other',      value: 14, color: '#9A8A7D' },
            ]} />
            <div className="donut-legend">
              {[
                { name: 'Culture', value: '32%', c: '#C74A2B' },
                { name: 'Streetwear', value: '22%', c: '#E8A23A' },
                { name: 'Minimal', value: '18%', c: '#1B3A5C' },
                { name: 'Retro', value: '14%', c: '#6B7A4E' },
                { name: 'Other', value: '14%', c: '#9A8A7D' },
              ].map((row, i) => (
                <div className="l-item" key={i}>
                  <span className="sw" style={{ background: row.c }}></span>
                  <span className="name">{row.name}</span>
                  <span className="val">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'settings') return <SettingsForm admin />;
  return null;
}

// ── shared tables ─────────────────────────────────────────
function OrdersTable({ rows }) {
  return (
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
        {rows.map(o => (
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
  );
}

function QueueTable({ rows }) {
  const [accepted, setAccepted] = useState({});
  return (
    <table className="news-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Design</th>
          <th>Product</th>
          <th className="r">Qty</th>
          <th className="r">Status</th>
          <th className="r">Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td className="id">{r.id}</td>
            <td className="title-cell">{r.design}<small>received {r.received}</small></td>
            <td>{r.product}</td>
            <td className="r amt">{r.qty}</td>
            <td className="r">
              <span className={`status-pill ${r.status === 'New brief' ? 'pending' : r.status === 'In production' ? 'production' : 'shipping'}`}>
                {accepted[r.id] ? 'Accepted' : r.status}
              </span>
            </td>
            <td className="r">
              {r.status === 'New brief' && !accepted[r.id] && (
                <button className="btn btn-clay" style={{ padding: '8px 14px', fontSize: 11 }} onClick={() => setAccepted(a => ({...a, [r.id]: true}))}>
                  Accept
                </button>
              )}
              {(r.status !== 'New brief' || accepted[r.id]) && (
                <span className="serif-italic" style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>in progress →</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PayoutsTable({ rows }) {
  return (
    <table className="news-table">
      <thead><tr><th>Ref</th><th>Due</th><th className="r">Amount</th><th className="r">Status</th></tr></thead>
      <tbody>
        {rows.map(p => (
          <tr key={p.id}>
            <td className="id">{p.ref}</td>
            <td>{p.due}</td>
            <td className="r amt">{p.amount} TND</td>
            <td className="r"><span className={`status-pill ${p.status === 'Paid' ? 'paid' : 'pending'}`}>{p.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ApprovalsTable({ extended }) {
  const rows = [
    { kind: 'Plate',     who: 'Atlas Lines · Karim Dhouib',          submitted: '2h ago', action: 'Review artwork' },
    { kind: 'Plate',     who: 'Mosaic 47 · Mehdi Karoui',            submitted: '5h ago', action: 'Review artwork' },
    { kind: 'Plate',     who: 'Couscous Sundays · Yasmine Ferjani',  submitted: '1d ago', action: 'Review artwork' },
    { kind: 'Pressroom', who: 'Studio Imprimerie Tozeur',            submitted: '3d ago', action: 'Verify shop' },
    { kind: 'Dispute',   who: 'Order PM-1944 · refund request',      submitted: 'Today',  action: 'Mediate' },
    { kind: 'Dispute',   who: 'Order PM-1939 · misprint claim',      submitted: 'Today',  action: 'Mediate' },
  ];
  return (
    <table className="news-table">
      <thead><tr><th>Type</th><th>Item</th><th>Submitted</th><th className="r">Action</th></tr></thead>
      <tbody>
        {rows.slice(0, extended ? rows.length : 4).map((r, i) => (
          <tr key={i}>
            <td><span className={`status-pill ${r.kind === 'Dispute' ? 'pending' : r.kind === 'Pressroom' ? 'production' : 'shipping'}`}>{r.kind}</span></td>
            <td className="title-cell">{r.who}</td>
            <td>{r.submitted}</td>
            <td className="r">
              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }}>{r.action} →</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Settings forms ────────────────────────────────────────
function SettingsForm({ storefront, pressroom, admin }) {
  if (storefront) {
    return (
      <div>
        <div className="desk-section">
          <h3>Storefront identity <span className="small">how customers see you</span></h3>
          <div className="setting-grid">
            <label><div className="field-label">Display name</div><input className="pm-input" defaultValue="Amira Ben Salem" /></label>
            <label><div className="field-label">Handle</div><input className="pm-input" defaultValue="@amira.bs" /></label>
            <label style={{ gridColumn: '1 / -1' }}><div className="field-label">Bio</div><textarea className="pm-input" rows="3" defaultValue="Designer from Tunis. I work in the language of blue tile and bone-white linen." /></label>
            <label><div className="field-label">Profile photo URL</div><input className="pm-input" placeholder="https://..." /></label>
            <label><div className="field-label">Banner URL</div><input className="pm-input" placeholder="https://..." /></label>
          </div>
        </div>
        <div className="desk-section">
          <h3>Payouts <span className="small">paid every Friday</span></h3>
          <div className="setting-grid">
            <label><div className="field-label">D17 phone</div><input className="pm-input" defaultValue="+216 71 234 567" /></label>
            <label><div className="field-label">Bank IBAN</div><input className="pm-input" placeholder="TN59 ..." /></label>
          </div>
        </div>
        <div><button className="btn btn-clay">Save storefront</button></div>
      </div>
    );
  }
  if (pressroom) {
    return (
      <div>
        <div className="desk-section">
          <h3>Pressroom profile</h3>
          <div className="setting-grid">
            <label><div className="field-label">Business name</div><input className="pm-input" defaultValue="PrintPro Tunisia" /></label>
            <label><div className="field-label">Governorate</div>
              <select className="pm-select" defaultValue="Tunis">{GOVERNORATES.map(g => <option key={g}>{g}</option>)}</select>
            </label>
            <label style={{ gridColumn: '1 / -1' }}><div className="field-label">About the pressroom</div><textarea className="pm-input" rows="3" defaultValue="A verified Tunisian print shop with 2-day delivery and a 98% fulfillment rate." /></label>
            <label><div className="field-label">Lead time (days)</div><input className="pm-input" type="number" defaultValue="2" /></label>
            <label><div className="field-label">Minimum order</div><input className="pm-input" type="number" defaultValue="20" /></label>
          </div>
        </div>
        <div className="desk-section">
          <h3>Capabilities <span className="small">products you can press</span></h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRODUCTS.map(p => (
              <button key={p.id} className="chip active">{p.name}</button>
            ))}
          </div>
        </div>
        <div><button className="btn btn-clay">Save pressroom profile</button></div>
      </div>
    );
  }
  if (admin) {
    return (
      <div>
        <div className="desk-section">
          <h3>Platform settings</h3>
          <div className="setting-grid">
            <label><div className="field-label">Royalty per sale (TND)</div><input className="pm-input" type="number" defaultValue="4" /></label>
            <label><div className="field-label">Platform margin (TND)</div><input className="pm-input" type="number" defaultValue="4" /></label>
            <label><div className="field-label">Payout threshold (TND)</div><input className="pm-input" type="number" defaultValue="50" /></label>
            <label><div className="field-label">Refund window (days)</div><input className="pm-input" type="number" defaultValue="14" /></label>
          </div>
        </div>
        <div><button className="btn btn-clay">Save platform settings</button></div>
      </div>
    );
  }
  // customer settings
  return (
    <div>
      <div className="desk-section">
        <h3>Account</h3>
        <div className="setting-grid">
          <label><div className="field-label">Full name</div><input className="pm-input" defaultValue="Karim Dhouib" /></label>
          <label><div className="field-label">Email</div><input className="pm-input" defaultValue="karim@printymand.tn" /></label>
          <label><div className="field-label">Phone</div><input className="pm-input" defaultValue="+216 71 234 567" /></label>
          <label><div className="field-label">Language</div>
            <select className="pm-select"><option>Français</option><option>العربية</option><option>English</option></select>
          </label>
        </div>
      </div>
      <div><button className="btn btn-clay">Save changes</button></div>
    </div>
  );
}

// ── Tiny chart components ─────────────────────────────────
function DonutChart({ data, size = 180 }) {
  const total = data.reduce((s,d) => s + d.value, 0) || 1;
  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const arcs = data.map((d, i) => {
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + radius * Math.cos(a0);
    const y0 = cy + radius * Math.sin(a0);
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return (
      <path key={i}
        d={`M ${cx} ${cy} L ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} Z`}
        fill={d.color}
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs}
      <circle cx={cx} cy={cy} r={radius * 0.55} fill="var(--pm-bg)" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="var(--pm-font-display)" fontWeight="800" fontSize={size * 0.16} fill="var(--pm-ink)">{total}</text>
      <text x={cx} y={cy + size * 0.12} textAnchor="middle" fontFamily="var(--pm-font-sans)" fontSize={size * 0.06} fontWeight="700" letterSpacing="2" fill="var(--pm-text-muted)">TOTAL</text>
    </svg>
  );
}

function BarChart({ rows, suffix = '' }) {
  const max = Math.max(...rows.map(r => r.value)) || 1;
  return (
    <div className="bar-row">
      {rows.map((r, i) => (
        <div className="bar" key={i}>
          <div>
            <div className="name">{r.name}</div>
            <div className="track"><div className="fill" style={{ width: `${(r.value / max) * 100}%` }}></div></div>
          </div>
          <div className="v">{r.value}{suffix}</div>
        </div>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DashboardApp />);
