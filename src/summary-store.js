import { summarizeThread, getModel } from "./claude-client";

/*
 * DEV-12: store de resúmenes del hilo, compartido por la opción A
 * (MessageListHeaders) y la opción C (Composer:Footer).
 *
 * - Caché por threadId persistida en localStorage: sobrevive reinicios y se
 *   comparte entre ventanas de Mailspring (todas comparten origen). Cada
 *   resumen cuesta dinero de API; un hilo que no cambió da el mismo resumen,
 *   así que se reutiliza en lugar de regenerar.
 * - Meta guardada: modelo, fecha y número de mensajes al generar (para la
 *   invalidación "N mensajes nuevos" de DEV-16).
 * - LRU: se conservan como máximo MAX_ENTRIES hilos.
 * - Dedupe: si ya hay una petición en vuelo para un hilo, se reutiliza (evita
 *   cobrar dos veces cuando A y C están visibles a la vez).
 * - Sincronización entre ventanas vía el evento 'storage' + suscriptores
 *   locales para que ambos componentes se refresquen al instante.
 */

const STORAGE_KEY = "mailspring-claude-assistant.summaries";
const COLLAPSE_KEY = "mailspring-claude-assistant.summaryCollapsed";
const MAX_ENTRIES = 100;

class SummaryStore {
  constructor() {
    this._listeners = [];
    this._inflight = {}; // threadId -> Promise
    // Cambios hechos por OTRA ventana llegan por 'storage'; refrescamos a los
    // suscriptores locales (el evento no dispara en la ventana que escribió).
    if (typeof window !== "undefined") {
      window.addEventListener("storage", e => {
        if (e.key === STORAGE_KEY) this._notify();
      });
    }
  }

  _readAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  _writeAll(map) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (err) {
      // Sin persistencia (p. ej. cuota llena): seguimos solo en memoria de
      // la petición actual; no es fatal.
    }
  }

  // Devuelve { text, model, generatedAt, messageCount } o null.
  get(threadId) {
    if (!threadId) return null;
    return this._readAll()[threadId] || null;
  }

  isGenerating(threadId) {
    return !!this._inflight[threadId];
  }

  // ¿El resumen guardado quedó desactualizado respecto al hilo actual?
  // (llegaron mensajes nuevos desde que se generó).
  newMessagesSince(threadId, currentCount) {
    const entry = this.get(threadId);
    if (!entry || typeof currentCount !== "number") return 0;
    return Math.max(0, currentCount - entry.messageCount);
  }

  _set(threadId, entry) {
    const map = this._readAll();
    map[threadId] = entry;
    // LRU por fecha de generación: si excede el tope, quita los más viejos.
    const ids = Object.keys(map);
    if (ids.length > MAX_ENTRIES) {
      ids
        .sort((a, b) => map[a].generatedAt - map[b].generatedAt)
        .slice(0, ids.length - MAX_ENTRIES)
        .forEach(id => delete map[id]);
    }
    this._writeAll(map);
  }

  /*
   * Genera (o regenera) el resumen de un hilo y lo cachea.
   * threadData: { text, messageCount }. Se pasa ya extraído porque el origen
   * difiere entre A (hilo enfocado) y C (carga por threadId).
   * Devuelve una promesa con la entrada { text, model, generatedAt, messageCount }.
   */
  generate(threadId, threadData) {
    if (!threadId) {
      return Promise.reject(new Error("No hay hilo para resumir."));
    }
    if (this._inflight[threadId]) {
      return this._inflight[threadId];
    }
    const model = getModel("summary"); // el modelo realmente usado, para la meta
    this._notify(); // para que la UI muestre "Generando…" de inmediato
    const promise = summarizeThread(threadData.text)
      .then(text => {
        const entry = {
          text,
          model,
          generatedAt: Date.now(),
          messageCount: threadData.messageCount || 0,
        };
        this._set(threadId, entry);
        delete this._inflight[threadId];
        this._notify();
        return entry;
      })
      .catch(err => {
        delete this._inflight[threadId];
        this._notify();
        throw err;
      });
    this._inflight[threadId] = promise;
    return promise;
  }

  // Estado colapsado (global, recordado entre reaperturas).
  getCollapsed() {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  }

  setCollapsed(value) {
    localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
    this._notify();
  }

  // Suscripción de los componentes A y C. Devuelve la función para desuscribir.
  listen(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }

  _notify() {
    this._listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        // Un suscriptor que falle no debe tumbar a los demás.
      }
    });
  }
}

// Singleton compartido por todos los componentes del plugin en esta ventana.
export default new SummaryStore();
