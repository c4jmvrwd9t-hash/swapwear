import { useId } from 'react';

/* ============================================================
   SwapWear · Icon set (línea, estilo Lucide/Tabler)
   24x24, stroke = currentColor. Reemplaza los emojis de UI.
   Uso: <Icon.Heart /> · tamaño con prop size, color con CSS.
   ============================================================ */
function S({ children, size = 24, fill = 'none', stroke = true, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke ? 'currentColor' : 'none'}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Heart: (p) => <S {...p}><path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5C2 13 12 21 12 21s4.5-3.6 7-7Z" /></S>,
  X: (p) => <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>,
  // Flecha de deshacer: círculo casi cerrado con punta de flecha arriba a la
  // izquierda, apuntando hacia AFUERA. La versión anterior usaba un corchete
  // en L cuya pata horizontal entraba al círculo y a 22px se leía como un
  // palito cruzándolo. strokeWidth 2.4 porque el 1.9 del set queda muy fino.
  Undo: (p) => (
    <S strokeWidth="2.4" {...p}>
      <path d="M4.6 10.2A8 8 0 1 1 4.3 13.6" />
      <path d="M8.6 9.4 4.4 10.3 3.5 6.1" />
    </S>
  ),
  Lock: (p) => <S {...p}><rect x="4" y="10.5" width="16" height="10" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></S>,
  Star: (p) => <S {...p}><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.1l1-5.8L3.5 9.2l5.9-.9L12 3Z" /></S>,
  Inbox: (p) => <S {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z" /></S>,
  Chat: (p) => <S {...p}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-4.8A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" /></S>,
  Chats: (p) => <S {...p}><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z" /><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" /></S>,
  Grid: (p) => <S {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></S>,
  Plus: (p) => <S {...p}><path d="M12 5v14M5 12h14" /></S>,
  Compass: (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></S>,
  User: (p) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></S>,
  Store: (p) => <S {...p}><path d="M3 9 4.5 4.5A2 2 0 0 1 6.4 3h11.2a2 2 0 0 1 1.9 1.5L21 9" /><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></S>,
  Edit: (p) => <S {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></S>,
  Sparkles: (p) => <S {...p}><path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3L12 3Z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" /></S>,
  Logout: (p) => <S {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></S>,
  Filter: (p) => <S {...p}><path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z" /></S>,
  Eye: (p) => <S {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></S>,
  EyeOff: (p) => <S {...p}><path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M6.1 6.1A18.5 18.5 0 0 0 1 12s4 8 11 8a9.1 9.1 0 0 0 5.9-2.1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="M1 1l22 22" /></S>,
  ArrowLeft: (p) => <S {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></S>,
  Send: (p) => <S {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></S>,
  Check: (p) => <S {...p}><path d="M20 6 9 17l-5-5" /></S>,
  Search: (p) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></S>,
  Swap: (p) => <S {...p}><path d="M7 4 3 8l4 4" /><path d="M3 8h13a4 4 0 0 1 0 8h-1" /><path d="m17 20 4-4-4-4" /><path d="M21 16H8a4 4 0 0 1 0-8h1" /></S>,
  Tag: (p) => <S {...p}><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" /></S>,
  Camera: (p) => <S {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2Z" /><circle cx="12" cy="13" r="4" /></S>,
  Gift: (p) => <S {...p}><path d="M20 12v9H4v-9" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" /></S>,
};

/* Íconos de tipo de prenda (para Mis Prendas y filtros) */
export const GarmentIcon = {
  remera: (p) => <S {...p}><path d="M4 7 8 4l1.5 2a3 3 0 0 0 5 0L16 4l4 3-2.5 3-1.5-1v11H8V9L6.5 10 4 7Z" /></S>,
  buzo: (p) => <S {...p}><path d="M5 8 8 4l1.6 1.8a3.2 3.2 0 0 0 4.8 0L16 4l3 4-2 2.5V20H7v-9.5L5 8Z" /><path d="M10 4v3M14 4v3" /></S>,
  camisa: (p) => <S {...p}><path d="M4 7 8 4l4 3 4-3 4 3-2 2.5V20H6V9.5L4 7Z" /><path d="M12 7v13" /></S>,
  musculosa: (p) => <S {...p}><path d="M8 4 7 9l-2-1 1 12h12l1-12-2 1-1-5a4 4 0 0 1-8 0Z" /></S>,
  jean: (p) => <S {...p}><path d="M5 3h14l-1 18h-5l-1-9-1 9H5L4 3" /><path d="M5 3h14" /></S>,
  pantalon: (p) => <S {...p}><path d="M6 3h12l-1 18h-4l-1-11-1 11H7L6 3Z" /></S>,
  short: (p) => <S {...p}><path d="M5 4h14l-.6 11h-4.4l-1-6-1 6H5.6L5 4Z" /></S>,
  vestido: (p) => <S {...p}><path d="M9 3h6l-1 4 4 14H6l4-14-1-4Z" /><path d="M9 3a3 3 0 0 0 6 0" /></S>,
  falda: (p) => <S {...p}><path d="M7 4h10l1 5-7 11-7-11 3-5Z" /><path d="M7 4h10" /></S>,
  campera: (p) => <S {...p}><path d="M5 8 8 4v16H6V11l-1-3Z" /><path d="M19 8 16 4v16h2V11l1-3Z" /><path d="M8 4h8l-4 4-4-4Z" /><path d="M12 8v12" /></S>,
  abrigo: (p) => <S {...p}><path d="M6 8 9 4v16H7V10l-1-2Z" /><path d="M18 8 15 4v16h2V10l1-2Z" /><path d="M9 4h6v16" /><path d="M12 4v16" /></S>,
  blazer: (p) => <S {...p}><path d="M6 8 9 4l3 4 3-4 3 4-1.5 2.5V20h-3l-1.5-6-1.5 6h-3V10.5L6 8Z" /><path d="M9 4v4" /></S>,
};

/* Marca SwapWear · loop de "swap" (infinito) + gancho de percha.
   variant: undefined = mark con degradado sobre transparente (header)
            'icon'    = cuadrado redondeado con degradado + mark blanco (app icon)
            'mono'    = mark en un solo color (currentColor) */
const MARK_LOOP = 'M32 40C26 30 12 30 12 40C12 50 26 50 32 40C38 30 52 30 52 40C52 50 38 50 32 40Z';
const MARK_HANGER = 'M32 41V23C32 16.5 24.5 16 26.5 22.5';

export function Logo({ size = 30, variant }) {
  const gid = useId();
  if (variant === 'mono') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <path d={MARK_LOOP} stroke="currentColor" strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={MARK_HANGER} stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gid} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2A3F63" /><stop offset="1" stopColor="#1B2A4A" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${gid})`} />
        <path d={MARK_LOOP} stroke="#fff" strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={MARK_HANGER} stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".95" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="10" y1="40" x2="54" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3A567F" /><stop offset="1" stopColor="#1B2A4A" />
        </linearGradient>
      </defs>
      <path d={MARK_LOOP} stroke={`url(#${gid})`} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={MARK_HANGER} stroke="#16223C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
