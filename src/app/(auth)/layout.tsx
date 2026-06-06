export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060612 0%, #0c0820 50%, #060612 100%)' }}
    >

      {/* ── Ambient glow blobs ──────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-10%', left: '-12%',
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 65%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: '-12%', right: '-10%',
          width: 620, height: 620,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.22) 0%, transparent 65%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          top: '42%', left: '38%',
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,70,239,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ── Dot-grid texture ─────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* ── Giant tilted tagline (the "background image" layer) ──────── */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none"
        style={{ transform: 'rotate(-10deg) scale(1.35)', gap: '2rem' }}
      >
        <span
          style={{
            fontSize: 'clamp(3.5rem, 10vw, 9rem)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
            color: 'rgba(255,255,255,0.032)',
          }}
        >
          Add Friends.
        </span>
        <span
          style={{
            fontSize: 'clamp(3.5rem, 10vw, 9rem)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
            color: 'rgba(255,255,255,0.032)',
          }}
        >
          Create Groups.
        </span>
        {/* "Gossip!!!" gets a faint violet tint so it barely bleeds through */}
        <span
          style={{
            fontSize: 'clamp(3.5rem, 10vw, 9rem)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
            color: 'rgba(192,132,252,0.055)',
          }}
        >
          Gossip!!!
        </span>
      </div>

      {/* ── Page content (above all background layers) ───────────────── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">

        {/* Logo + brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 8px 32px rgba(124,58,237,0.55), 0 0 0 1px rgba(124,58,237,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>N</span>
          </div>

          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#fff',
              lineHeight: 1.1,
            }}
          >
            NexusChat
          </h1>

          {/* The tagline also appears here — smaller, readable, slightly skewed */}
          <p
            style={{
              marginTop: 10,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'rgba(192,132,252,0.7)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transform: 'rotate(-1.5deg)',
            }}
          >
            Add Friends. Create Groups. Gossip!!!
          </p>
        </div>

        {/* ── Glowing border frame around the Clerk card ───────────────── */}
        <div
          style={{
            borderRadius: 22,
            padding: 2,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.6) 0%, rgba(79,70,229,0.2) 40%, rgba(217,70,239,0.4) 100%)',
            boxShadow:
              '0 30px 90px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px rgba(124,58,237,0.12)',
          }}
        >
          <div style={{ borderRadius: 20, overflow: 'hidden' }}>
            {children}
          </div>
        </div>

        <p
          style={{
            marginTop: 24,
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.18)',
            textAlign: 'center',
          }}
        >
          By continuing you agree to our Terms of Service &amp; Privacy Policy
        </p>
      </div>
    </div>
  );
}
