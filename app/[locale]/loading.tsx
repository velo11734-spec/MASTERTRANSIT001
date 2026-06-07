export default function Loading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
      }}
    >
      <style>{`
        @keyframes mt-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes mt-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .mt-loader-ring {
          width: 44px;
          height: 44px;
          border: 3px solid #E2E8F0;
          border-top-color: #16A34A;
          border-radius: 50%;
          animation: mt-spin 0.75s linear infinite;
        }
        .mt-loader-text {
          font-size: 13px;
          color: #94A3B8;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          animation: mt-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="mt-loader-ring" />
        <p className="mt-loader-text">Loading...</p>
      </div>
    </div>
  )
}
