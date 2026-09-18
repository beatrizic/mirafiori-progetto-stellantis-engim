// ============================================================
//  LOGICA CONDIVISA DELLE ATTIVITÀ INTERATTIVE
//  Funzioni pure, nessuna dipendenza dal DOM o da Supabase.
//  Usata da: stereotipi (Che lavoro fa?), social (Yes, but...)
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

/** Percentuali per ogni opzione. Ritorna sempre tutte le opzioni, anche a zero. */
export function aggregaRisposte(opzioni, risposte, chiave = 'opzione_id') {
  const totale = risposte.length;
  return opzioni.map((o) => {
    const n = risposte.filter((r) => r[chiave] === o.id).length;
    return {
      id: o.id,
      label: o.label,
      categoria: o.categoria,
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

/** Valore più frequente. A parità vince il primo incontrato. */
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
    medianaValore: mediana(valori),
    fasciaPiuScelta: fasce.find((f) => f.id === idModa)?.label ?? null
  };
}

// ---------- funzioni specifiche dell'attività "Yes, but..." ----------

/** Media aritmetica arrotondata a un decimale. Null su lista vuota. */
export function media(valori) {
  if (!valori.length) return null;
  const somma = valori.reduce((a, b) => a + b, 0);
  return Math.round((somma / valori.length) * 10) / 10;
}

/**
 * Distribuzione dei voti su scala 1-10.
 * Ritorna sempre 10 posizioni, anche quelle a zero.
 */
export function distribuzioneVoti(valori) {
  const conteggi = Array.from({ length: 10 }, (_, i) => ({
    voto: i + 1,
    conteggio: valori.filter((v) => v === i + 1).length
  }));
  const max = Math.max(1, ...conteggi.map((c) => c.conteggio));
  return conteggi.map((c) => ({ ...c, altezzaRelativa: Math.round((c.conteggio / max) * 100) }));
}

/**
 * Confronto prima/dopo per uno scenario.
 * Il delta è calcolato solo su chi ha dato entrambe le valutazioni.
 */
export function confrontaPrimaDopo(risposte, scenarioId) {
  const perScenario = risposte.filter((r) => r.scenario_id === scenarioId);
  const prima = perScenario.filter((r) => r.tipo === 'rating_before');
  const dopo = perScenario.filter((r) => r.tipo === 'rating_after');

  const valoriPrima = prima.map((r) => Number(r.valore)).filter(Number.isFinite);
  const valoriDopo = dopo.map((r) => Number(r.valore)).filter(Number.isFinite);

  const mediaPrima = media(valoriPrima);
  const mediaDopo = media(valoriDopo);

  return {
    nPrima: valoriPrima.length,
    nDopo: valoriDopo.length,
    mediaPrima,
    mediaDopo,
    delta: (mediaPrima === null || mediaDopo === null)
      ? null
      : Math.round((mediaDopo - mediaPrima) * 10) / 10,
    distribuzionePrima: distribuzioneVoti(valoriPrima),
    distribuzioneDopo: distribuzioneVoti(valoriDopo)
  };
}

/**
 * Quanti partecipanti hanno abbassato, mantenuto o alzato la valutazione.
 * Conta solo chi ha entrambe le risposte per lo stesso scenario.
 */
export function cambioPercezione(risposte, scenarioId = null) {
  const filtrate = scenarioId ? risposte.filter((r) => r.scenario_id === scenarioId) : risposte;
  const coppie = new Map();

  filtrate.forEach((r) => {
    if (r.tipo !== 'rating_before' && r.tipo !== 'rating_after') return;
    const chiave = r.partecipante_id + '|' + r.scenario_id;
    if (!coppie.has(chiave)) coppie.set(chiave, {});
    coppie.get(chiave)[r.tipo] = Number(r.valore);
  });

  let diminuita = 0, invariata = 0, aumentata = 0, totale = 0;
  coppie.forEach((c) => {
    if (!Number.isFinite(c.rating_before) || !Number.isFinite(c.rating_after)) return;
    totale++;
    const d = c.rating_after - c.rating_before;
    if (d < 0) diminuita++; else if (d > 0) aumentata++; else invariata++;
  });

  const pct = (n) => (totale === 0 ? 0 : Math.round((n / totale) * 100));
  return {
    totale,
    diminuita, invariata, aumentata,
    pctDiminuita: pct(diminuita), pctInvariata: pct(invariata), pctAumentata: pct(aumentata)
  };
}

/** Percentuali di scelta dei momenti di uno scenario. */
export function aggregaMomenti(momenti, risposte, scenarioId) {
  const scelte = risposte.filter((r) => r.tipo === 'selected_moment' && r.scenario_id === scenarioId);
  const totale = scelte.length;
  return momenti.map((m) => {
    const n = scelte.filter((s) => s.valore === m.id).length;
    return {
      id: m.id,
      testo: m.testoBreve,
      immagine: m.immagine,
      alt: m.alt,
      conteggio: n,
      percentuale: totale === 0 ? 0 : Math.round((n / totale) * 100)
    };
  });
}
