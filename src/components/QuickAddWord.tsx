"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export function QuickAddWord() {
    const pathname = usePathname();
    const hideBadge = pathname === "/anki" || pathname === "/speak";
    const [open, setOpen] = useState(false);
    const [word, setWord] = useState("");
    const [vietnamese, setVietnamese] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [todayCount, setTodayCount] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    useEffect(() => {
        // Fetch today's word count
        fetch("/api/anki/words?countToday=true")
            .then((r) => r.json())
            .then((d) => {
                if (d.todayCount !== undefined) setTodayCount(d.todayCount);
            })
            .catch(() => {});
    }, []);

    const handleSave = async () => {
        if (!word.trim()) return;
        setSaving(true);
        try {
            const res = await fetch("/api/anki/words", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    english: word.trim(),
                    vietnamese: vietnamese.trim(),
                    level: "A1",
                }),
            });
            const data = await res.json();
            if (data.word) {
                setTodayCount((prev) => prev + 1);
                setToast(
                    `"${word}" added! +2 EXP · Today: ${todayCount + 1}/10`,
                );
                setWord("");
                setVietnamese("");
                setOpen(false);
            } else {
                setToast(data.error || "Error");
            }
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast("Error");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Toast */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10000,
                        maxWidth: "360px",
                        width: "90%",
                    }}
                    className="animate-scale-in"
                >
                    <div
                        className="glass-card"
                        style={{
                            padding: "12px 16px",
                            borderColor: "rgba(99,102,241,0.3)",
                        }}
                    >
                        <p
                            style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                textAlign: "center",
                            }}
                        >
                            {toast}
                        </p>
                    </div>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setOpen(true)}
                style={{
                    position: "fixed",
                    bottom: "80px",
                    right: "12px",
                    zIndex: 900,
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "none",
                    background:
                        "linear-gradient(135deg, var(--cyan), var(--violet-bright))",
                    color: "var(--bg-void)",
                    fontSize: "18px",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                title="Quick Add Word"
            >
                <Plus
                    size={20}
                    strokeWidth={2.5}
                    style={{ color: "var(--bg-void)" }}
                />
            </button>
            {/* Today counter badge — small pill above FAB */}
            {todayCount > 0 && !hideBadge && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "126px",
                        right: "10px",
                        zIndex: 901,
                        background:
                            todayCount >= 10
                                ? "rgba(52,211,153,0.25)"
                                : "rgba(99,102,241,0.2)",
                        color: todayCount >= 10 ? "#34d399" : "#a5b4fc",
                        padding: "1px 6px",
                        borderRadius: "6px",
                        fontSize: "8px",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        pointerEvents: "none",
                        textAlign: "center",
                        lineHeight: 1.4,
                    }}
                >
                    {todayCount}/10
                </div>
            )}

            {/* Modal */}
            {open && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setOpen(false);
                    }}
                >
                    <div
                        className="glass-card animate-scale-in"
                        style={{
                            width: "100%",
                            maxWidth: "430px",
                            padding: "20px",
                            marginBottom: "0",
                            borderRadius: "20px 20px 0 0",
                            borderBottom: "none",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "14px",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    margin: 0,
                                }}
                            >
                                Quick Add Word
                            </h3>
                            <button
                                onClick={() => setOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    fontSize: "18px",
                                    cursor: "pointer",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            placeholder="English word..."
                            style={{
                                width: "100%",
                                padding: "12px",
                                background: "var(--bg-raised)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "10px",
                                color: "var(--text-primary)",
                                fontSize: "16px",
                                marginBottom: "8px",
                            }}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                            }}
                        />

                        <input
                            type="text"
                            value={vietnamese}
                            onChange={(e) => setVietnamese(e.target.value)}
                            placeholder="Nghĩa tiếng Việt (optional)"
                            style={{
                                width: "100%",
                                padding: "12px",
                                background: "var(--bg-raised)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "10px",
                                color: "var(--text-primary)",
                                fontSize: "16px",
                                marginBottom: "12px",
                            }}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                            }}
                        />

                        <button
                            onClick={handleSave}
                            disabled={saving || !word.trim()}
                            className="btn-primary"
                            style={{ width: "100%", fontSize: "15px" }}
                        >
                            {saving ? "Adding..." : "Add to Anki Deck"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
