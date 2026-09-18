// ============================================================
//  DATI DELL'ATTIVITÀ "YES, BUT..."
//  Per modificare scenari, immagini o testi intervenire solo qui.
//  Ogni scenario ha esattamente 4 momenti della STESSA esperienza.
//  Nessun momento è "la verità": sono parti diverse della stessa storia.
// ============================================================

export const ACTIVITY_KEY = 'yes-but-social';

export const SCENARI = [
  {
    id: 'vacanza',
    titolo: 'Una giornata in vacanza',
    intro: 'Sei in vacanza. Questi sono quattro momenti della stessa giornata.',
    momenti: [
      { id: 'vac-a', immagine: 'img/social/vacanza-1.jpg', testoBreve: 'Ore 20:11',           alt: 'Tramonto sul mare visto dalla spiaggia' },
      { id: 'vac-b', immagine: 'img/social/vacanza-2.jpg', testoBreve: 'Sveglia: 4:15',       alt: 'Sveglia sul comodino che segna le quattro e un quarto del mattino' },
      { id: 'vac-c', immagine: 'img/social/vacanza-3.jpg', testoBreve: 'Due ore di attesa.',  alt: 'Sala d\u2019attesa con persone sedute e valigie' },
      { id: 'vac-d', immagine: 'img/social/vacanza-4.jpg', testoBreve: 'Fine giornata.',      alt: 'Camera semplice con valigie ancora aperte a fine giornata' }
    ],
    debrief: 'Il tramonto era vero. Ma non raccontava tutta la giornata.'
  },
  {
    id: 'selfie',
    titolo: 'Prima di pubblicare',
    intro: 'Stai per pubblicare una foto. Questi sono quattro scatti della stessa sessione.',
    momenti: [
      { id: 'sel-a', immagine: 'img/social/selfie-1.jpg', testoBreve: 'Questa.',              alt: 'Fotografia riuscita bene, luce uniforme' },
      { id: 'sel-b', immagine: 'img/social/selfie-2.jpg', testoBreve: 'Scatto numero 14.',    alt: 'Tentativo precedente, inquadratura storta' },
      { id: 'sel-c', immagine: 'img/social/selfie-3.jpg', testoBreve: 'Luce diversa.',        alt: 'Stesso scatto con una luce meno favorevole' },
      { id: 'sel-d', immagine: 'img/social/selfie-4.jpg', testoBreve: 'Le altre 23.',         alt: 'Griglia di miniature con molti scatti simili tra cui scegliere' }
    ],
    debrief: 'La foto pubblicata è una scelta tra molti momenti possibili.'
  },
  {
    id: 'festa',
    titolo: 'Serata con gli amici',
    intro: 'Una serata insieme. Quattro momenti, stessa serata.',
    momenti: [
      { id: 'fes-a', immagine: 'img/social/festa-1.jpg', testoBreve: 'Tutti insieme.',        alt: 'Foto di gruppo, persone che sorridono' },
      { id: 'fes-b', immagine: 'img/social/festa-2.jpg', testoBreve: 'Aspettando gli altri.', alt: 'Due persone sedute che aspettano, telefono in mano' },
      { id: 'fes-c', immagine: 'img/social/festa-3.jpg', testoBreve: 'Mezz\u2019ora così.',   alt: 'Momento tranquillo, ognuno per conto proprio' },
      { id: 'fes-d', immagine: 'img/social/festa-4.jpg', testoBreve: 'Piccolo imprevisto.',   alt: 'Un bicchiere rovesciato sul tavolo' }
    ],
    debrief: 'Un\u2019immagine può raccontare un momento, non necessariamente tutta la serata.'
  },
  {
    id: 'scuola',
    titolo: 'Quel voto che hai pubblicato',
    intro: 'Hai preso un bel voto. Ecco come ci sei arrivato.',
    momenti: [
      { id: 'scu-a', immagine: 'img/social/scuola-1.jpg', testoBreve: '9',                    alt: 'Verifica corretta con un nove in rosso' },
      { id: 'scu-b', immagine: 'img/social/scuola-2.jpg', testoBreve: 'Tre pomeriggi.',       alt: 'Scrivania con libri e appunti sparsi' },
      { id: 'scu-c', immagine: 'img/social/scuola-3.jpg', testoBreve: 'La verifica prima.',   alt: 'Verifica precedente con un voto più basso' },
      { id: 'scu-d', immagine: 'img/social/scuola-4.jpg', testoBreve: 'La sera prima.',       alt: 'Appunti e sveglia a tarda ora, la sera prima della verifica' }
    ],
    debrief: 'Il risultato finale non mostra sempre tutto il percorso.'
  },
  {
    id: 'sport',
    titolo: 'Il risultato che si vede',
    intro: 'Un traguardo raggiunto. E quello che c\u2019è stato prima.',
    momenti: [
      { id: 'spo-a', immagine: 'img/social/sport-1.jpg', testoBreve: 'Fatto.',                alt: 'Persona che taglia un traguardo con le braccia alzate' },
      { id: 'spo-b', immagine: 'img/social/sport-2.jpg', testoBreve: 'Sei mesi prima.',       alt: 'Allenamento all\u2019aperto in una giornata qualunque' },
      { id: 'spo-c', immagine: 'img/social/sport-3.jpg', testoBreve: 'Non tutti i giorni vanno.', alt: 'Persona seduta a bordo campo, stanca, che riprende fiato' },
      { id: 'spo-d', immagine: 'img/social/sport-4.jpg', testoBreve: 'Il quarto tentativo.',  alt: 'Quaderno con i tempi registrati, tentativi successivi' }
    ],
    debrief: 'Spesso vediamo il risultato molto più del processo.'
  }
];

export const SCALA = { min: 1, max: 10, etichettaMin: 'per niente positiva', etichettaMax: 'molto positiva' };

export const DOMANDA_PRIMA = 'Guardando solo questo momento, quanto diresti che questa esperienza è stata positiva?';
export const DOMANDA_DOPO  = 'Ora che hai visto tutta la situazione, quanto la valuti?';
export const DOMANDA_SCELTA = 'Puoi pubblicarne solo uno. Quale metteresti nelle Stories?';

export const TESTO_FINALE = [
  'Quello che hai scelto di pubblicare non era falso.',
  'Era una parte della storia.',
  'E quasi tutti facciamo la stessa cosa.'
];

export const DOMANDA_RIFLESSIONE = 'Dopo questa attività, pensi che guarderai le Stories degli altri nello stesso modo?';
export const OPZIONI_RIFLESSIONE = [
  { id: 'si',    label: 'S\u00EC' },
  { id: 'forse', label: 'Forse' },
  { id: 'no',    label: 'No' }
];
