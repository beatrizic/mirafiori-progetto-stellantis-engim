// ============================================================
//  LOGICA CONDIVISA DELL'ATTIVITÀ
//  Funzioni pure, testabili in isolamento.
// ============================================================

/** Mescola un array senza modificare l'originale (Fisher-Yates). */
export function mescola(array, rnd = Math.random) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Identificativo anonimo: nessun dato personale, nessun fingerprinting. */
export function generaAnonymousId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'anon-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/** Codice sessione leggibile ad alta voce: niente 0/O/1/I/L. */
export function generaCodiceSessione(rnd = Math.random) {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let codice = '';
  for (let i = 0; i < 6; i++) codice += alfabeto[Math.floor(rnd() * alfabeto.length)];
  return codice;
}

/** Assegnazione bilanciata alla variante A o B. */
export function assegnaVariante(rnd = Math.random) {
  return rnd() < 0.5 ? 'A' : 'B';
}

/**
 * Percentuali per ogni opzione di un quesito.
 * Ritorna sempre tutte le opzioni, anche quelle a zero.
 */
export function aggregaRisposte(professioni, risposte) {
  const totale = risposte.length;
  return professioni.map((p) => {
    const n = risposte.filter((r) => r.opzione_id === p.id).length;
    return {
      id: p.id,
      label: p.label,
      categoria: p.categoria,
      conteggio: n,
      percentuale: totale === 0 ? 0 : Math.round((n / totale) * 100)
    };
  }).sort((a, b) => b.conteggio - a.conteggio);
}

/** Mediana di una lista di numeri. Ritorna null su lista vuota. */
export function mediana(valori) {
  if (!valori.length) return null;
  const ordinati = [...valori].sort((a, b) => a - b);
  const meta = Math.floor(ordinati.length / 2);
  return ordinati.length % 2 !== 0
    ? ordinati[meta]
    : (ordinati[meta - 1] + ordinati[meta]) / 2;
}

/** Fascia più scelta. A parità vince la prima incontrata. */
export function moda(valori) {
  if (!valori.length) return null;
  const conta = new Map();
  valori.forEach((v) => conta.set(v, (conta.get(v) || 0) + 1));
  let migliore = null, max = -1;
  conta.forEach((n, v) => { if (n > max) { max = n; migliore = v; } });
  return migliore;
}

/** Distribuzione delle fasce di retribuzione per una variante. */
export function aggregaRetribuzione(fasce, risposte) {
  const totale = risposte.length;
  const distribuzione = fasce.map((f) => {
    const n = risposte.filter((r) => r.fascia === f.id).length;
    return {
      id: f.id,
      label: f.label,
      conteggio: n,
      percentuale: totale === 0 ? 0 : Math.round((n / totale) * 100)
    };
  });
  const valori = risposte
    .map((r) => fasce.find((f) => f.id === r.fascia)?.valore)
    .filter((v) => typeof v === 'number');

  const idModa = moda(risposte.map((r) => r.fascia));
  return {
    totale,
    distribuzione,
    // La fascia "3.000 € o più" è aperta: la mediana è indicativa, non una media reale.
    medianaValore: mediana(valori),
    fasciaPiuScelta: fasce.find((f) => f.id === idModa)?.label ?? null
  };
}
