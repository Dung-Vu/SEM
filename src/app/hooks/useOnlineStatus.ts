"use client";

import { useEffect, useState } from "react";

interface NavigatorWithStandalone extends Navigator {
    standalone?: boolean;
}

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(() =>
        typeof navigator === "undefined" ? true : navigator.onLine,
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

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
    const [isInstalled, setIsInstalled] = useState(() => {
        if (typeof window === "undefined") return false;
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
        const isIOSStandalone =
            (window.navigator as NavigatorWithStandalone).standalone === true;
        return isStandalone || isIOSStandalone;
    });

    useEffect(() => {
        const checkInstalled = () => {
            const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
            const isIOSStandalone =
                (window.navigator as NavigatorWithStandalone).standalone === true;
            setIsInstalled(isStandalone || isIOSStandalone);
        };

        checkInstalled();
    }, []);

    return isInstalled;
}
