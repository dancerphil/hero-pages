import { Suspense, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { matchRoutes, useLocation, useRoutes } from 'react-router';
import { MenuNav } from '@/modules/Menu/MenuNav';
import { loadUser } from '@/regions/user';
import { routes } from './routes';

export function App() {
    const { pathname } = useLocation();
    const element = useRoutes(routes);

    useEffect(() => {
        loadUser();
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
