import { useEffect, useState } from 'react';
import { POPUP_CONFIG } from '../config/popup';

const RetroPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Check localStorage for saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('popupEnabled');
    if (saved !== null) {
      POPUP_CONFIG.enabled = saved === 'true';
    }
  }, []);

  // Don't render anything if popup is disabled
  if (!POPUP_CONFIG.enabled) return null;

  useEffect(() => {
    // HERE - pop up config
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, POPUP_CONFIG.delayMs);

    return () => clearTimeout(timer);
  }, []);

  const handleAgree = () => {
    setIsVisible(false);
  };

  const handleDisagree = () => {
    // Open the link in a new tab
    window.open(POPUP_CONFIG.disagreeLink, '_blank');
  };

  // Prevent keyboard events when popup is visible
  useEffect(() => {
    if (isVisible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '3px solid #808080',
          padding: '30px',
          textAlign: 'center',
          maxWidth: '700px',
          width: '90%',
          boxShadow: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
          <img 
            src="/towers.jpg" 
            alt="Towers" 
            style={{
              width: '80px',
              height: '80px',
              border: '2px solid #000000',
              objectFit: 'cover'
            }}
          />
          
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#000000',
              lineHeight: '1.2',
              flex: '1',
              textAlign: 'center'
            }}
          >
            {POPUP_CONFIG.message}
          </div>
          
          <img 
            src="/bush.jpg" 
            alt="Bush" 
            style={{
              width: '80px',
              height: '80px',
              border: '2px solid #000000',
              objectFit: 'cover'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button
            onClick={handleAgree}
            style={{
              backgroundColor: '#00ff00',
              color: '#ffffff',
              border: '2px solid #000000',
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = '#00cc00';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = '#00ff00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#00ff00';
            }}
          >
            {POPUP_CONFIG.agreeButtonText}
          </button>
          
          <button
            onClick={handleDisagree}
            style={{
              backgroundColor: '#ff0000',
              color: '#ffffff',
              border: '2px solid #000000',
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = '#cc0000';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = '#ff0000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff0000';
            }}
          >
            {POPUP_CONFIG.disagreeButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetroPopup;
