import { useEffect, useState } from 'react'
import { Otter, type Mood } from './Otter'
import { say } from '../engine/audio'

/**
 * La loutre avec sa bulle. `key` du message = nouvelle animation.
 * Toucher la loutre lui fait relire sa bulle.
 */
export function Mascot({ mood, text, speak = false, size = 'md', side = 'left' }: {
  mood: Mood; text?: React.ReactNode; speak?: string | false; size?: 'sm' | 'md' | 'lg'; side?: 'left' | 'right'
}) {
  const [hop, setHop] = useState(0)
  useEffect(() => { setHop(h => h + 1) }, [mood, speak])
  return (
    <div className={'mascot ' + size + ' ' + side}>
      <button
        key={hop}
        className={'mascot-body m-' + mood}
        onClick={() => { setHop(h => h + 1); if (speak) say(speak) }}
        aria-label={speak ? `Écouter : ${speak}` : 'Mascotte'}
      >
        <Otter mood={mood} />
      </button>
      {text && <div className="bubble" key={'b' + hop} aria-live="polite">{text}</div>}
    </div>
  )
}
