import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AccessGate } from './components/auth/AccessGate';
import { activeBodyFontProfile } from './presentation/design/tokens';
import './styles.css';

document.documentElement.style.setProperty('--active-body-font-family', `"${activeBodyFontProfile().family}"`);

createRoot(document.getElementById('root')!).render(<StrictMode><AccessGate><App /></AccessGate></StrictMode>);
