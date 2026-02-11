import {
  createErrorHandler,
  createCRUDErrorHandler,
  getErrorMessage,
  combineErrorMessages,
  COMMON_ERROR_MESSAGES,
  ErrorHandlers,
} from '../errorHandlerFactory';

describe('createErrorHandler', () => {
  it('lanza con mensaje del backend si existe', () => {
    const handler = createErrorHandler();
    const error = Object.assign(new Error('generic'), {
      response: { status: 400, data: { message: 'Campo requerido' } },
    });

    expect(() => handler(error)).toThrow('Campo requerido');
  });

  it('lanza con mensaje según código HTTP', () => {
    const handler = createErrorHandler({ 409: 'Ya existe' });
    const error = Object.assign(new Error('generic'), {
      response: { status: 409, data: {} },
    });

    expect(() => handler(error)).toThrow('Ya existe');
  });

  it('lanza con mensaje por defecto si no hay coincidencia', () => {
    const handler = createErrorHandler({}, 'Algo salió mal');
    const error = new Error('no response');

    expect(() => handler(error)).toThrow('Algo salió mal');
  });

  it('prioriza mensaje del backend sobre código HTTP', () => {
    const handler = createErrorHandler({ 400: 'Bad Request' });
    const error = Object.assign(new Error('generic'), {
      response: { status: 400, data: { message: 'Nombre es obligatorio' } },
    });

    expect(() => handler(error)).toThrow('Nombre es obligatorio');
  });
});

describe('createCRUDErrorHandler', () => {
  it('genera mensaje contextual para create', () => {
    const handler = createCRUDErrorHandler('create', 'Producto');
    const error = Object.assign(new Error(), {
      response: { status: 500, data: {} },
    });

    expect(() => handler(error)).toThrow('Error del servidor');
  });

  it('genera mensaje contextual para delete', () => {
    const handler = createCRUDErrorHandler('delete', 'Servicio');
    const error = Object.assign(new Error(), {
      response: { status: 404, data: {} },
    });

    expect(() => handler(error)).toThrow('Servicio no encontrado');
  });

  it('usa mensajes custom sobre los default', () => {
    const handler = createCRUDErrorHandler('create', 'Producto', {
      409: 'SKU duplicado',
    });
    const error = Object.assign(new Error(), {
      response: { status: 409, data: {} },
    });

    expect(() => handler(error)).toThrow('SKU duplicado');
  });

  it('genera fallback con nombre de operación y entidad', () => {
    const handler = createCRUDErrorHandler('update', 'Cliente');
    const error = new Error();

    expect(() => handler(error)).toThrow('Error al actualizar cliente');
  });

  it('maneja operación fetch', () => {
    const handler = createCRUDErrorHandler('fetch', 'Datos');
    const error = new Error();

    expect(() => handler(error)).toThrow('Error al obtener datos');
  });

  it('genera mensaje para error 403', () => {
    const handler = createCRUDErrorHandler('delete', 'Usuario');
    const error = Object.assign(new Error(), {
      response: { status: 403, data: {} },
    });

    expect(() => handler(error)).toThrow(
      'No tienes permisos para eliminar usuario'
    );
  });
});

describe('getErrorMessage', () => {
  it('extrae mensaje de Error instance', () => {
    expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
  });

  it('extrae mensaje de string', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('extrae mensaje de API error', () => {
    const error = { response: { data: { message: 'API Error' } } };
    expect(getErrorMessage(error)).toBe('API Error');
  });

  it('retorna fallback para errores desconocidos', () => {
    expect(getErrorMessage(null)).toBe('Ocurrió un error');
    expect(getErrorMessage(undefined)).toBe('Ocurrió un error');
    expect(getErrorMessage(42)).toBe('Ocurrió un error');
  });

  it('acepta fallback personalizado', () => {
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });
});

describe('combineErrorMessages', () => {
  it('combina múltiples grupos de mensajes', () => {
    const result = combineErrorMessages(
      { 404: 'Not found' },
      { 409: 'Conflict' },
      { 500: 'Server error' }
    );

    expect(result).toEqual({
      404: 'Not found',
      409: 'Conflict',
      500: 'Server error',
    });
  });

  it('sobrescribe duplicados con el último valor', () => {
    const result = combineErrorMessages(
      { 400: 'Bad request' },
      { 400: 'Datos inválidos' }
    );

    expect(result).toEqual({ 400: 'Datos inválidos' });
  });
});

describe('COMMON_ERROR_MESSAGES', () => {
  it('contiene presets estándar', () => {
    expect(COMMON_ERROR_MESSAGES.NOT_FOUND[404]).toBe('Recurso no encontrado');
    expect(COMMON_ERROR_MESSAGES.FORBIDDEN[403]).toBe(
      'No tienes permisos para esta acción'
    );
    expect(COMMON_ERROR_MESSAGES.CONFLICT[409]).toBe(
      'Ya existe un registro con esos datos'
    );
    expect(COMMON_ERROR_MESSAGES.BAD_REQUEST[400]).toBe('Datos inválidos');
    expect(COMMON_ERROR_MESSAGES.SERVER_ERROR[500]).toBe('Error del servidor');
  });
});

describe('ErrorHandlers presets', () => {
  it('crear devuelve handler funcional', () => {
    const handler = ErrorHandlers.crear('Producto');
    expect(handler).toBeTypeOf('function');
  });

  it('actualizar devuelve handler funcional', () => {
    const handler = ErrorHandlers.actualizar('Servicio');
    expect(handler).toBeTypeOf('function');
  });

  it('eliminar devuelve handler funcional', () => {
    const handler = ErrorHandlers.eliminar('Cita');
    expect(handler).toBeTypeOf('function');
  });

  it('obtener devuelve handler funcional', () => {
    const handler = ErrorHandlers.obtener('Cliente');
    expect(handler).toBeTypeOf('function');
  });
});
