/**
 * ====================================================================
 * HOOKS DE BROADCAST PARA PANTALLA DEL CLIENTE
 * ====================================================================
 *
 * Hooks para comunicación bidireccional entre POS y pantalla del cliente
 * usando BroadcastChannel API (mismo origen, sin servidor).
 *
 * Tipos de mensaje:
 * - CART_UPDATE: Actualización del carrito
 * - PAYMENT_START: Inicio de proceso de pago
 * - PAYMENT_COMPLETE: Pago completado
 * - CLEAR: Limpiar pantalla
 * - IDLE: Estado de espera
 * - CUSTOMER_READY: Pantalla cliente lista
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const CHANNEL_NAME = 'nexo-pos-display';

// Tipos de mensajes
export const POS_MESSAGE_TYPES = {
  CART_UPDATE: 'CART_UPDATE',
  PAYMENT_START: 'PAYMENT_START',
  PAYMENT_COMPLETE: 'PAYMENT_COMPLETE',
  CLEAR: 'CLEAR',
  IDLE: 'IDLE',
  CUSTOMER_READY: 'CUSTOMER_READY',
  PING: 'PING',
  PONG: 'PONG',
};

/**
 * Hook para el lado emisor (POS principal)
 * Envía actualizaciones a la pantalla del cliente
 * @param {Object} options
 * @param {Object} options.organizacion - Datos de la organización (nombre, logo)
 */
export function usePOSBroadcaster(options = {}) {
  const channelRef = useRef(null);
  const [isDisplayConnected, setIsDisplayConnected] = useState(false);
  const lastPingRef = useRef(null);

  // Inicializar canal
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel no soportado en este navegador');
      return;
    }

    channelRef.current = new BroadcastChannel(CHANNEL_NAME);

    // Escuchar mensajes de la pantalla cliente
    channelRef.current.onmessage = (event) => {
      const { type, timestamp } = event.data;

      if (type === POS_MESSAGE_TYPES.CUSTOMER_READY || type === POS_MESSAGE_TYPES.PONG) {
        setIsDisplayConnected(true);
        lastPingRef.current = Date.now();
      }
    };

    // Enviar ping inicial
    channelRef.current.postMessage({
      type: POS_MESSAGE_TYPES.PING,
      timestamp: Date.now(),
      organizacion: options.organizacion,
    });

    // Verificar conexión periódicamente
    const pingInterval = setInterval(() => {
      if (lastPingRef.current && Date.now() - lastPingRef.current > 5000) {
        setIsDisplayConnected(false);
      }
      channelRef.current?.postMessage({
        type: POS_MESSAGE_TYPES.PING,
        timestamp: Date.now(),
      });
    }, 3000);

    return () => {
      clearInterval(pingInterval);
      channelRef.current?.close();
    };
  }, [options.organizacion?.id]);

  // Enviar mensaje genérico
  const sendMessage = useCallback((type, data = {}) => {
    if (!channelRef.current) return;

    channelRef.current.postMessage({
      type,
      timestamp: Date.now(),
      organizacion: options.organizacion,
      ...data,
    });
  }, [options.organizacion]);

  // Actualizar carrito
  const broadcastCartUpdate = useCallback((cartData) => {
    sendMessage(POS_MESSAGE_TYPES.CART_UPDATE, { cart: cartData });
  }, [sendMessage]);

  // Iniciar pago
  const broadcastPaymentStart = useCallback((paymentData) => {
    sendMessage(POS_MESSAGE_TYPES.PAYMENT_START, { payment: paymentData });
  }, [sendMessage]);

  // Pago completado
  const broadcastPaymentComplete = useCallback((result) => {
    sendMessage(POS_MESSAGE_TYPES.PAYMENT_COMPLETE, { result });
  }, [sendMessage]);

  // Limpiar pantalla
  const broadcastClear = useCallback(() => {
    sendMessage(POS_MESSAGE_TYPES.CLEAR);
  }, [sendMessage]);

  // Ir a estado idle
  const broadcastIdle = useCallback((message) => {
    sendMessage(POS_MESSAGE_TYPES.IDLE, { message });
  }, [sendMessage]);

  return {
    isDisplayConnected,
    broadcastCartUpdate,
    broadcastPaymentStart,
    broadcastPaymentComplete,
    broadcastClear,
    broadcastIdle,
  };
}

/**
 * Hook para el lado receptor (Pantalla del cliente)
 * Recibe actualizaciones del POS
 * @param {Function} onMessage - Callback para cada mensaje recibido
 * @returns {Object} Estado y funciones del receptor
 */
export function usePOSReceiver(onMessage) {
  const channelRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [organizacion, setOrganizacion] = useState(null);

  // Estado actual de la pantalla
  const [displayState, setDisplayState] = useState({
    type: 'idle',
    cart: null,
    payment: null,
    result: null,
    message: null,
  });

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel no soportado en este navegador');
      return;
    }

    channelRef.current = new BroadcastChannel(CHANNEL_NAME);

    channelRef.current.onmessage = (event) => {
      const { type, timestamp, ...data } = event.data;

      // Actualizar organización si viene
      if (data.organizacion) {
        setOrganizacion(data.organizacion);
      }

      // Responder a pings
      if (type === POS_MESSAGE_TYPES.PING) {
        channelRef.current?.postMessage({
          type: POS_MESSAGE_TYPES.PONG,
          timestamp: Date.now(),
        });
        setIsConnected(true);
        return;
      }

      setLastMessage({ type, timestamp, ...data });

      // Actualizar estado según tipo de mensaje
      switch (type) {
        case POS_MESSAGE_TYPES.CART_UPDATE:
          setDisplayState({
            type: 'cart',
            cart: data.cart,
            payment: null,
            result: null,
            message: null,
          });
          break;

        case POS_MESSAGE_TYPES.PAYMENT_START:
          setDisplayState((prev) => ({
            ...prev,
            type: 'payment',
            payment: data.payment,
          }));
          break;

        case POS_MESSAGE_TYPES.PAYMENT_COMPLETE:
          setDisplayState({
            type: 'complete',
            cart: null,
            payment: null,
            result: data.result,
            message: null,
          });
          break;

        case POS_MESSAGE_TYPES.CLEAR:
          setDisplayState({
            type: 'idle',
            cart: null,
            payment: null,
            result: null,
            message: null,
          });
          break;

        case POS_MESSAGE_TYPES.IDLE:
          setDisplayState({
            type: 'idle',
            cart: null,
            payment: null,
            result: null,
            message: data.message,
          });
          break;
      }

      // Callback externo
      onMessage?.({ type, timestamp, ...data });
    };

    // Anunciar que estamos listos
    channelRef.current.postMessage({
      type: POS_MESSAGE_TYPES.CUSTOMER_READY,
      timestamp: Date.now(),
    });

    return () => {
      channelRef.current?.close();
    };
  }, [onMessage]);

  // Enviar mensaje al POS (comunicación bidireccional)
  const sendToPOS = useCallback((type, data = {}) => {
    if (!channelRef.current) return;

    channelRef.current.postMessage({
      type,
      timestamp: Date.now(),
      ...data,
    });
  }, []);

  return {
    isConnected,
    displayState,
    lastMessage,
    organizacion,
    sendToPOS,
  };
}

/**
 * Hook simplificado para integrar en VentaPOSPage
 * Maneja automáticamente el broadcast del carrito
 * @param {Object} cartData - Datos del carrito actual
 * @param {Object} options - Opciones de configuración
 */
export function usePOSDisplaySync(cartData, options = {}) {
  const broadcaster = usePOSBroadcaster(options);
  const lastCartRef = useRef(null);

  // Sincronizar carrito automáticamente cuando cambia
  useEffect(() => {
    if (!cartData) {
      if (lastCartRef.current !== null) {
        broadcaster.broadcastClear();
        lastCartRef.current = null;
      }
      return;
    }

    // Evitar enviar el mismo carrito
    const cartJSON = JSON.stringify(cartData);
    if (cartJSON === lastCartRef.current) return;

    lastCartRef.current = cartJSON;
    broadcaster.broadcastCartUpdate(cartData);
  }, [cartData, broadcaster]);

  return {
    isDisplayConnected: broadcaster.isDisplayConnected,
    broadcastPaymentStart: broadcaster.broadcastPaymentStart,
    broadcastPaymentComplete: broadcaster.broadcastPaymentComplete,
    broadcastClear: broadcaster.broadcastClear,
  };
}
