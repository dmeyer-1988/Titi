import { useEffect, useState } from 'react'
import type { QProps } from './EntoureQ'
import { diffLetters, findIn, norm, silentEnd, speech, tips, type DicteeEntry, type DicteeQuestion } from './dictee'
import { say, sounds } from './audio'

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

/** Écrire le mot (dictée ou regarde-cache-écris), choisir le son, ou choisir la fin du mot. */
export function DicteeQ({ q, list, onAttempt, onSolved }: QProps<DicteeQuestion> & { list: DicteeEntry[] }) {
  const e = q.entry
  const [phase, setPhase] = useState<'look' | 'write' | 'fix' | 'done'>(q.mode === 'memo' ? 'look' : 'write')
  const [text, setText] = useState('')
  const [lastWrong, setLastWrong] = useState('')
  const [picked, setPicked] = useState<string[]>([])

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

  const tipList = tips(e, list)

  // ---------- Le bon son / La lettre de la fin ----------
  if (q.mode === 'son' || q.mode === 'fin') {
    const done = phase === 'done'
    return (
      <div className="dictee-q">
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
            <button key={o || 'rien'} className={'dchoice' + (picked.includes(o) ? ' wrong' : '') + (done && o === (q.mode === 'son' ? q.blank : q.ending) ? ' right' : '')}
              disabled={done || picked.includes(o)} onClick={() => choose(o)}>
              {o === '' ? <span className="rien">rien</span> : o}
            </button>
          ))}
        </div>
        {done && tipList.length > 0 && <ul className="dtips">{tipList.map(t => <li key={t}>{t}</li>)}</ul>}
      </div>
    )
  }

  // ---------- Écrire ----------
  return (
    <div className="dictee-q">
      {phase === 'look' ? (
        <div className="dlook">
          <div className="dword big"><Highlight text={e.text} /></div>
          <p className="dsmall">Regarde bien chaque lettre. Le <b className="hl-son">son</b> en bleu, la <b className="hl-fin">lettre muette</b> en orange.</p>
          <div className="row center">
            <button className="icon-btn" onClick={() => say(e.text)} aria-label="Écouter"><Speaker /></button>
            <button className="btn" onClick={() => setPhase('write')}>Je cache et j'écris !</button>
          </div>
        </div>
      ) : phase === 'fix' ? (
        <div className="dfix">
          <div className="dline"><span className="dl">Tu as écrit</span>
            <span className="dword small">{lastWrong ? diffLetters(lastWrong, e.text).map((d, i) => <span key={i} className={d.miss ? 'miss' : d.ok ? '' : 'bad'}>{d.ch}</span>) : <i className="dsmall">(rien)</i>}</span>
          </div>
          <div className="dline"><span className="dl">Il fallait</span>
            <span className="dword"><Highlight text={e.text} /></span>
          </div>
          {tipList.length > 0 && <ul className="dtips">{tipList.map(t => <li key={t}>{t}</li>)}</ul>}
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
            ? tipList.length > 0 && <ul className="dtips">{tipList.map(t => <li key={t}>{t}</li>)}</ul>
            : <Keyboard onKey={k => setText(t => (t + k).slice(0, 60))} onBack={() => setText(t => t.slice(0, -1))} onOk={check} okDisabled={!text.trim()} />}
        </>
      )}
    </div>
  )
}
