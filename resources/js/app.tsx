import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { DarkModeProvider } from './Components/DarkModeContext';

const appName = import.meta.env.VITE_APP_NAME || 'PCS Portal';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <DarkModeProvider>
                <App {...props} />
            </DarkModeProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});