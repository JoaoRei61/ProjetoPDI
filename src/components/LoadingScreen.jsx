import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingScreen = () => {
  return (
    <div style={styles.overlay}>
      <div style={styles.content}>
        <img src="/imagens/logo.png" alt="Logo" style={styles.logo} />
        <h3 className="text-primary mt-3">A carregar, por favor aguarde...</h3>
        <Spinner animation="border" variant="primary" size="lg" className="mt-3" />
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    flexDirection: 'column',
  },
  content: {
    textAlign: 'center',
  },
  logo: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
};

export default LoadingScreen;