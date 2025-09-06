interface ErrorDisplayProps {
  error: string;
  onBack: () => void;
  title?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onBack,
  title = 'エラー',
}) => {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#333',
            }}
          >
            ← もどる
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            {title}
          </h1>
          <div style={{ width: '50px' }}></div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          padding: '20px',
          zIndex: 50,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 0, 0, 0.1)',
            color: '#d32f2f',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '16px',
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          {error}
        </div>
        <button
          onClick={onBack}
          style={{
            background: '#007AFF',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          感情選択に戻る
        </button>
      </div>
    </>
  );
};
