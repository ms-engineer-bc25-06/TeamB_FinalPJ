interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = '← もどる',
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'none',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '6px',
        borderRadius: '6px',
        color: '#000000',
        zIndex: 200,
        fontWeight: 'bold',
      }}
    >
      {label}
    </button>
  );
};
