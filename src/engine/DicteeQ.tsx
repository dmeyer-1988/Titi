import { useEffect, useRef, useState } from 'react'
import type { QProps } from './EntoureQ'
import { diffLetters, findIn, norm, silentEnd, speech, tips, type DicteeEntry, type DicteeQuestion } from './dictee'
import { say, sounds } from './audio'
import { Slate, type SlateHandle } from './Slate'

const Speaker = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
)

/** Le mot écrit avec le son [in] en bleu et la lettre muette de la fin en orange. */
export function Highlight({ text }: { text: string }) {
  const words = text.split(' ')
  const end = silentEnd(text)
  return (
    <>
      {words.map((w, wi) => {
        const s = findIn(w.replace(/[.!?]+$/, ''))
        const isLast = wi === words.length - 1
        const core = w.replace(/[.!?]+$/, ''), punct = w.slice(core.length)
        const mute = isLast && end ? end.length : 0
        const parts: { t: string; c?: string }[] = []
        for (let i = 0; i < core.length; i++) {
          let c: string | undefined
          if (s && i >= s.start && i < s.start + s.g.length) c = 'hl-son'
          if (mute && i >= core.length - mute) c = 'hl-fin'
          const last = parts[parts.length - 1]
          if (last && last.c === c) last.t += core[i]
          else parts.push({ t: core[i], c })
        }
        return (
          <span key={wi} className="dw">
            {parts.map((p, k) => p.c ? <b key={k} className={p.c}>{p.t}</b> : <span key={k}>{p.t}</span>)}
            {punct}{wi < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </>
  )
}

const ROWS = ['abcdefghi', 'jklmnopqr', 'stuvwxyz', "éèêàç'-"]

function Keyboard({ onKey, onBack, onOk, okDisabled }: { onKey: (k: string) => void; onBack: () => void; onOk: () => void; okDisabled: boolean }) {
  const [caps, setCaps] = useState(false)
  const key = (k: string) => { onKey(caps ? k.toUpperCase() : k); setCaps(false); sounds.tick(3) }
  return (
    <div className="dkb" role="group" aria-label="Clavier">
      {ROWS.map(r => (
        <div key={r} className="dkb-row">
          {r.split('').map(k => <button key={k} type="button" className="dkb-key" onClick={() => key(k)}>{caps ? k.toUpperCase() : k}</button>)}
        </div>
      ))}
      <div className="dkb-row">
        <button type="button" className={'dkb-key wide' + (caps ? ' on' : '')} onClick={() => setCaps(c => !c)} aria-pressed={caps}>⇧ Maj</button>
        <button type="button" className="dkb-key space" onClick={() => key(' ')}>espace</button>
        <button type="button" className="dkb-key" onClick={() => key('.')}>.</button>
        <button type="button" className="dkb-key wide" onClick={onBack} aria-label="Effacer">⌫</button>
        <button type="button" className="dkb-key ok" onClick={onOk} disabled={okDisabled}>OK</button>
      </div>
    </div>
  )
}

// L'enfant peut passer du clavier à l'ardoise ; on garde son choix pendant la session.
let preferSlate: boolean | null = null

type Phase = 'look' | 'write' | 'compare' | 'fix' | 'done'

/** Écrire le mot (dictée ou regarde-cache-écris), trouver le son, ou choisir la fin du mot. */
export function DicteeQ({ q, list, ardoise, onAttempt, onSolved }: QProps<DicteeQuestion> & { list: DicteeEntry[]; ardoise?: boolean }) {
  const e = q.entry
  const [phase, setPhase] = useState<Phase>(q.mode === 'memo' ? 'look' : 'write')
  const [text, setText] = useState('')
  const [lastWrong, setLastWrong] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [slate, setSlateMode] = useState<boolean>(preferSlate ?? Boolean(ardoise))
  const [hasInk, setHasInk] = useState(false)
  const pad = useRef<SlateHandle>(null)
  const setSlate = (v: boolean) => { preferSlate = v; setSlateMode(v); sounds.tick(4) }

  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(onSolved, 1100)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const check = () => {
    const ok = norm(text) === norm(e.text)
    onAttempt(text.trim(), e.text, ok)
    if (ok) setPhase('done')
    else { setLastWrong(text.trim()); setText(''); setPhase('fix') }
  }

  const choose = (v: string) => {
    if (phase === 'done') return
    const right = q.mode === 'son' ? q.blank : q.mode === 'fin' ? q.ending : ''
    const ok = v === right
    onAttempt(v || 'rien', right || 'rien', ok)
    if (ok) setPhase('done')
    else setPicked(p => [...p, v])
  }

  // Ardoise : l'enfant compare lui-même son écriture avec le modèle.
  const expected = q.mode === 'son' ? q.blank : e.text
  const selfCheck = (ok: boolean) => {
    onAttempt(ok ? 'ardoise : pareil' : 'ardoise : erreur', expected, ok)
    if (ok) setPhase('done')
    else setPhase('fix')
  }
  const rewrite = () => { pad.current?.clear(); setHasInk(false); setPhase('write'); sounds.tick(5) }

  const tipList = tips(e, list)
  const Tips = () => tipList.length > 0 ? <ul className="dtips">{tipList.map(t => <li key={t}>{t}</li>)}</ul> : null

  const toggle = (q.mode === 'ecrire' || q.mode === 'memo' || q.mode === 'son') && (phase === 'write') && (
    <div className="dmode" role="group" aria-label="Écrire avec">
      <button type="button" aria-pressed={!slate} onClick={() => setSlate(false)}>⌨️ Clavier</button>
      <button type="button" aria-pressed={slate} onClick={() => setSlate(true)}>✏️ Ardoise</button>
    </div>
  )

  const compareButtons = (
    <div className="dself">
      <p className="dsmall">Compare lettre par lettre avec ce que tu as écrit.</p>
      <div className="row center">
        <button className="btn ok-btn" onClick={() => selfCheck(true)}>✅ C'est pareil</button>
        <button className="btn ghost" onClick={() => selfCheck(false)}>❌ Je me suis trompé</button>
      </div>
    </div>
  )

  // ---------- La lettre de la fin (et le son, au clavier) ----------
  if (q.mode === 'fin' || (q.mode === 'son' && !slate)) {
    const done = phase === 'done'
    const right = q.mode === 'son' ? q.blank : q.ending
    return (
      <div className="dictee-q">
        {toggle}
        <div className="dword-row">
          <button className="icon-btn" onClick={() => say(speech(e))} aria-label="Écouter"><Speaker /></button>
          <div className={'dword' + (done ? ' ok' : '')}>
            {done ? <Highlight text={e.text} /> : q.mode === 'son'
              ? <>{q.before}<span className="dgap">?</span>{q.after}</>
              : <>{q.stem}<span className="dgap end">?</span></>}
          </div>
        </div>
        <div className="dchoices">
          {q.options.map(o => (
            <button key={o || 'rien'} className={'dchoice' + (picked.includes(o) ? ' wrong' : '') + (done && o === right ? ' right' : '')}
              disabled={done || picked.includes(o)} onClick={() => choose(o)}>
              {o === '' ? <span className="rien">rien</span> : o}
            </button>
          ))}
        </div>
        {done && <Tips />}
      </div>
    )
  }

  // ---------- Le son, à l'ardoise : on écrit la syllabe qui manque ----------
  if (q.mode === 'son') {
    const shown = phase === 'compare' || phase === 'fix' || phase === 'done'
    return (
      <div className="dictee-q">
        {toggle}
        <div className="dword-row">
          <button className="icon-btn" onClick={() => say(speech(e))} aria-label="Écouter"><Speaker /></button>
          <div className={'dword' + (phase === 'done' ? ' ok' : '')}>
            {shown ? <Highlight text={e.text} /> : <>{q.before}<span className="dgap">?</span>{q.after}</>}
          </div>
        </div>
        {phase !== 'fix' && <p className="dsmall">{phase === 'write' ? 'Écris le son qui manque sur l’ardoise.' : 'Ce que tu as écrit :'}</p>}
        <Slate ref={pad} small disabled={phase !== 'write'} onInk={setHasInk} />
        {phase === 'write' && (
          <div className="row center">
            <button className="btn ghost small" onClick={() => pad.current?.clear()} disabled={!hasInk}>Effacer</button>
            <button className="btn" onClick={() => { setPhase('compare'); sounds.tick(6) }} disabled={!hasInk}>J'ai fini</button>
          </div>
        )}
        {phase === 'compare' && (
          <>
            <div className="dmodel"><span className="dl">Le son à écrire</span><span className="dword small"><b className="hl-son">{q.blank}</b></span></div>
            {compareButtons}
          </>
        )}
        {phase === 'fix' && (
          <>
            <Tips />
            <div className="row center"><button className="btn" onClick={rewrite}>Je réécris le son</button></div>
          </>
        )}
        {phase === 'done' && <Tips />}
      </div>
    )
  }

  // ---------- Regarder le mot (regarde, cache, écris) ----------
  if (phase === 'look') {
    return (
      <div className="dictee-q">
        <div className="dlook">
          <div className="dword big"><Highlight text={e.text} /></div>
          <p className="dsmall">Regarde bien chaque lettre. Le <b className="hl-son">son</b> en bleu, la <b className="hl-fin">lettre muette</b> en orange.</p>
          <div className="row center">
            <button className="icon-btn" onClick={() => say(e.text)} aria-label="Écouter"><Speaker /></button>
            <button className="btn" onClick={() => setPhase('write')}>Je cache et j'écris !</button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- Écrire à l'ardoise ----------
  if (slate) {
    return (
      <div className="dictee-q">
        {toggle}
        {phase === 'write' && (
          <div className="dword-row">
            <button className="icon-btn" onClick={() => say(speech(e))} aria-label="Écouter le mot"><Speaker /></button>
            <span className="dsmall">Écris le mot sur l'ardoise avec ton stylet ou ton doigt.</span>
          </div>
        )}
        <Slate ref={pad} disabled={phase !== 'write'} onInk={setHasInk} />
        {phase === 'write' && (
          <div className="row center">
            <button className="btn ghost small" onClick={() => pad.current?.clear()} disabled={!hasInk}>Effacer</button>
            <button className="btn" onClick={() => { setPhase('compare'); sounds.tick(6) }} disabled={!hasInk}>J'ai fini</button>
          </div>
        )}
        {(phase === 'compare' || phase === 'fix' || phase === 'done') && (
          <div className="dmodel"><span className="dl">Le modèle</span><span className={'dword' + (phase === 'done' ? ' ok' : '')}><Highlight text={e.text} /></span></div>
        )}
        {phase === 'compare' && compareButtons}
        {phase === 'fix' && (
          <>
            <Tips />
            <div className="row center"><button className="btn" onClick={rewrite}>Je l'ai bien regardé, je réécris !</button></div>
          </>
        )}
        {phase === 'done' && <Tips />}
      </div>
    )
  }

  // ---------- Écrire au clavier ----------
  return (
    <div className="dictee-q">
      {toggle}
      {phase === 'fix' ? (
        <div className="dfix">
          <div className="dline"><span className="dl">Tu as écrit</span>
            <span className="dword small">{lastWrong ? diffLetters(lastWrong, e.text).map((d, i) => <span key={i} className={d.miss ? 'miss' : d.ok ? '' : 'bad'}>{d.ch}</span>) : <i className="dsmall">(rien)</i>}</span>
          </div>
          <div className="dline"><span className="dl">Il fallait</span>
            <span className="dword"><Highlight text={e.text} /></span>
          </div>
          <Tips />
          <div className="row center">
            <button className="btn" onClick={() => { setPhase('write'); sounds.tick(5) }}>Je l'ai bien regardé, je réécris !</button>
          </div>
        </div>
      ) : (
        <>
          <div className="dword-row">
            <button className="icon-btn" onClick={() => say(speech(e))} aria-label="Écouter le mot"><Speaker /></button>
            <div className={'dinput' + (phase === 'done' ? ' ok' : '')} aria-live="polite">
              {phase === 'done' ? <Highlight text={e.text} /> : <>{text}<span className="caret" /></>}
            </div>
          </div>
          {phase === 'done'
            ? <Tips />
            : <Keyboard onKey={k => setText(t => (t + k).slice(0, 60))} onBack={() => setText(t => t.slice(0, -1))} onOk={check} okDisabled={!text.trim()} />}
        </>
      )}
    </div>
  )
}
