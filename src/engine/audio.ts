// Petits sons (WebAudio) et lecture à voix haute (voix française, suisse si disponible).

let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean) { muted = m }
export function isMuted() { return muted }

export function tone(freqs: number[], dur = 0.12) {
  if (muted) return
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = ctx || new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain(), t = ctx!.currentTime + i * dur
      o.type = 'triangle'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.6)
      o.connect(g).connect(ctx!.destination)
      o.start(t)
      o.stop(t + dur * 2)
    })
  } catch { /* son indisponible */ }
}

/** Petit « frrt » de grattage : un souffle de bruit filtré très court. */
function scratchNoise() {
  if (muted) return
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = ctx || new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    const len = Math.floor(ctx.sampleRate * 0.05)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 2400 + Math.random() * 1600; f.Q.value = 0.8
    g.gain.value = 0.12
    src.connect(f).connect(g).connect(ctx.destination)
    src.start()
  } catch { /* son indisponible */ }
}

export const sounds = {
  scratch: scratchNoise,
  good: () => tone([660, 880, 1100], 0.1),
  bad: () => tone([300, 220], 0.12),
  tick: (i: number) => tone([520 + i * 40], 0.08),
  fanfare: () => tone([523, 659, 784, 1047], 0.14),
}

let voice: SpeechSynthesisVoice | null = null
function pickVoice() {
  try {
    const v = speechSynthesis.getVoices()
    voice = v.find(x => x.lang === 'fr-CH') || v.find(x => x.lang === 'fr-FR') || v.find(x => x.lang?.startsWith('fr')) || null
  } catch { /* pas de synthèse vocale */ }
}
try {
  pickVoice()
  speechSynthesis.addEventListener('voiceschanged', pickVoice)
} catch { /* ignore */ }

export function say(text: string) {
  if (muted) return
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = voice?.lang || 'fr-CH'
    if (voice) u.voice = voice
    u.rate = 0.9
    speechSynthesis.speak(u)
  } catch { /* ignore */ }
}
