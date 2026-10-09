import ReactDOM from 'react-dom/client';
import './app/styles/global.css';
import App from './app/App';
import { registerServiceWorker } from './app/pwa/serviceWorkerRegistration';


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
registerServiceWorker();
