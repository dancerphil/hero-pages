import { Suspense, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { matchRoutes, useLocation, useRoutes } from 'react-router';
import { MenuNav } from '@/components/Menu/MenuNav';
import { loadUser } from '@/regions/user';
import { clearStaleNovelText } from '@/pages/PageRead/cache';
import { routes } from './routes';

export function App() {
    const { pathname } = useLocation();
    const element = useRoutes(routes);

    useEffect(() => {
        loadUser();
        clearStaleNovelText();
    }, []);

    useEffect(() => {
        const title = matchRoutes(routes, pathname)?.at(-1)?.route.handle?.title;
        document.title = title ? `${title} - dancerphil` : 'dancerphil';
    }, [pathname]);

    return (
        <MantineProvider>
            <Notifications />
            <MenuNav routes={routes} />
            <Suspense fallback={null}>{element}</Suspense>
        </MantineProvider>
    );
}
