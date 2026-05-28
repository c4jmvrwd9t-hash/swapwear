const PLANS = [
  {
    tier:    'basic',
    name:    'Básico',
    price:   1,
    color:   '#6366f1',
    badge:   '✦',
    perks:   ['100 swaps por día', '10 prendas publicadas', 'Sin anuncios'],
    cta:     'Suscribirse por $1 / mes',
  },
  {
    tier:    'pro',
    name:    'Pro',
    price:   5,
    color:   'var(--red)',
    badge:   '⚡',
    perks:   ['Swaps ilimitados', 'Prendas ilimitadas', 'Sin anuncios', 'Aparecés primero en el feed', 'Badge Pro en tu perfil'],
    cta:     'Suscribirse por $5 / mes',
    highlight: true,
  },
];

export default function SubscriptionPage({ user, onClose }) {
  const currentTier = user?.tier || null;

  const handleSelect = (tier) => {
    // TODO: integrar Mercado Pago — por ahora placeholder
    alert(`Integración con Mercado Pago próximamente.\nPlan: ${tier}`);
  };

  return (
    <div className="sub-overlay" onClick={onClose}>
      <div className="sub-sheet" onClick={e => e.stopPropagation()}>
        <button className="sub-close" onClick={onClose}>✕</button>

        <p className="sub-eyebrow">SwapWear</p>
        <h2 className="sub-title">Elegí tu plan</h2>

        <div className="sub-plans">
          {PLANS.map(plan => {
            const active = currentTier === plan.tier;
            return (
              <div
                key={plan.tier}
                className={`sub-plan-card ${plan.highlight ? 'highlighted' : ''} ${active ? 'active' : ''}`}
                style={{ '--plan-color': plan.color }}
              >
                {plan.highlight && <div className="sub-plan-ribbon">Más popular</div>}
                <div className="sub-plan-header">
                  <span className="sub-plan-badge">{plan.badge}</span>
                  <span className="sub-plan-name">{plan.name}</span>
                  {active && <span className="sub-plan-current">Tu plan</span>}
                </div>
                <div className="sub-plan-price">
                  <span className="sub-plan-amount">${plan.price}</span>
                  <span className="sub-plan-period">USD / mes</span>
                </div>
                <ul className="sub-plan-perks">
                  {plan.perks.map(p => (
                    <li key={p}><span className="sub-check">✓</span>{p}</li>
                  ))}
                </ul>
                <button
                  className="sub-plan-btn"
                  onClick={() => handleSelect(plan.tier)}
                  disabled={active}
                >
                  {active ? 'Plan activo' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="sub-divider" />
        <p className="sub-free-label">Plan gratuito incluye:</p>
        <ul className="sub-free-list">
          <li>{user?.promo ? '40' : '35'} swaps por día{user?.promo ? ' (miembro fundador 🎁)' : ''}</li>
          <li>Hasta 5 prendas publicadas</li>
        </ul>
      </div>
    </div>
  );
}
