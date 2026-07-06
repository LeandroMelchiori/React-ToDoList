import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App/App';
import { registerServiceWorker } from './serviceWorkerRegistration';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
registerServiceWorker();
