"use client";

import { useState, useRef, useEffect, useId } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function QuickAddWord() {
    const pathname = usePathname();
    const hideBadge = pathname === "/anki" || pathname === "/speak";
    const [open, setOpen] = useState(false);
    const [word, setWord] = useState("");
    const [vietnamese, setVietnamese] = useState("");
    const [saving, setSaving] = useState(false);
    const [todayCount, setTodayCount] = useState(0);
    const [kbOffset, setKbOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { showToast } = useToast();
    const titleId = useId();
    const wordInputId = useId();
    const vnInputId = useId();
    const errorId = useId();

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    // Track iOS keyboard via visualViewport
    useEffect(() => {
        if (!open) {
            setKbOffset(0);
            return;
        }
        const vv = typeof window !== "undefined" ? window.visualViewport : null;
        if (!vv) return;

        const onResize = () => {
            const offset = Math.max(0, window.innerHeight - vv.height);
            setKbOffset(offset);
        };

        vv.addEventListener("resize", onResize);
        onResize();
        return () => vv.removeEventListener("resize", onResize);
    }, [open]);

    // Escape closes the modal and returns focus to the trigger.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    useEffect(() => {
        fetch("/api/anki/words?countToday=true")
            .then((r) => r.json())
            .then((d) => {
                if (d.todayCount !== undefined) setTodayCount(d.todayCount);
            })
            .catch(() => {});
    }, []);

    const close = () => {
        setOpen(false);
        setError(null);
        // Restore focus after the modal is removed.
        requestAnimationFrame(() => triggerRef.current?.focus());
    };

    const handleSave = async () => {
        if (!word.trim()) return;
        setSaving(true);
        setError(null);
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
            if (data.success && data.word) {
                const newCount = todayCount + 1;
                setTodayCount(newCount);
                showToast(`"${word}" added! +2 EXP · Today: ${newCount}/10`, "success");
                setWord("");
                setVietnamese("");
                close();
            } else {
                const msg = data.error || "Could not add word";
                setError(msg);
                showToast(msg, "error");
            }
        } catch {
            const msg = "Network error";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* FAB */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Quick add a new word to your Anki deck"
                aria-haspopup="dialog"
                aria-expanded={open}
                style={{
                    position: "fixed",
                    bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
                    right: "12px",
                    zIndex: 900,
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "none",
                    background:
                        "linear-gradient(135deg, var(--cyan), var(--violet-bright))",
                    color: "var(--bg-void)",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Plus
                    size={20}
                    strokeWidth={2.5}
                    style={{ color: "var(--bg-void)" }}
                    aria-hidden="true"
                />
            </button>
            {/* Today counter badge */}
            {todayCount > 0 && !hideBadge && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "fixed",
                        bottom: "calc(126px + env(safe-area-inset-bottom, 0px))",
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

            {/* Modal — separate backdrop + sheet for iOS keyboard compat */}
            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={close}
                        aria-hidden="true"
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 9998,
                            background: "rgba(0,0,0,0.6)",
                            backdropFilter: "blur(4px)",
                            WebkitBackdropFilter: "blur(4px)",
                        }}
                    />
                    {/* Sheet — tracks keyboard via bottom offset */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        className="glass-card animate-scale-in"
                        style={{
                            position: "fixed",
                            bottom: kbOffset,
                            left: 0,
                            right: 0,
                            zIndex: 9999,
                            width: "100%",
                            maxWidth: "430px",
                            margin: "0 auto",
                            padding: "20px",
                            paddingBottom:
                                kbOffset > 0
                                    ? "12px"
                                    : "calc(env(safe-area-inset-bottom, 0px) + 20px)",
                            borderRadius: "20px 20px 0 0",
                            borderBottom: "none",
                            transition: "bottom 0.15s ease-out",
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
                                id={titleId}
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    margin: 0,
                                }}
                            >
                                Quick Add Word
                            </h3>
                            <button
                                type="button"
                                onClick={close}
                                aria-label="Close quick add dialog"
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    fontSize: "18px",
                                    cursor: "pointer",
                                }}
                            >
                                <span aria-hidden="true">✕</span>
                            </button>
                        </div>

                        <label
                            htmlFor={wordInputId}
                            style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                marginBottom: "4px",
                            }}
                        >
                            English word
                        </label>
                        <input
                            id={wordInputId}
                            ref={inputRef}
                            type="text"
                            value={word}
                            onChange={(e) => {
                                setWord(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="e.g. ephemeral"
                            aria-invalid={error ? "true" : undefined}
                            aria-describedby={error ? errorId : undefined}
                            required
                            maxLength={200}
                            style={{
                                width: "100%",
                                padding: "12px",
                                background: "var(--bg-raised)",
                                border: `1px solid ${error ? "var(--ruby)" : "rgba(255,255,255,0.07)"}`,
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

                        <label
                            htmlFor={vnInputId}
                            style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                marginBottom: "4px",
                            }}
                        >
                            Vietnamese meaning (optional)
                        </label>
                        <input
                            id={vnInputId}
                            type="text"
                            value={vietnamese}
                            onChange={(e) => setVietnamese(e.target.value)}
                            placeholder="Nghĩa tiếng Việt (optional)"
                            maxLength={200}
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

                        {error && (
                            <p
                                id={errorId}
                                role="alert"
                                style={{
                                    fontSize: 12,
                                    color: "var(--ruby)",
                                    margin: "0 0 8px",
                                }}
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !word.trim()}
                            aria-disabled={saving || !word.trim()}
                            className="btn-primary"
                            style={{ width: "100%", fontSize: "15px" }}
                        >
                            {saving ? "Adding..." : "Add to Anki Deck"}
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
