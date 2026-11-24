import { useEffect } from 'react';

export const PageTrade = (): null => {
    useEffect(() => {
        window.location.assign('https://agents.dancerphil.com/');
    }, []);
    return null;
};
