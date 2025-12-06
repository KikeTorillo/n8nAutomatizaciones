/**
 * SeparadorPublico - Renderiza bloque separador/espaciador en sitio público
 */
export default function SeparadorPublico({ contenido }) {
  const {
    altura = 'mediano', // pequeno, mediano, grande
    mostrarLinea = false,
    colorFondo = 'transparente', // transparente, claro, oscuro
    estiloLinea = 'solido', // solido, punteado, gradiente
  } = contenido;

  const alturaClases = {
    pequeno: 'py-4',
    mediano: 'py-8',
    grande: 'py-16',
  };

  const fondoClases = {
    transparente: 'bg-transparent',
    claro: 'bg-gray-50',
    oscuro: 'bg-gray-900',
  };

  const lineaEstilos = {
    solido: 'border-gray-300',
    punteado: 'border-gray-300 border-dashed',
    gradiente: '',
  };

  return (
    <div className={`${alturaClases[altura] || alturaClases.mediano} ${fondoClases[colorFondo] || fondoClases.transparente}`}>
      {mostrarLinea && (
        <div className="max-w-7xl mx-auto px-4">
          {estiloLinea === 'gradiente' ? (
            <div
              className="h-px"
              style={{
                background: `linear-gradient(90deg, transparent, var(--color-primario), transparent)`,
              }}
            />
          ) : (
            <hr className={`border-t ${lineaEstilos[estiloLinea] || lineaEstilos.solido}`} />
          )}
        </div>
      )}
    </div>
  );
}
