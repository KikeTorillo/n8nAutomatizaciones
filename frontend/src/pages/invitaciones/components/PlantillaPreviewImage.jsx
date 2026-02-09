/**
 * PlantillaPreviewImage — Renderiza preview de plantilla con fallback dinámico
 * Si tiene preview_url usa imagen, si no renderiza InvitacionDinamica escalada
 */
import { memo } from 'react';
import { InvitacionDinamica } from '@/components/shared/InvitacionDinamica';
import { usePlantillaPreview } from '@/hooks/otros/eventos-digitales';

const PlantillaPreviewImage = memo(function PlantillaPreviewImage({ plantilla, className = '' }) {
  const { tema, evento, bloques } = usePlantillaPreview(plantilla);

  if (plantilla.preview_url) {
    return (
      <img
        src={plantilla.preview_url}
        alt={plantilla.nombre}
        width={300}
        height={400}
        className={`w-full h-full object-cover ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className="w-full h-full pointer-events-none overflow-hidden">
      <div className="transform scale-[0.22] origin-top-left" style={{ width: '455%' }}>
        <InvitacionDinamica
          evento={evento}
          invitado={null}
          bloques={bloques}
          tema={tema}
          onConfirmRSVP={() => {}}
          isLoadingRSVP={false}
        />
      </div>
    </div>
  );
});

export default PlantillaPreviewImage;
