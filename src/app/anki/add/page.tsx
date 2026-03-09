"use client";

import { useState } from "react";
import {
    Bot,
    Plus,
    BookOpen,
    MessageSquare,
    BarChart3,
    Tag,
    BookMarked,
    Download,
    Home,
} from "lucide-react";

export default function AddWordPage() {
    const [form, setForm] = useState({
        english: "",
        vietnamese: "",
        definition: "",
        exampleSentence: "",
        level: "A1",
        tags: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [aiFilling, setAiFilling] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [addedCount, setAddedCount] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.english.trim() || !form.vietnamese.trim()) {
            setToast("English and Vietnamese are required");
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/anki/words", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (data.success) {
                setToast(`"${form.english}" added · +${data.expGain} EXP`);
                setAddedCount((prev) => prev + 1);
                setForm({
                    english: "",
                    vietnamese: "",
                    definition: "",
                    exampleSentence: "",
                    level: form.level,
                    tags: "",
                });
            } else {
                setToast(data.error || "Failed to add word");
            }
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast("Error adding word");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSubmitting(false);
        }
    };

    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

    const handleAiFill = async () => {
        if (!form.english.trim()) {
            setToast("Enter an English word first");
            setTimeout(() => setToast(null), 3000);
            return;
        }
        setAiFilling(true);
        try {
            const res = await fetch("/api/anki/ai-fill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ word: form.english }),
            });
            const data = await res.json();
            if (data.success) {
                setForm({
                    ...form,
                    vietnamese: data.vietnamese || form.vietnamese,
                    definition: data.definition || form.definition,
                    exampleSentence:
                        data.exampleSentence || form.exampleSentence,
                    level: data.level || form.level,
                    tags: data.tags || form.tags,
                });
                setToast("AI filled details!");
            } else {
                setToast(data.error || "AI fill failed");
            }
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast("AI fill error");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setAiFilling(false);
        }
    };

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
            {/* Toast */}
            {toast && (
                <div className="toast animate-scale-in">
                    <div
                        className="glass-card"
                        style={{
                            padding: "14px 18px",
                            borderColor: "rgba(99,102,241,0.3)",
                        }}
                    >
                        <p
                            style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                textAlign: "center",
                            }}
                        >
                            {toast}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div
                className="animate-fade-in-up"
                style={{ marginBottom: "16px" }}
            >
                <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
                    <Plus
                        size={16}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: "4px",
                        }}
                    />
                    <span className="gradient-text">Add New Word</span>
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        marginTop: "4px",
                    }}
                >
                    Add vocabulary to your collection · +2 EXP per word
                </p>
            </div>

            {/* Added Counter */}
            {addedCount > 0 && (
                <div
                    className="glass-card animate-scale-in"
                    style={{
                        padding: "12px",
                        marginBottom: "12px",
                        textAlign: "center",
                    }}
                >
                    <span
                        style={{
                            color: "var(--emerald)",
                            fontWeight: 700,
                            fontSize: "14px",
                        }}
                    >
                        {addedCount} word{addedCount > 1 ? "s" : ""} added today
                        · +{addedCount * 2} EXP
                    </span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div
                    className="glass-card animate-fade-in-up"
                    style={{
                        padding: "18px",
                        marginBottom: "12px",
                        animationDelay: "0.05s",
                    }}
                >
                    {/* English */}
                    <div style={{ marginBottom: "14px" }}>
                        <label
                            style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                display: "block",
                                marginBottom: "6px",
                            }}
                        >
                            🇬🇧 English *
                        </label>
                        <input
                            type="text"
                            value={form.english}
                            onChange={(e) =>
                                setForm({ ...form, english: e.target.value })
                            }
                            placeholder="e.g. accomplish"
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                borderRadius: "12px",
                                background: "var(--bg-raised)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                color: "var(--text-primary)",
                                outline: "none",
                                fontFamily: "var(--font-sans)",
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleAiFill}
                            disabled={aiFilling || !form.english.trim()}
                            style={{
                                marginTop: "6px",
                                padding: "8px 14px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 700,
                                background: "rgba(129,140,248,0.15)",
                                color: "var(--cyan)",
                                opacity:
                                    aiFilling || !form.english.trim() ? 0.5 : 1,
                            }}
                        >
                            {aiFilling ? "Filling..." : "AI Fill Details"}
                        </button>
                    </div>

                    {/* Vietnamese */}
                    <div style={{ marginBottom: "14px" }}>
                        <label
                            style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                display: "block",
                                marginBottom: "6px",
                            }}
                        >
                            🇻🇳 Vietnamese *
                        </label>
                        <input
                            type="text"
                            value={form.vietnamese}
                            onChange={(e) =>
                                setForm({ ...form, vietnamese: e.target.value })
                            }
                            placeholder="e.g. hoàn thành"
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                borderRadius: "12px",
                                background: "var(--bg-raised)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                color: "var(--text-primary)",
                                outline: "none",
                                fontFamily: "var(--font-sans)",
                            }}
                        />
                    </div>

                    {/* Definition */}
                    <div style={{ marginBottom: "14px" }}>
                        <label
                            style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                display: "block",
                                marginBottom: "6px",
                            }}
                        >
                            Definition
                        </label>
                        <textarea
                            value={form.definition}
                            onChange={(e) =>
                                setForm({ ...form, definition: e.target.value })
                            }
                            placeholder="to finish something successfully"
                            rows={2}
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                borderRadius: "12px",
                                background: "var(--bg-raised)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                color: "var(--text-primary)",
                                resize: "none",
                                outline: "none",
                                fontFamily: "var(--font-sans)",
                            }}
                        />
                    </div>

                    {/* Example */}
                    <div style={{ marginBottom: "14px" }}>
                        <label
                            style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                display: "block",
                                marginBottom: "6px",
                            }}
                        >
                            Example Sentence
                        </label>
                        <textarea
                            value={form.exampleSentence}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    exampleSentence: e.target.value,
                                })
                            }
                            placeholder="She accomplished her goal of learning English."
                            rows={2}
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                borderRadius: "12px",
                                background: "var(--bg-raised)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                color: "var(--text-primary)",
                                resize: "none",
                                outline: "none",
                                fontFamily: "var(--font-sans)",
                            }}
                        />
                    </div>

                    {/* Level + Tags Row */}
                    <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                            <label
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    display: "block",
                                    marginBottom: "6px",
                                }}
                            >
                                Level
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "4px",
                                    flexWrap: "wrap",
                                }}
                            >
                                {levels.map((lv) => (
                                    <button
                                        key={lv}
                                        type="button"
                                        onClick={() =>
                                            setForm({ ...form, level: lv })
                                        }
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            border:
                                                form.level === lv
                                                    ? "1px solid var(--cyan)"
                                                    : "1px solid rgba(255,255,255,0.07)",
                                            background:
                                                form.level === lv
                                                    ? "rgba(129,140,248,0.15)"
                                                    : "var(--bg-raised)",
                                            color:
                                                form.level === lv
                                                    ? "var(--cyan)"
                                                    : "var(--text-muted)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {lv}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div style={{ marginTop: "14px" }}>
                        <label
                            style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                display: "block",
                                marginBottom: "6px",
                            }}
                        >
                            Tags
                        </label>
                        <input
                            type="text"
                            value={form.tags}
                            onChange={(e) =>
                                setForm({ ...form, tags: e.target.value })
                            }
                            placeholder="verb, business, daily (comma separated)"
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                borderRadius: "12px",
                                background: "var(--bg-raised)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                color: "var(--text-primary)",
                                outline: "none",
                                fontFamily: "var(--font-sans)",
                            }}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                >
                    {submitting ? "Adding..." : "Add Word (+2 EXP)"}
                </button>
            </form>

            {/* Quick Links */}
            <div
                className="animate-fade-in-up"
                style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "12px",
                    animationDelay: "0.1s",
                }}
            >
                <a
                    href="/anki"
                    className="btn-secondary"
                    style={{
                        flex: 1,
                        textDecoration: "none",
                        textAlign: "center",
                    }}
                >
                    Review Cards
                </a>
                <a
                    href="/anki/import"
                    className="btn-secondary"
                    style={{
                        flex: 1,
                        textDecoration: "none",
                        textAlign: "center",
                    }}
                >
                    Bulk Import
                </a>
                <a
                    href="/"
                    className="btn-secondary"
                    style={{
                        flex: 1,
                        textDecoration: "none",
                        textAlign: "center",
                    }}
                >
                    Home
                </a>
            </div>
        </div>
    );
}
