import { useEffect } from 'react';

export const PageTrade = (): null => {
    useEffect(() => {
        window.location.assign('https://tradingagents.zeabur.app/');
    }, []);
    return null;
};
