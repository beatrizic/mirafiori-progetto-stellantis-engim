// ============================================================
//  DATI DELL'ATTIVITÀ "CHE LAVORO FA?"
//  Per modificare ritratti, professioni o numero di quesiti
//  è sufficiente intervenire in questo file.
// ============================================================

// Categoria: uso interno per l'analisi, MAI mostrata agli studenti.
// "m" = professione più spesso associata socialmente agli uomini
// "f" = più spesso associata alle donne
// "n" = percepita come neutrale

export const QUESITI = [
  {
    id: 'q1',
    ritratto: 'img/ritratti/persona-1.jpg',
    alt: 'Ritratto di una persona su sfondo neutro, senza elementi che suggeriscano una professione',
    professioni: [
      { id: 'q1-dev',    label: 'Software developer',   categoria: 'm' },
      { id: 'q1-inf',    label: 'Infermiere/a',          categoria: 'f' },
      { id: 'q1-ing',    label: 'Ingegnere/a',           categoria: 'm' },
      { id: 'q1-edu',    label: 'Educatore/educatrice',  categoria: 'f' },
      { id: 'q1-des',    label: 'Designer',              categoria: 'n' }
    ]
  },
  {
    id: 'q2',
    ritratto: 'img/ritratti/persona-2.jpg',
    alt: 'Ritratto di una persona su sfondo neutro, senza elementi che suggeriscano una professione',
    professioni: [
      { id: 'q2-mec',    label: 'Meccanico/a',           categoria: 'm' },
      { id: 'q2-psi',    label: 'Psicologo/a',           categoria: 'f' },
      { id: 'q2-arc',    label: 'Architetto/a',          categoria: 'n' },
      { id: 'q2-chef',   label: 'Chef',                  categoria: 'n' },
      { id: 'q2-est',    label: 'Estetista',             categoria: 'f' }
    ]
  },
  {
    id: 'q3',
    ritratto: 'img/ritratti/persona-3.jpg',
    alt: 'Ritratto di una persona su sfondo neutro, senza elementi che suggeriscano una professione',
    professioni: [
      { id: 'q3-ceo',    label: 'CEO',                   categoria: 'm' },
      { id: 'q3-mat',    label: 'Insegnante della scuola dell\u2019infanzia', categoria: 'f' },
      { id: 'q3-ric',    label: 'Ricercatore/ricercatrice', categoria: 'n' },
      { id: 'q3-par',    label: 'Parrucchiere/a',        categoria: 'f' },
      { id: 'q3-tec',    label: 'Tecnico informatico',   categoria: 'm' }
    ]
  },
  {
    id: 'q4',
    ritratto: 'img/ritratti/persona-4.jpg',
    alt: 'Ritratto di una persona su sfondo neutro, senza elementi che suggeriscano una professione',
    professioni: [
      { id: 'q4-pil',    label: 'Pilota',                categoria: 'm' },
      { id: 'q4-med',    label: 'Medico/a',              categoria: 'n' },
      { id: 'q4-inf',    label: 'Infermiere/a',          categoria: 'f' },
      { id: 'q4-des',    label: 'Designer',              categoria: 'n' },
      { id: 'q4-edu',    label: 'Educatore/educatrice',  categoria: 'f' }
    ]
  },
  {
    id: 'q5',
    ritratto: 'img/ritratti/persona-5.jpg',
    alt: 'Ritratto di una persona su sfondo neutro, senza elementi che suggeriscano una professione',
    professioni: [
      { id: 'q5-ing',    label: 'Ingegnere/a',           categoria: 'm' },
      { id: 'q5-par',    label: 'Parrucchiere/a',        categoria: 'f' },
      { id: 'q5-chef',   label: 'Chef',                  categoria: 'n' },
      { id: 'q5-psi',    label: 'Psicologo/a',           categoria: 'f' },
      { id: 'q5-mec',    label: 'Meccanico/a',           categoria: 'm' }
    ]
  },
  {
    id: 'q6',
    ritratto: 'img/ritratti/persona-6.jpg',
    alt: 'Ritratto di una persona su sfondo neutro, senza elementi che suggeriscano una professione',
    professioni: [
      { id: 'q6-dev',    label: 'Software developer',    categoria: 'm' },
      { id: 'q6-est',    label: 'Estetista',             categoria: 'f' },
      { id: 'q6-arc',    label: 'Architetto/a',          categoria: 'n' },
      { id: 'q6-ceo',    label: 'CEO',                   categoria: 'm' },
      { id: 'q6-mat',    label: 'Insegnante della scuola dell\u2019infanzia', categoria: 'f' }
    ]
  }
];

// Profilo identico nelle due varianti: cambia solo il nome.
export const PROFILO_RETRIBUZIONE = {
  A: { nome: 'Alessandro' },
  B: { nome: 'Alessandra' },
  comune: [
    '32 anni',
    'Software Developer',
    '7 anni di esperienza',
    'JavaScript, Python, SQL',
    'Responsabile di piccoli progetti'
  ]
};

export const FASCE_RETRIBUZIONE = [
  { id: 'f1500', label: '1.500 \u20AC',        valore: 1500 },
  { id: 'f1800', label: '1.800 \u20AC',        valore: 1800 },
  { id: 'f2100', label: '2.100 \u20AC',        valore: 2100 },
  { id: 'f2400', label: '2.400 \u20AC',        valore: 2400 },
  { id: 'f2700', label: '2.700 \u20AC',        valore: 2700 },
  { id: 'f3000', label: '3.000 \u20AC o pi\u00F9', valore: 3000 }
];

// Testo mostrato allo studente alla fine (modificabile qui).
export const TESTO_FINALE = [
  'Non conoscevi nessuna di queste persone.',
  'Nessuna immagine conteneva informazioni sul loro lavoro.',
  'Eppure hai fatto delle associazioni.'
];

export const TESTO_FINALE_DOMANDA = [
  'La domanda interessante non \u00E8 se hai indovinato.',
  '\u00C8: da dove arrivano queste associazioni?'
];

// Testo del debrief, mostrato dal docente sul proiettore.
export const TESTO_CONCLUSIONE = [
  'Non vi abbiamo chiesto chi pu\u00F2 fare questi lavori.',
  'Vi abbiamo chiesto chi immaginavate facesse quei lavori.',
  'Le associazioni automatiche possono nascere da famiglia, scuola, media, esperienze e cultura.'
];
