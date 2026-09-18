// Client Supabase condiviso — nessun dato personale: solo sessione anonima + risposta scelta.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://gowpislyrywfdkdqqnjc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-6YJMiAnjeQMFH6jrcZfnA_jqsZO-Wa';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Flag anonimo di dispositivo, solo per evitare invii doppi dello stesso quiz.
export function giaCompletato(chiave) {
  return !!localStorage.getItem(chiave);
}
export function segnaCompletato(chiave) {
  localStorage.setItem(chiave, '1');
}
