// Printymand — Issue Nº 07 main app
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C74A2B",
  "edition": "spring",
  "showTicker": true,
  "density": "editorial"
}/*EDITMODE-END*/;

const ACCENTS = {
  "#C74A2B": { name: 'Clay', deep: '#A33920' },     // original
  "#1B3A5C": { name: 'Indigo', deep: '#0F2540' },   // medina blue
  "#6B7A4E": { name: 'Olive', deep: '#4D5A36' },    // tea
  "#7A2E1F": { name: 'Brick', deep: '#5C2014' },    // deeper terra
};

function App() {
  const [cart, setCart] = useState([]);
  const [cartBump, setCartBump] = useState(false);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState('light');
  const tweaks = useTweaks ? useTweaks(TWEAK_DEFAULTS) : null;
  const tweakState = tweaks ? tweaks[0] : TWEAK_DEFAULTS;

  // Apply accent override
  useEffect(() => {
    const accent = tweakState.accent || '#C74A2B';
    const deep = (ACCENTS[accent] && ACCENTS[accent].deep) || '#A33920';
    document.documentElement.style.setProperty('--pm-clay', accent);
    document.documentElement.style.setProperty('--pm-clay-deep', deep);
  }, [tweakState.accent]);

  // Theme on root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Density
  useEffect(() => {
    if (tweakState.density === 'condensed') {
      document.documentElement.style.setProperty('--pm-page-max', '1280px');
    } else if (tweakState.density === 'wide') {
      document.documentElement.style.setProperty('--pm-page-max', '1640px');
    } else {
      document.documentElement.style.setProperty('--pm-page-max', '1480px');
    }
  }, [tweakState.density]);

  // Ticker visibility
  useEffect(() => {
    document.documentElement.classList.toggle('no-ticker', tweakState.showTicker === false);
  }, [tweakState.showTicker]);

  const handleAddToCart = (item) => {
    setCart(c => [...c, item]);
    setCartBump(true);
    setToast(`Added — ${item.title} · ${item.price} TND`);
    setTimeout(() => setCartBump(false), 360);
    setTimeout(() => setToast(null), 2400);
  };

  return (
    <div>
      <PageMasthead
        cartCount={cart.length}
        cartBump={cartBump}
        currentPage="home"
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      />

      <Cover onAddToCart={handleAddToCart} />
      <hr className="rule-strong" style={{ maxWidth: 1480, margin: '0 auto' }} />

      <Manifesto />
      <CoverStory onAddToCart={handleAddToCart} />

      <FeaturedPlates onAddToCart={handleAddToCart} />
      <StatStrip />

      <PullQuote />

      <Process />
      <Pressroom />

      <PageColophon />

      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        <span className="dot"></span>
        <span>{toast || 'Added to cart'}</span>
      </div>

      {/* Tweaks */}
      {tweaks && (
        <TweaksPanel title="Tweaks">
          <TweakSection label="Accent" />
          <TweakColor
            label="Brand accent"
            value={tweakState.accent}
            onChange={v => tweaks[1]('accent', v)}
            options={Object.keys(ACCENTS)}
          />
          <TweakSection label="Layout" />
          <TweakRadio
            label="Page density"
            value={tweakState.density}
            onChange={v => tweaks[1]('density', v)}
            options={['condensed', 'editorial', 'wide']}
          />
          <TweakToggle
            label="News ticker"
            value={tweakState.showTicker !== false}
            onChange={v => tweaks[1]('showTicker', v)}
          />
          <TweakSection label="Edition" />
          <TweakRadio
            label="Theme"
            value={theme}
            onChange={v => setTheme(v)}
            options={['light', 'dark']}
          />
        </TweaksPanel>
      )}
    </div>
  );
}

// React to ticker toggle (post-mount, via DOM toggle to keep code simple)
function TickerVisibilityWatcher() {
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
