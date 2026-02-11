import { renderHook, act } from '@testing-library/react';
import { useToast } from '../../hooks/useToast';

describe('useToast', () => {
  // Limpiar toasts entre tests ya que el store es global (Zustand)
  afterEach(() => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.clear();
    });
  });

  it('starts with an empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast via toast() and returns an id', () => {
    const { result } = renderHook(() => useToast());
    let id: string;

    act(() => {
      id = result.current.toast('Mensaje de prueba');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      id: id!,
      message: 'Mensaje de prueba',
      type: 'info',
      duration: 5000,
    });
  });

  it('adds a toast with custom type and duration via options', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast('Custom toast', { type: 'warning', duration: 3000 });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Custom toast',
      type: 'warning',
      duration: 3000,
    });
  });

  it('removes a toast by id', () => {
    const { result } = renderHook(() => useToast());
    let id: string;

    act(() => {
      id = result.current.toast('To be removed');
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.remove(id!);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('clears all toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast('First');
      result.current.toast('Second');
      result.current.toast('Third');
    });
    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.clear();
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  describe('shorthand methods', () => {
    it('success() creates a toast with type "success"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Operacion exitosa');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        message: 'Operacion exitosa',
        type: 'success',
        duration: 5000,
      });
    });

    it('error() creates a toast with type "error"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Algo fallo');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        message: 'Algo fallo',
        type: 'error',
        duration: 5000,
      });
    });

    it('warning() creates a toast with type "warning"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Cuidado');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        message: 'Cuidado',
        type: 'warning',
        duration: 5000,
      });
    });

    it('info() creates a toast with type "info"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Informacion');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        message: 'Informacion',
        type: 'info',
        duration: 5000,
      });
    });
  });

  describe('toast.* shorthand methods', () => {
    it('toast.success() creates a success toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast.success('Via toast.success');
      });

      expect(result.current.toasts[0]).toMatchObject({
        message: 'Via toast.success',
        type: 'success',
      });
    });

    it('toast.error() creates an error toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast.error('Via toast.error');
      });

      expect(result.current.toasts[0]).toMatchObject({
        message: 'Via toast.error',
        type: 'error',
      });
    });

    it('toast.warning() creates a warning toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast.warning('Via toast.warning');
      });

      expect(result.current.toasts[0]).toMatchObject({
        message: 'Via toast.warning',
        type: 'warning',
      });
    });

    it('toast.info() creates an info toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast.info('Via toast.info');
      });

      expect(result.current.toasts[0]).toMatchObject({
        message: 'Via toast.info',
        type: 'info',
      });
    });
  });

  it('shorthand methods accept custom duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Custom duration', { duration: 10000 });
    });

    expect(result.current.toasts[0].duration).toBe(10000);
  });

  it('generates unique ids for each toast', () => {
    const { result } = renderHook(() => useToast());
    let id1: string;
    let id2: string;

    act(() => {
      id1 = result.current.toast('First');
      id2 = result.current.toast('Second');
    });

    expect(id1!).not.toBe(id2!);
  });

  it('only removes the targeted toast, leaving others intact', () => {
    const { result } = renderHook(() => useToast());
    let id1: string;
    let id2: string;

    act(() => {
      id1 = result.current.toast('Keep this');
      id2 = result.current.toast('Remove this');
    });
    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.remove(id2!);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(id1!);
    expect(result.current.toasts[0].message).toBe('Keep this');
  });

  it('defaults type to "info" when no type specified', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast('Default type');
    });

    expect(result.current.toasts[0].type).toBe('info');
  });

  it('defaults duration to 5000ms', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast('Default duration');
    });

    expect(result.current.toasts[0].duration).toBe(5000);
  });
});
