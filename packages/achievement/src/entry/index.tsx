import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';

const root = document.querySelector('#root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>,
);
