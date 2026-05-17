// Printymand Issue Nº 07 — spread components
// Each spread is a distinct "page" of the magazine.

const { useState, useEffect, useMemo, useRef } = React;

// ─────────────────────────────────────────────────────────
// COVER
// ─────────────────────────────────────────────────────────
function Cover({ onAddToCart }) {
  return (
    <section id="cover" className="page cover">
      <span className="folio left">Recto — 002</span>
      <span className="folio right">Spring 2026 — issue 07</span>

      <div className="cover-grid">
        <div>
          <div className="kicker" style={{ marginBottom: 18 }}>
            <span style={{ color: 'var(--pm-clay)' }}>✦</span>&nbsp;&nbsp;The cover — designed, printed &amp; worn in Tunisia
          </div>

          <h2 className="cover-headline" style={{ marginTop: 6 }}>
            Design<br />
            <em>it.</em><br />
            Print <span className="outline">it.</span><br />
            <span className="amber">Worn</span><br />
            in Tunisia.
          </h2>

          <p className="cover-deck">
            A quarterly press of designs from Tunisian artists — printed by verified
            local shops, paid in dinars, delivered in days.
          </p>

          <div className="cover-meta" style={{ marginTop: 28 }}>
            <div>
              <strong>In this issue</strong><br />
              <span>8 featured plates · 5 pressrooms · 1 manifesto</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>Cover price</strong><br />
              <span>{ISSUE.price} · {ISSUE.copies}</span>
            </div>
          </div>
        </div>

        <div className="cover-right">
          <div className="cover-image-wrap">
            <img src={COVER_DESIGN.image} alt={COVER_DESIGN.title} />
            <div className="badge-stack">
              <div className="price-stamp">
                <div>
                  <span className="big">{COVER_DESIGN.price}</span>
                  <span className="sm">TND · from</span>
                </div>
              </div>
            </div>
          </div>
          <button
            className="cover-callout"
            onClick={() => onAddToCart(COVER_DESIGN)}
            style={{ border: 0, width: '100%', cursor: 'pointer', textAlign: 'left' }}
          >
            <span>The cover story <span style={{ color: 'var(--pm-amber)', marginLeft: 6 }}>↳</span> Carthage Pulse, page 04</span>
            <span className="arrow">→</span>
          </button>
        </div>
      </div>

      <div className="cover-ticker">
        <div className="lane" aria-hidden="false">
          {TICKER.map((t, i) => <span key={i}>{t}</span>)}
        </div>
        <div className="lane" aria-hidden="true">
          {TICKER.map((t, i) => <span key={'b'+i}>{t}</span>)}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// MANIFESTO
// ─────────────────────────────────────────────────────────
function Manifesto() {
  return (
    <section id="manifesto" className="page spread">
      <span className="folio left">Editorial — 003</span>

      <div className="section-head">
        <span className="section-no">I.</span>
        <hr className="line" />
        <span className="title">From the editor's desk</span>
      </div>

      <div className="manifesto">
        <aside className="side">
          <span className="kicker">In this volume</span>
          <ul>
            <li><span className="num">I</span><span>Editorial</span></li>
            <li><span className="num">II</span><span>The cover story</span></li>
            <li><span className="num">III</span><span>Featured plates</span></li>
            <li><span className="num">IV</span><span>How it's made</span></li>
            <li><span className="num">V</span><span>The pressroom</span></li>
            <li><span className="num">VI</span><span>Colophon</span></li>
          </ul>
          <p style={{ marginTop: 22 }}>
            Read time — twelve minutes.<br />
            Best with mint tea and<br />
            an empty afternoon.
          </p>
        </aside>

        <div>
          <p className="manifesto-body">
            <span className="dropcap">T</span>
            unisia has been printing for centuries — on cotton, on tile,
            on paper pulled from olive press cake. What it has never had,
            until now, is a place where the <em>designer in Sfax</em> meets the{' '}
            <em>printer in Tunis</em> meets the <em>customer in Sousse</em>{' '}
            without an intermediary, an Atlantic crossing, or a foreign
            currency in between.
          </p>

          <p className="manifesto-body" style={{ marginTop: 24 }}>
            <strong>Printymand</strong> is that place. End-to-end, 100% local —
            payments in dinars, delivery in days, royalties paid in the week
            a thing sells. The platform is the connective tissue; the
            craft, the calling, the cut — all belong to the people who make
            them.
          </p>

          <div className="signed">
            <span className="sig">A. Ben Salem</span>
            <span>— Editor, Issue Nº {ISSUE.number}</span>
          </div>
        </div>

        <aside className="side">
          <span className="kicker">By the numbers</span>
          <ul>
            <li><span>Designers</span><span className="num">126</span></li>
            <li><span>Pressrooms</span><span className="num">38</span></li>
            <li><span>Governorates</span><span className="num">9</span></li>
            <li><span>Items printed</span><span className="num">14,200</span></li>
            <li><span>Royalties paid</span><span className="num">208k TND</span></li>
          </ul>
          <p style={{ marginTop: 22 }}>
            Figures as of {ISSUE.date} {ISSUE.season.split(' ')[1]}.
            Updated weekly in the pressroom log.
          </p>
        </aside>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// COVER STORY (featured editorial spread)
// ─────────────────────────────────────────────────────────
function CoverStory({ onAddToCart }) {
  const d = COVER_DESIGN;
  return (
    <section className="cover-story">
      <div className="cover-story-inner">
        <div className="cover-story-image">
          <img src={d.image} alt={d.title} />
          <span className="stamp">★ Editor's pick — Issue 07</span>
        </div>

        <div>
          <div className="kicker" style={{ color: 'var(--pm-clay)' }}>
            II. — The cover story
          </div>

          <h2 className="story-headline">
            Carthage<br />
            <em>Pulse,</em><br />
            re-pressed.
          </h2>

          <p className="story-deck">
            Amira Ben Salem returns to the blues of the medina with a poster
            built for the wall and the body alike. Limited to two hundred
            prints, then re-cut for autumn.
          </p>

          <div className="story-specs">
            <div>
              <div className="label">Designer</div>
              <div className="value">Amira B.</div>
              <div className="label" style={{ marginTop: 4 }}><small style={{ color: 'var(--pm-clay)' }}>{d.designerRank} tier</small></div>
            </div>
            <div>
              <div className="label">From</div>
              <div className="value">{d.price} <small>TND</small></div>
              <div className="label" style={{ marginTop: 4 }}><small>{d.leadTime}-day lead</small></div>
            </div>
            <div>
              <div className="label">Rating</div>
              <div className="value">{d.rating} <small>★</small></div>
              <div className="label" style={{ marginTop: 4 }}><small>{d.sales} sales</small></div>
            </div>
          </div>

          <div className="story-cta">
            <button className="btn btn-clay" onClick={() => onAddToCart(d)}>
              Add to cart <span className="ar">→</span>
            </button>
            <button className="btn btn-ghost">Open the page</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// FEATURED PLATES GRID
// ─────────────────────────────────────────────────────────
function FeaturedPlates({ onAddToCart }) {
  const [cat, setCat] = useState('All works');
  const [sort, setSort] = useState('most-loved');

  const filtered = useMemo(() => {
    let p = cat === 'All works' ? [...PLATES] : PLATES.filter(x => x.category === cat);
    if (sort === 'most-loved') p.sort((a,b) => b.rating - a.rating);
    else if (sort === 'newest') p.sort((a,b) => b.id - a.id);
    else if (sort === 'price-low') p.sort((a,b) => a.price - b.price);
    return p;
  }, [cat, sort]);

  return (
    <section id="works" className="page spread">
      <span className="folio left">Plates — 008</span>

      <div className="section-head">
        <span className="section-no">III.</span>
        <hr className="line" />
        <span className="title">Featured plates · this volume</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'end', marginBottom: 8 }}>
        <h2 className="display" style={{ fontSize: 'clamp(40px, 6vw, 96px)', margin: 0 }}>
          Eight works,<br />
          <em style={{ fontFamily: 'var(--pm-font-serif)', color: 'var(--pm-clay)', fontWeight: 500 }}>one season,</em><br />
          one country.
        </h2>
        <p className="serif-italic" style={{ fontSize: 18, color: 'var(--pm-text-muted)', maxWidth: '28ch', textAlign: 'right', margin: 0 }}>
          The shortlist — selected by the editors from 240 submissions, printed in five governorates.
        </p>
      </div>

      <div className="filter-row">
        <span className="label">filed under:</span>
        {CATEGORIES.map(c => (
          <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
        <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="most-loved">sorted by — most loved</option>
          <option value="newest">sorted by — newest</option>
          <option value="price-low">sorted by — price, low first</option>
        </select>
      </div>

      <div className="plate-grid">
        {filtered.map((p, i) => (
          <Plate key={p.id} plate={p} idx={i} onAddToCart={onAddToCart} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: 'span 12', padding: '48px 0', textAlign: 'center' }}>
            <p className="serif-italic" style={{ fontSize: 22, color: 'var(--pm-text-muted)' }}>
              No plates match this filter — try another category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Plate({ plate, idx, onAddToCart }) {
  return (
    <article className={`plate ${plate.variant}`}>
      <a href={`design.html?id=${plate.id}`} style={{ display: 'block' }}>
        <div className="plate-image">
          <img src={`https://picsum.photos/seed/${plate.seed}/900/1100`} alt={plate.title} />
          <span className="plate-no">{plate.no}</span>
          <button className="quick-add" onClick={(e) => { e.preventDefault(); onAddToCart(plate); }}>+ add</button>
        </div>
      </a>
      <div className="plate-caption">
        <a href={`design.html?id=${plate.id}`} className="title" style={{ color: 'inherit' }}>{plate.title}</a>
        <span className="price">{plate.price} TND</span>
        <span className="designer">by {plate.designer}</span>
        <span className="meta">{plate.rating} ★ · {plate.category}</span>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────
// PULL QUOTE
// ─────────────────────────────────────────────────────────
function PullQuote() {
  return (
    <section className="page pullquote">
      <span className="open">"</span>
      <q>
        We were tired of <em>exporting</em> our designs and{' '}
        <em>importing</em> our t-shirts. Printymand was the obvious answer —
        we just had to build it.
      </q>
      <p className="attrib">
        <strong>Karim Dhouib</strong> — designer · founder · printer of last resort, Sfax
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// PROCESS
// ─────────────────────────────────────────────────────────
function Process() {
  const steps = [
    { n: 'I', tag: 'Step 01', title: 'Browse the plates', body: 'Filter by mood, governorate, or designer. Every work is printable on shirts, hoodies, totes, mugs and posters.' },
    { n: 'II', tag: 'Step 02', title: 'Pick a pressroom', body: 'Local printers are ranked by fulfilment rate. Tunis presses ship within 48 hours, with cash on delivery available.' },
    { n: 'III', tag: 'Step 03', title: 'Print & pack', body: 'Your order is queued, pressed, and quality-checked at the shop you chose. We pay the printer on dispatch.' },
    { n: 'IV', tag: 'Step 04', title: 'Wear it. Repeat.', body: 'Delivered in two to four days inside Tunisia. Returns are free for fourteen days, no questions asked.' },
  ];

  return (
    <section id="process" className="page spread">
      <span className="folio left">How it's made — 014</span>

      <div className="section-head">
        <span className="section-no">IV.</span>
        <hr className="line" />
        <span className="title">How a Printymand is made</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 28, alignItems: 'end', marginBottom: 28 }}>
        <h2 className="display" style={{ fontSize: 'clamp(40px, 6vw, 88px)', margin: 0 }}>
          Four steps,<br />
          <em style={{ fontFamily: 'var(--pm-font-serif)', color: 'var(--pm-clay)', fontWeight: 500 }}>twelve hands,</em><br />
          two days.
        </h2>
        <p className="serif-italic" style={{ fontSize: 16, color: 'var(--pm-text-muted)', maxWidth: '26ch', textAlign: 'right' }}>
          A page-by-page diagram of the route a design takes from screen to shop to street.
        </p>
      </div>

      <div className="process">
        {steps.map(s => (
          <div className="step" key={s.n}>
            <span className="step-tag">{s.tag}</span>
            <span className="step-no">{s.n}</span>
            <h4 className="step-title">{s.title}</h4>
            <p className="step-body" dangerouslySetInnerHTML={{ __html: s.body }} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// STAT STRIP
// ─────────────────────────────────────────────────────────
function StatStrip() {
  return (
    <section className="page">
      <div className="stat-strip">
        <div className="stat"><span className="n">2<em>·</em>4d</span><span className="l">Delivery, anywhere in Tunisia</span></div>
        <div className="stat"><span className="n">98<em>%</em></span><span className="l">Pressroom fulfilment rate</span></div>
        <div className="stat"><span className="n">126</span><span className="l">Verified Tunisian designers</span></div>
        <div className="stat"><span className="n">0<em>%</em></span><span className="l">Card fees on cash-on-delivery</span></div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// PRESSROOM DIRECTORY
// ─────────────────────────────────────────────────────────
function Pressroom() {
  return (
    <section id="pressroom" className="page spread">
      <span className="folio left">Pressroom — 018</span>

      <div className="section-head">
        <span className="section-no">V.</span>
        <hr className="line" />
        <span className="title">The pressroom directory</span>
      </div>

      <div className="pressroom-head">
        <h2 className="title">
          Five verified printers,<br />
          <em>nine governorates,</em> one&nbsp;handshake.
        </h2>
        <p className="summary">
          Each shop is audited quarterly by the editors. Premium-tier presses
          guarantee a 48-hour turnaround.
        </p>
      </div>

      <div className="directory">
        <div className="dir-row head">
          <span>№</span>
          <span>Pressroom</span>
          <span>Governorate</span>
          <span className="col-hide">Tier</span>
          <span className="col-hide">Reviews</span>
          <span className="col-hide">Fulfilment</span>
          <span></span>
        </div>
        {PRINTERS.map(p => (
          <div className="dir-row" key={p.id}>
            <span className="idx">{p.idx}</span>
            <div>
              <div className="name">{p.name}</div>
              <small>{p.est} · {p.lead}-day lead · {p.rating} ★</small>
            </div>
            <span className="loc">{p.loc}</span>
            <span className="col-hide">
              <span className={`pill ${p.rank.toLowerCase()}`}>{p.rank}</span>
            </span>
            <span className="col-hide num">{p.reviews}<small>reviews</small></span>
            <span className="col-hide num">{p.fulfillment}<small>%</small></span>
            <span className="arrow">→</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 22, gap: 16, flexWrap: 'wrap' }}>
        <p className="serif-italic" style={{ color: 'var(--pm-text-muted)', fontSize: 15, margin: 0 }}>
          Want your shop in the next issue? <span style={{ color: 'var(--pm-clay)' }}>Applications close 30 June.</span>
        </p>
        <button className="btn">Apply to print → </button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// COLOPHON / FOOTER
// ─────────────────────────────────────────────────────────
function Colophon() {
  return (
    <footer id="colophon" className="colophon">
      <div className="colophon-inner">
        <div className="kicker" style={{ color: 'var(--pm-amber)' }}>
          VI. — Colophon · imprint · masthead
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
            <h4>Sections</h4>
            <ul>
              <li><a href="#works">Plates</a></li>
              <li><a href="#pressroom">Pressrooms</a></li>
              <li><a href="#process">How it's made</a></li>
              <li><a href="#manifesto">Editorial</a></li>
            </ul>
          </div>
          <div className="col-block">
            <h4>For the makers</h4>
            <ul>
              <li><a href="#">Become a designer</a></li>
              <li><a href="#">Open a pressroom</a></li>
              <li><a href="#">Royalty schedule</a></li>
              <li><a href="#">Editorial guidelines</a></li>
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

Object.assign(window, {
  Cover, Manifesto, CoverStory, FeaturedPlates, PullQuote, Process, StatStrip, Pressroom,
});
