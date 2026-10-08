import { useEffect, useRef } from 'react';

/**
 * Para ventanas que se abren encima (pago, foto ampliada): mientras están abiertas, el botón "atrás"
 * del teléfono (o el gesto de regresar) las cierra en lugar de salir de la pantalla de abajo.
 * Al abrirse se agrega una entrada al historial con la misma profundidad de la pantalla de abajo;
 * al cerrarse con su propio botón esa entrada se quita.
 */
export function useBackClose(open: boolean, close: () => void): void {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;
    let closedByBack = false;
    const depth = (window.history.state as { depth?: number } | null)?.depth ?? 1;
    try {
      window.history.pushState({ depth, overlay: true }, '');
    } catch {
      return;
    }
    const onPop = () => {
      closedByBack = true;
      closeRef.current();
    };
    window.addEventListener('popstate', onPop, { once: true });
    return () => {
      window.removeEventListener('popstate', onPop);
      // Se cerró con su botón: se quita la entrada que se había agregado
      if (!closedByBack && (window.history.state as { overlay?: boolean } | null)?.overlay) window.history.back();
    };
  }, [open]);
}
