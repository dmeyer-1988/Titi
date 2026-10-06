import { useEffect, useState } from 'react'
import type { QProps } from './EntoureQ'
import { checkChateau, ruleText, type ChateauxQuestion } from './chateaux'
import { sounds } from './audio'

const MAX = 15
const COLORS = ['#2D6A9F', '#D6453A', '#2F8F55']

/** Les châteaux : on essaie, on vérifie, on ajuste. Chaque essai est noté dans un tableau. */
export function ChateauxQ({ q, onAttempt, onSolved, onNudge }: QProps<ChateauxQuestion>) {
  const [h, setH] = useState<number[]>(() => Array(q.towers).fill(1))
  const [tries, setTries] = useState<{ h: number[]; sum: number; totalOk: boolean; ruleOk: boolean }[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onSolved, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const bump = (i: number, d: number) => {
    if (done) return
    setH(x => x.map((v, k) => (k === i ? Math.max(0, Math.min(MAX, v + d)) : v)))
    sounds.tick(d > 0 ? 5 : 2)
  }

  const verify = () => {
    const r = checkChateau(q, h)
    setTries(t => [...t, { h: [...h], ...r }])
    if (r.totalOk && r.ruleOk) {
      // On récompense la démarche : la réussite compte, quel que soit le nombre d'essais.
      onAttempt(h.join('-'), q.answer.join('-'), true)
      setDone(true)
      return
    }
    sounds.bad()
    const parts: string[] = []
    if (!r.totalOk) {
      const diff = q.total - r.sum
      parts.push(`Tu as ${r.sum} cube${r.sum > 1 ? 's' : ''} : ${diff > 0 ? `il en manque ${diff}` : `il y en a ${-diff} de trop`}.`)
    } else parts.push(`${r.sum} cubes en tout, c'est juste !`)
    if (!r.ruleOk) {
      if (q.rule === 'double') parts.push(`Mais ${h[1]} n'est pas le double de ${h[0]}.`)
      else if (q.towers === 2) {
        const e = h[1] - h[0]
        parts.push(e < 0 ? 'Mais la tour de droite est plus petite.' : `Mais la tour de droite a ${e} cube${e > 1 ? 's' : ''} de plus : il en faut ${q.d}.`)
      } else parts.push(`Mais regarde l'écart entre les tours : il faut ${q.d} cube${q.d > 1 ? 's' : ''} de plus à chaque fois.`)
    } else parts.push('La 2e condition est juste !')
    onNudge(parts.join(' ') + ' Ajuste et vérifie encore.')
  }

  const cur = checkChateau(q, h)

  return (
    <div className="chateaux-q">
      <ol className="conds">
        <li><b>En tout : {q.total} cubes.</b></li>
        <li>{ruleText(q)}</li>
      </ol>

      <div className="castle">
        {h.map((v, i) => (
          <div key={i} className="tower-col">
            <div className={'tower' + (done ? ' win' : '')} style={{ ['--tc' as string]: COLORS[i] } as React.CSSProperties}>
              <span className="crenel" aria-hidden="true"><i /><i /><i /></span>
              {Array.from({ length: v }, (_, k) => <span key={k} className="cube" />)}
            </div>
            <div className="tower-count">{v}</div>
            <div className="tower-btns">
              <button className="key alt" onClick={() => bump(i, -1)} disabled={done || v === 0} aria-label={`Enlever un cube à la tour ${i + 1}`}>−</button>
              <button className="key" onClick={() => bump(i, 1)} disabled={done || v === MAX} aria-label={`Ajouter un cube à la tour ${i + 1}`}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="row center">
        <button className="btn" onClick={verify} disabled={done || cur.sum === 0}>Vérifier mon essai</button>
      </div>

      {tries.length > 0 && (
        <table className="essais">
          <thead>
            <tr><th>Essai</th>{h.map((_, i) => <th key={i}>Tour {i + 1}</th>)}<th>En tout</th><th>①</th><th>②</th></tr>
          </thead>
          <tbody>
            {tries.map((t, k) => (
              <tr key={k} className={t.totalOk && t.ruleOk ? 'ok' : ''}>
                <td>{k + 1}</td>
                {t.h.map((v, i) => <td key={i}>{v}</td>)}
                <td>{t.sum}</td>
                <td className={t.totalOk ? 'y' : 'n'}>{t.totalOk ? '✓' : '✗'}</td>
                <td className={t.ruleOk ? 'y' : 'n'}>{t.ruleOk ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
