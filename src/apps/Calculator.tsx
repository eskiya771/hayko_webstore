import { useState } from 'react'

type Operation = '+' | '−' | '×' | '÷'
const keys = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '⌫', '=']

function calculate(left: number, right: number, operator: Operation) {
  switch (operator) {
    case '+': return left + right
    case '−': return left - right
    case '×': return left * right
    case '÷': return right === 0 ? NaN : left / right
  }
}

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [stored, setStored] = useState<number | null>(null)
  const [operator, setOperator] = useState<Operation | null>(null)
  const [fresh, setFresh] = useState(false)

  function press(key: string) {
    if (key === 'C') { setDisplay('0'); setStored(null); setOperator(null); setFresh(false); return }
    if (key === '⌫') { setDisplay(d => d.length <= 1 ? '0' : d.slice(0, -1)); return }
    if (key === '±') { setDisplay(d => d.startsWith('-') ? d.slice(1) : d === '0' ? d : '-' + d); return }
    if (key === '%') { setDisplay(d => String(Number(d) / 100)); return }
    if (key === '.' || /^\d$/.test(key)) {
      setDisplay(d => {
        if (fresh || d === 'Fehler') return key === '.' ? '0.' : key
        if (key === '.' && d.includes('.')) return d
        if (key === '.') return d + '.'
        return d === '0' ? key : d.length >= 13 ? d : d + key
      })
      setFresh(false)
      return
    }
    if (['+', '−', '×', '÷'].includes(key)) {
      setStored(Number(display))
      setOperator(key as Operation)
      setFresh(true)
      return
    }
    if (key === '=' && stored !== null && operator) {
      const result = calculate(stored, Number(display), operator)
      setDisplay(Number.isFinite(result) ? String(Number(result.toPrecision(11))) : 'Fehler')
      setStored(null)
      setOperator(null)
      setFresh(true)
    }
  }

  return <section className="tool calculator" aria-label="Taschenrechner">
    <div className="calculator-display">
      <span>{stored !== null && operator ? stored + ' ' + operator : 'Bereit'}</span>
      <strong aria-live="polite">{display}</strong>
    </div>
    <div className="calculator-grid">
      {keys.map(key => <button
        className={'calc-key ' + (['÷', '×', '−', '+', '='].includes(key) ? 'calc-accent' : '') + (key === '=' ? ' calc-equals' : '')}
        onClick={() => press(key)} key={key}>{key}</button>)}
    </div>
  </section>
}
