"use client";

import { useEffect, useState } from "react";

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        setIsOnline(navigator.onLine);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}

export function useInstallStatus() {
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const checkInstalled = () => {
            const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
            const isIOSStandalone = (window.navigator as any).standalone === true;
            setIsInstalled(isStandalone || isIOSStandalone);
        };

        checkInstalled();
    }, []);

    return isInstalled;
}
