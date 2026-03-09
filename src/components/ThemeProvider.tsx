"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Apply saved theme on mount
        const saved = localStorage.getItem("eq-theme") ?? "dark";
        document.documentElement.setAttribute("data-theme", saved);
    }, []);

    return <>{children}</>;
}
