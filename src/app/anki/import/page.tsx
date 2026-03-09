"use client";

import { useState } from "react";

export default function BulkImportPage() {
    const [text, setText] = useState("");
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{
        added: number;
        skipped: number;
        errors: string[];
    } | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const handleImport = async () => {
        const lines = text
            .trim()
            .split("\n")
            .filter((l) => l.trim());

        if (lines.length === 0) {
            setToast("Paste some words first");
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setImporting(true);
        setResult(null);

        let added = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const line of lines) {
            // Support formats: "word - meaning" or "word | meaning" or "word\tmeaning"
            const parts = line.split(/\s*[-|–\t]\s*/);
            const english = parts[0]?.trim();
            const vietnamese = parts[1]?.trim() || "";

            if (!english) {
                errors.push(`Invalid: "${line}"`);
                continue;
            }

            try {
                const res = await fetch("/api/anki/words", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ english, vietnamese, level: "A1" }),
                });
                const data = await res.json();
                if (data.word && res.status !== 409) {
                    added++;
                } else if (res.status === 409) {
                    skipped++;
                } else {
                    errors.push(`${english}: ${data.error || "failed"}`);
                }
            } catch {
                errors.push(`${english}: network error`);
            }
        }

        setResult({ added, skipped, errors });
        setImporting(false);

        if (added > 0) {
            setToast(`Imported ${added} words! +${added * 2} EXP`);
            setTimeout(() => setToast(null), 4000);
        }
    };

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
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

            <div
                className="animate-fade-in-up"
                style={{ marginBottom: "12px" }}
            >
                <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
                    <span className="gradient-text">Bulk Import Words</span>
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        marginTop: "4px",
                    }}
                >
                    Paste multiple words at once to add to your Anki deck
                </p>
            </div>

            {/* Format Help */}
            <div
                className="glass-card animate-fade-in-up"
                style={{
                    padding: "12px",
                    marginBottom: "10px",
                    animationDelay: "0.05s",
                }}
            >
                <h3
                    style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        margin: "0 0 6px 0",
                        color: "var(--cyan)",
                    }}
                >
                    Supported Formats
                </h3>
                <div
                    style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        lineHeight: 1.8,
                    }}
                >
                    <code
                        style={{
                            background: "var(--bg-raised)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                        }}
                    >
                        word - meaning
                    </code>
                    <br />
                    <code
                        style={{
                            background: "var(--bg-raised)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                        }}
                    >
                        word | meaning
                    </code>
                    <br />
                    <code
                        style={{
                            background: "var(--bg-raised)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                        }}
                    >
                        word (no meaning)
                    </code>
                </div>
            </div>

            {/* Text Input */}
            <div
                className="glass-card animate-fade-in-up"
                style={{
                    padding: "16px",
                    marginBottom: "10px",
                    animationDelay: "0.1s",
                }}
            >
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`resilient - kiên cường\nprocrastinate - trì hoãn\ncoherent - mạch lạc\nambiguous - mơ hồ\nthoroughly - kỹ lưỡng`}
                    style={{
                        width: "100%",
                        minHeight: "200px",
                        background: "transparent",
                        border: "none",
                        color: "var(--text-primary)",
                        fontSize: "16px",
                        lineHeight: "1.8",
                        resize: "vertical",
                        outline: "none",
                        fontFamily: "var(--font-mono)",
                    }}
                />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: "8px",
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                    }}
                >
                    <span
                        style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                        }}
                    >
                        {
                            text
                                .trim()
                                .split("\n")
                                .filter((l) => l.trim()).length
                        }{" "}
                        words detected
                    </span>
                    <button
                        onClick={() => setText("")}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Import Button */}
            <button
                onClick={handleImport}
                disabled={importing || !text.trim()}
                className="btn-primary"
                style={{
                    width: "100%",
                    fontSize: "15px",
                    marginBottom: "12px",
                    opacity: !text.trim() ? 0.5 : 1,
                }}
            >
                {importing
                    ? "Importing..."
                    : `Import ${
                          text
                              .trim()
                              .split("\n")
                              .filter((l) => l.trim()).length
                      } Words`}
            </button>

            {/* Results */}
            {result && (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{ padding: "16px" }}
                >
                    <h3
                        style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            margin: "0 0 10px 0",
                        }}
                    >
                        Import Results
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-around",
                            marginBottom: "10px",
                        }}
                    >
                        <div style={{ textAlign: "center" }}>
                            <p
                                style={{
                                    fontSize: "24px",
                                    fontWeight: 800,
                                    color: "var(--emerald)",
                                    margin: 0,
                                }}
                            >
                                {result.added}
                            </p>
                            <p
                                style={{
                                    fontSize: "10px",
                                    color: "var(--text-muted)",
                                    margin: 0,
                                }}
                            >
                                Added
                            </p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p
                                style={{
                                    fontSize: "24px",
                                    fontWeight: 800,
                                    color: "var(--amber)",
                                    margin: 0,
                                }}
                            >
                                {result.skipped}
                            </p>
                            <p
                                style={{
                                    fontSize: "10px",
                                    color: "var(--text-muted)",
                                    margin: 0,
                                }}
                            >
                                Existed
                            </p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p
                                style={{
                                    fontSize: "24px",
                                    fontWeight: 800,
                                    color: "var(--ruby)",
                                    margin: 0,
                                }}
                            >
                                {result.errors.length}
                            </p>
                            <p
                                style={{
                                    fontSize: "10px",
                                    color: "var(--text-muted)",
                                    margin: 0,
                                }}
                            >
                                Errors
                            </p>
                        </div>
                    </div>
                    {result.errors.length > 0 && (
                        <div
                            style={{
                                fontSize: "11px",
                                color: "var(--ruby)",
                                marginTop: "8px",
                            }}
                        >
                            {result.errors.map((e, i) => (
                                <p key={i} style={{ margin: "2px 0" }}>
                                    — {e}
                                </p>
                            ))}
                        </div>
                    )}
                    {result.added > 0 && (
                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                marginTop: "12px",
                            }}
                        >
                            <a
                                href="/anki"
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    textDecoration: "none",
                                    textAlign: "center",
                                }}
                            >
                                Review Now
                            </a>
                            <button
                                onClick={() => {
                                    setText("");
                                    setResult(null);
                                }}
                                className="btn-secondary"
                                style={{ flex: 1 }}
                            >
                                Import More
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Link */}
            <div style={{ textAlign: "center", marginTop: "12px" }}>
                <a
                    href="/anki/add"
                    style={{
                        fontSize: "12px",
                        color: "var(--cyan)",
                        textDecoration: "none",
                    }}
                >
                    ← Add single word
                </a>
            </div>
        </div>
    );
}
