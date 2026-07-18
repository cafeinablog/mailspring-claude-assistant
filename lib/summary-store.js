"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const claude_client_1 = require("./claude-client");
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
                if (e.key === STORAGE_KEY)
                    this._notify();
            });
        }
    }
    _readAll() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        }
        catch (err) {
            return {};
        }
    }
    _writeAll(map) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
        }
        catch (err) {
            // Sin persistencia (p. ej. cuota llena): seguimos solo en memoria de
            // la petición actual; no es fatal.
        }
    }
    // Devuelve { text, model, generatedAt, messageCount } o null.
    get(threadId) {
        if (!threadId)
            return null;
        return this._readAll()[threadId] || null;
    }
    isGenerating(threadId) {
        return !!this._inflight[threadId];
    }
    // ¿El resumen guardado quedó desactualizado respecto al hilo actual?
    // (llegaron mensajes nuevos desde que se generó).
    newMessagesSince(threadId, currentCount) {
        const entry = this.get(threadId);
        if (!entry || typeof currentCount !== "number")
            return 0;
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
        this._notify(); // para que la UI muestre "Generando…" de inmediato
        const promise = claude_client_1.summarizeThread(threadData.text)
            .then(text => {
            const entry = {
                text,
                model: (threadData && threadData.model) || null,
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
            }
            catch (err) {
                // Un suscriptor que falle no debe tumbar a los demás.
            }
        });
    }
}
// Singleton compartido por todos los componentes del plugin en esta ventana.
exports.default = new SummaryStore();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VtbWFyeS1zdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zdW1tYXJ5LXN0b3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbURBQWtEO0FBRWxEOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUVILE1BQU0sV0FBVyxHQUFHLHVDQUF1QyxDQUFDO0FBQzVELE1BQU0sWUFBWSxHQUFHLDhDQUE4QyxDQUFDO0FBQ3BFLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQztBQUV4QixNQUFNLFlBQVk7SUFDaEI7UUFDRSxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDLHNCQUFzQjtRQUMzQywwRUFBMEU7UUFDMUUsMEVBQTBFO1FBQzFFLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO1lBQ2pDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JDLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxXQUFXO29CQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QyxDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztJQUVELFFBQVE7UUFDTixJQUFJO1lBQ0YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDNUQ7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sRUFBRSxDQUFDO1NBQ1g7SUFDSCxDQUFDO0lBRUQsU0FBUyxDQUFDLEdBQUc7UUFDWCxJQUFJO1lBQ0YsWUFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3hEO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixxRUFBcUU7WUFDckUsbUNBQW1DO1NBQ3BDO0lB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