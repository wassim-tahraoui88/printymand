// Login — "Press credentials" — split spread

const { useState } = React;

const DEMO_ACCOUNTS = [
  { label: 'Amira Ben Salem', role: 'Designer · Elite tier',  email: 'amira@printymand.tn',  password: 'demo1234' },
  { label: 'Karim Dhouib',    role: 'Customer',                 email: 'karim@printymand.tn',  password: 'demo1234' },
  { label: 'PrintPro Tunisia',role: 'Printer · Tunis',         email: 'printpro@printymand.tn', password: 'demo1234' },
  { label: 'Editor',          role: 'Admin · Editorial desk',  email: 'editor@printymand.tn', password: 'demo1234' },
];

function LoginApp() {
  const [tab, setTab] = useState(window.location.hash === '#register' ? 'register' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setMsg('Signed in. Redirecting to your desk…');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
    }, 800);
  };

  const useDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div>
      <PageMasthead currentPage="login" />

      <PageBread
        no="XXII."
        dept="Press credentials · sign in or join"
        title={<><em>Sign</em> in,<br/>or join the&nbsp;press.</>}
        deck="Four roles, one platform — customer, designer, printer, admin. Pick a demo account to see the right dashboard."
      />

      <section className="page">
        <div className="login-spread">
          {/* LEFT - brand panel */}
          <div className="login-left">
            <div className="brand">P</div>
            <div className="kicker" style={{ color: 'var(--pm-amber)', fontSize: 11, marginBottom: 18 }}>
              Issue Nº {ISSUE.number} — {ISSUE.season}
            </div>
            <h2>
              Tunisia's first<br />
              end-to-end<br />
              <em>print press,</em><br />
              for everyone.
            </h2>
            <p className="deck">
              Sign in to manage orders, upload designs, run a pressroom, or sit on the editorial desk. Role-aware routing sends you straight to the right workspace.
            </p>

            <div className="specs">
              <div className="spec">
                <div className="l">Designers</div>
                <div className="v">126</div>
              </div>
              <div className="spec">
                <div className="l">Pressrooms</div>
                <div className="v">38</div>
              </div>
              <div className="spec">
                <div className="l">Orders</div>
                <div className="v">14.2k</div>
              </div>
            </div>
          </div>

          {/* RIGHT - form */}
          <div className="login-right">
            <h3>{tab === 'signin' ? 'Sign in' : 'Create your account'}</h3>
            <p className="sub">
              {tab === 'signin'
                ? 'Use a demo account below — or your own credentials.'
                : 'Free to join. Sign in once, pick your role on the next screen.'}
            </p>

            <div className="tab-row">
              <button className={`tab-btn ${tab === 'signin' ? 'active' : ''}`} onClick={() => setTab('signin')}>Sign in</button>
              <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
            </div>

            <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
              {tab === 'register' && (
                <label>
                  <div className="field-label">Full name</div>
                  <input className="pm-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                </label>
              )}
              <label>
                <div className="field-label">Email address</div>
                <input className="pm-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.tn" />
              </label>
              <label>
                <div className="field-label">Password</div>
                <input className="pm-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </label>

              {tab === 'register' && (
                <div>
                  <div className="field-label">I'm joining as a</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['customer','designer','printer'].map(r => (
                      <button type="button" key={r} className={`chip ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>{r}</button>
                    ))}
                  </div>
                </div>
              )}

              {msg && (
                <div style={{ background: 'var(--pm-paper)', border: '1px solid var(--pm-clay)', padding: '10px 14px', fontFamily: 'var(--pm-font-serif)', fontStyle: 'italic', fontSize: 14 }}>
                  {msg}
                </div>
              )}

              <button type="submit" className="btn btn-clay" style={{ justifyContent: 'center', padding: '16px' }} disabled={busy}>
                {busy ? 'Working…' : (tab === 'signin' ? 'Sign in' : 'Create account')} <span className="ar">→</span>
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0 14px' }}>
              <hr className="rule" style={{ flex: 1 }} />
              <span style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--pm-text-muted)' }}>Demo accounts</span>
              <hr className="rule" style={{ flex: 1 }} />
            </div>

            <div className="demo-list">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} className="demo-btn" type="button" onClick={() => useDemo(acc)}>
                  <div>
                    <div className="demo-label">{acc.label}</div>
                    <div className="demo-role">{acc.role}</div>
                  </div>
                  <span className="demo-email">{acc.email}</span>
                </button>
              ))}
            </div>

            <p style={{ marginTop: 22, fontFamily: 'var(--pm-font-serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--pm-text-muted)' }}>
              {tab === 'signin' ? (
                <>No account yet? <a onClick={() => setTab('register')} style={{ color: 'var(--pm-clay)', cursor: 'pointer', fontWeight: 600 }}>Create one free →</a></>
              ) : (
                <>Already have one? <a onClick={() => setTab('signin')} style={{ color: 'var(--pm-clay)', cursor: 'pointer', fontWeight: 600 }}>Sign in →</a></>
              )}
            </p>
          </div>
        </div>
      </section>

      <PageColophon />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LoginApp />);
