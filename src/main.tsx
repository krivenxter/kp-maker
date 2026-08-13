import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { activeBodyFontProfile } from './presentation/design/tokens';
import './styles.css';

document.documentElement.style.setProperty('--active-body-font-family', `"${activeBodyFontProfile().family}"`);

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
