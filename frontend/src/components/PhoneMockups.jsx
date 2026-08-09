import PhoneCarousel from './PhoneCarousel';
import '../phone-carousel.css';

const u = (id, w = 640) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Prendas de muestra. Reemplazables por items reales de /api/items.
export const PRENDAS_DEMO = [
  {
    src: u('1441986300917-64674bd600d8'),
    alt: 'Vidriera de ropa vintage',
    caption: '↔ Intercambio',
  },
  {
    src: u('1445205170230-053b83016050'),
    alt: 'Perchero con camperas oversize',
    caption: '$ 18.000',
  },
  {
    src: u('1490481651871-ab68de25d43d'),
    alt: 'Vestido vintage sobre fondo claro',
    caption: '↔ Intercambio',
  },
  {
    src: u('1479064555552-3ef4979f8908'),
    alt: 'Jean baggy y remera estilo y2k',
    caption: '$ 12.500',
  },
];

export default function PhoneMockups({ images = PRENDAS_DEMO, ...props }) {
  return <PhoneCarousel images={images} {...props} />;
}
