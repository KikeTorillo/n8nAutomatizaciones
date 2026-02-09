/**
 * ComoFuncionaSection — 3 pasos: Elige plantilla → Personaliza → Comparte
 */
import { Palette, PenTool, Share2 } from 'lucide-react';
import { memo } from 'react';

const PASOS = [
  {
    icono: Palette,
    titulo: 'Elige una plantilla',
    descripcion: 'Explora decenas de diseños profesionales para bodas, XV años, bautizos, cumpleaños y más.',
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  },
  {
    icono: PenTool,
    titulo: 'Personaliza todo',
    descripcion: 'Cambia colores, fotos, textos, música y más. Nuestro editor visual lo hace super fácil.',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  },
  {
    icono: Share2,
    titulo: 'Comparte y gestiona',
    descripcion: 'Envía por WhatsApp, recibe confirmaciones RSVP y gestiona tu lista de invitados.',
    color: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400',
  },
];

const PasoCard = memo(function PasoCard({ paso, numero }) {
  const Icon = paso.icono;
  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${paso.color} mb-4`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="text-sm font-bold text-pink-500 mb-2">Paso {numero}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{paso.titulo}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{paso.descripcion}</p>
    </div>
  );
});

export default function ComoFuncionaSection() {
  return (
    <section className="py-16 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Crea tu invitación en 3 simples pasos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Sin complicaciones. Sin conocimientos técnicos. Solo elige, personaliza y comparte.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {PASOS.map((paso, i) => (
            <PasoCard key={paso.titulo} paso={paso} numero={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
