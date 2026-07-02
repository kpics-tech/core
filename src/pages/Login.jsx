import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { loginWithPassphrase, error } = useAuth()
  const [passphrase, setPassphrase] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!passphrase || submitting) return
    setSubmitting(true)
    await loginWithPassphrase(passphrase)
    setSubmitting(false)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.pulseLayer} aria-hidden="true">
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={styles.pulseSvg}>
          <polyline
            points="0,50 60,50 75,50 85,15 95,85 105,50 120,50 180,50 195,50 205,25 215,75 225,50 240,50 400,50"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="pulse-line"
          />
        </svg>
      </div>

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.eyebrow}>K-PICS</div>
        <h1 style={styles.title}>Core</h1>
        <p style={styles.subtitle}>幹部運営OS</p>

        <label style={styles.label} htmlFor="passphrase">合言葉</label>
        <input
          id="passphrase"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          style={styles.input}
          autoFocus
          autoComplete="current-password"
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={submitting}>
          {submitting ? '確認中…' : '入る'}
        </button>
      </form>

      <style>{`
        .pulse-line {
          stroke-dasharray: 700;
          stroke-dashoffset: 700;
          animation: sweep 2.6s ease-in-out infinite;
          filter: drop-shadow(0 0 6px var(--accent));
        }
        @keyframes sweep {
          0% { stroke-dashoffset: 700; opacity: 0.2; }
          40% { opacity: 1; }
          60% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -700; opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  wrap: {
    height: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  pulseLayer: {
    position: 'absolute',
    top: '18%',
    left: 0,
    right: 0,
    height: '100px',
    opacity: 0.5,
  },
  pulseSvg: {
    width: '100%',
    height: '100%',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '340px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.15em',
    color: 'var(--accent-2)',
    marginBottom: '4px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '32px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    margin: '4px 0 28px',
  },
  label: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '16px',
    color: 'var(--text)',
    marginBottom: '8px',
  },
  error: {
    color: 'var(--danger)',
    fontSize: '13px',
    margin: '4px 0 0',
  },
  button: {
    marginTop: '20px',
    background: 'var(--accent)',
    color: '#03181c',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
