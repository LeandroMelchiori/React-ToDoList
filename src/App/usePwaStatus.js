import React from 'react';

function getInitialOnlineStatus() {
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

function usePwaStatus() {
    const [isOnline, setIsOnline] = React.useState(getInitialOnlineStatus);
    const [isOfflineReady, setIsOfflineReady] = React.useState(false);
    const [waitingWorker, setWaitingWorker] = React.useState(null);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleReady = () => setIsOfflineReady(true);
        const handleUpdate = (event) => setWaitingWorker(event.detail?.worker || null);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('taskflow:pwa-ready', handleReady);
        window.addEventListener('taskflow:pwa-update', handleUpdate);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('taskflow:pwa-ready', handleReady);
            window.removeEventListener('taskflow:pwa-update', handleUpdate);
        };
    }, []);

    const applyUpdate = React.useCallback(() => {
        if (!waitingWorker) {
            return;
        }

        let shouldReload = true;
        navigator.serviceWorker?.addEventListener('controllerchange', () => {
            if (!shouldReload) {
                return;
            }

            shouldReload = false;
            window.location.reload();
        }, { once: true });
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }, [waitingWorker]);

    return {
        applyUpdate,
        hasUpdate: Boolean(waitingWorker),
        isOfflineReady,
        isOnline,
    };
}

export { usePwaStatus };
