/**
 * Lectura en voz alta con la Web Speech API. Solo está disponible si el navegador tiene una voz
 * para el idioma del contenido; si no, `disponible` es falso y la interfaz esconde el botón.
 */
export function crearVoz(idioma: string | undefined) {
  const soportado =
    typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  const base = idioma?.split('-')[0]?.toLowerCase();

  let disponible = $state(false);
  let hablando = $state(false);

  function revisarVoces() {
    if (!soportado || !base) return;
    disponible = speechSynthesis.getVoices().some((voz) => voz.lang.toLowerCase().startsWith(base));
  }

  if (soportado && base) {
    revisarVoces();
    // Muchos navegadores cargan las voces de forma asíncrona.
    speechSynthesis.addEventListener('voiceschanged', revisarVoces);
  }

  return {
    get disponible() {
      return disponible;
    },
    get hablando() {
      return hablando;
    },
    hablar(texto: string) {
      if (!disponible || !idioma) return;
      speechSynthesis.cancel();
      const emision = new SpeechSynthesisUtterance(texto);
      emision.lang = idioma;
      emision.onend = emision.onerror = () => (hablando = false);
      hablando = true;
      speechSynthesis.speak(emision);
    },
    detener() {
      if (!soportado) return;
      speechSynthesis.cancel();
      hablando = false;
    },
    destruir() {
      if (soportado) {
        speechSynthesis.removeEventListener('voiceschanged', revisarVoces);
        speechSynthesis.cancel();
      }
    },
  };
}
