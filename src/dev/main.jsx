/* Entry for the dev harness. Copy to frontend/src/dev/main.jsx. Same file for everyone. */
import './mock-flag.js'; // keep this first: it switches every api module to sample data before they load
import { createRoot } from 'react-dom/client';
import '../styles/nexora.css';
import '../styles/nexora-2.css';
import '../styles/tailwind.css';
import { applyAppearance } from '../lib/appearance.js';
import Harness from './Harness.jsx';

applyAppearance(); // the saved colour theme, font and text size, before the first paint
createRoot(document.getElementById('root')).render(<Harness />);
