// ============================================================
//  DATI DELL'ATTIVITÀ "YES, BUT..."
//  Per modificare scenari, immagini o testi intervenire solo qui.
//  Ogni scenario: 1 immagine YES (la più condivisibile)
//                 3 immagini BUT (contesto e retroscena).
//  Il BUT non è "la realtà brutta": è la realtà più completa.
// ============================================================

export const ACTIVITY_KEY = 'yes-but-social';

export const SCENARI = [
  {
    id: 'vacanza',
    titolo: 'Una giornata in vacanza',
    intro: 'Una foto che potresti trovare nelle Stories di qualcuno.',
    yes: {
      id: 'vac-yes',
      immagine: 'img/social/vacation_01_yes.webp',
      testoBreve: 'Ore 20:11',
      alt: 'Ragazza seduta sulla spiaggia di spalle mentre guarda il sole tramontare sul mare'
    },
    but: [
      { id: 'vac-b1', immagine: 'img/social/vacation_02_but_early.webp',  testoBreve: 'Sveglia: 4:15',        alt: 'La stessa ragazza seduta sul letto, stanca, con zaino e valigia accanto' },
      { id: 'vac-b2', immagine: 'img/social/vacation_03_but_waiting.webp', testoBreve: 'Due ore di attesa.',  alt: 'La stessa ragazza seduta in aeroporto con i bagagli, in attesa' },
      { id: 'vac-b3', immagine: 'img/social/vacation_04_but_endday.webp',  testoBreve: 'Fine giornata.',      alt: 'La stessa ragazza che sistema i vestiti nella valigia aperta sul letto, a fine giornata' }
    ],
    debrief: 'Il tramonto era vero. Ma non raccontava tutta la giornata.'
  },
  {
    id: 'selfie',
    titolo: 'Prima di pubblicare',
    intro: 'La foto che viene pubblicata, e quella che c\u2019è intorno.',
    yes: {
      id: 'sel-yes',
      immagine: 'img/social/selfie_01_yes.webp',
      testoBreve: 'Questa.',
      alt: 'Ragazzo con felpa verde che si fotografa allo specchio, inquadratura riuscita'
    },
    but: [
      { id: 'sel-b1', immagine: 'img/social/selfie_02_but_attempt.webp',   testoBreve: 'Scatto numero 14.', alt: 'Lo stesso ragazzo in un tentativo precedente, con il telefono che copre parte del viso' },
      { id: 'sel-b2', immagine: 'img/social/selfie_03_but_lighting.webp',  testoBreve: 'Cercando la luce.', alt: 'Lo stesso ragazzo che scosta la tenda della finestra per cambiare la luce' },
      { id: 'sel-b3', immagine: 'img/social/selfie_04_but_selection.webp', testoBreve: 'Quale pubblico?',   alt: 'Lo stesso ragazzo seduto sul letto mentre guarda il telefono e sceglie la foto' }
    ],
    debrief: 'La foto finale è reale, ma dietro c\u2019è sempre una scelta.'
  },
  {
    id: 'festa',
    titolo: 'Serata con gli amici',
    intro: 'Una serata insieme, raccontata da una foto sola.',
    yes: {
      id: 'fes-yes',
      immagine: 'img/social/party_01_yes.webp',
      testoBreve: 'Tutti insieme.',
      alt: 'Selfie di gruppo di cinque ragazzi che sorridono, palloncini e lucine sullo sfondo'
    },
    but: [
      { id: 'fes-b1', immagine: 'img/social/party_02_but_waiting.webp',     testoBreve: 'Aspettando gli altri.', alt: 'Lo stesso gruppo seduto sul divano, alcuni al telefono, in attesa' },
      { id: 'fes-b2', immagine: 'img/social/party_03_but_preparation.webp', testoBreve: 'I preparativi.',        alt: 'Lo stesso gruppo che appende i palloncini e prepara il tavolo con il cibo' },
      { id: 'fes-b3', immagine: 'img/social/party_04_but_unexpected.webp',  testoBreve: 'Piccolo imprevisto.',   alt: 'Lo stesso gruppo che raccoglie da terra una ciotola rovesciata' }
    ],
    debrief: 'Un momento bello non racconta per forza tutta la serata.'
  },
  {
    id: 'scuola',
    titolo: 'Quel voto che hai pubblicato',
    intro: 'Un risultato che vale la pena mostrare.',
    yes: {
      id: 'scu-yes',
      immagine: 'img/social/school_01_yes.webp',
      testoBreve: '10',
      alt: 'Ragazza sorridente che mostra una verifica con un dieci cerchiato in rosso'
    },
    but: [
      { id: 'scu-b1', immagine: 'img/social/school_02_but_study.webp',      testoBreve: 'Tre pomeriggi.',            alt: 'La stessa ragazza che studia alla scrivania tra libri e appunti' },
      { id: 'scu-b2', immagine: 'img/social/school_03_but_errors.webp',     testoBreve: 'I tentativi prima.',        alt: 'Quaderno con esercizi cancellati e fogli appallottolati sul tavolo' },
      { id: 'scu-b3', immagine: 'img/social/school_04_but_beforetest.webp', testoBreve: 'Poco prima della verifica.', alt: 'La stessa ragazza seduta al banco in classe, pensierosa, prima della verifica' }
    ],
    debrief: 'Il risultato finale è visibile. Il percorso molto meno.'
  },
  {
    id: 'sport',
    titolo: 'Il risultato che si vede',
    intro: 'Il momento che finisce nel post.',
    yes: {
      id: 'spo-yes',
      immagine: 'img/social/sport_01_yes.webp',
      testoBreve: 'Entrato.',
      alt: 'Ragazzo che tira a canestro su un campo all\u2019aperto, pallone in aria'
    },
    but: [
      { id: 'spo-b1', immagine: 'img/social/sport_02_but_attempt.webp',  testoBreve: 'Il quarto tentativo.',  alt: 'Lo stesso ragazzo che guarda il pallone rimbalzare sul ferro del canestro' },
      { id: 'spo-b2', immagine: 'img/social/sport_03_but_break.webp',    testoBreve: 'La pausa.',             alt: 'Lo stesso ragazzo seduto su una panchina a bordo campo con una bottiglia d\u2019acqua' },
      { id: 'spo-b3', immagine: 'img/social/sport_04_but_training.webp', testoBreve: 'Sei mesi prima.',       alt: 'Lo stesso ragazzo che palleggia durante un allenamento sul campo' }
    ],
    debrief: 'Sui social vediamo spesso il risultato, non tutti i tentativi.'
  }
];

export const SCALA = { min: 1, max: 10, etichettaMin: 'per niente positiva', etichettaMax: 'molto positiva' };

export const TESTO_YES = 'Questa è la foto che potresti vedere in una Story o in un post.';
export const TESTO_TRANSIZIONE = 'Ora vedi anche il resto della situazione.';
export const DOMANDA_PRIMA = 'Guardando solo questa immagine, quanto ti sembra positiva questa esperienza?';
export const DOMANDA_DOPO  = 'Ora che hai visto anche il contesto, quanto valuti questa esperienza?';

export const TESTO_FINALE = [
  'La foto che vedi sui social può essere vera.',
  'Ma spesso non è tutta la storia.',
  'E quasi tutti, quando pubblichiamo, scegliamo una parte della realtà.'
];

export const DOMANDA_RIFLESSIONE = 'Dopo questa attività, pensi che guarderai i social nello stesso modo?';
export const OPZIONI_RIFLESSIONE = [
  { id: 'si',    label: 'S\u00EC' },
  { id: 'forse', label: 'Forse' },
  { id: 'no',    label: 'No' }
];
