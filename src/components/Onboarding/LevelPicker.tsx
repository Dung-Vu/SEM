"use client";

const LEVEL_THEMES: Record<string, { color: string; label: string }> = {
    A1: { color: "var(--cyan)", label: "Beginner" },
    A2: { color: "var(--emerald)", label: "Elementary" },
    B1: { color: "var(--gold)", label: "Intermediate" },
    B2: { color: "var(--violet)", label: "Upper-Inter." },
    C1: { color: "var(--ruby)", label: "Advanced" },
    C2: { color: "var(--gold)", label: "Mastery" },
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const STUDY_OPTIONS = [
    { value: 15, label: "15 min", desc: "Bận" },
    { value: 30, label: "30 min", desc: "Vừa" },
    { value: 60, label: "60 min", desc: "Pro" },
    { value: 90, label: "90 min", desc: "Beast" },
];

interface Props {
    selectedLevel: string;
    studyTime: number;
    onLevelChange: (level: string) => void;
    onStudyTimeChange: (minutes: number) => void;
}

export function LevelPicker({
    selectedLevel,
    studyTime,
    onLevelChange,
    onStudyTimeChange,
}: Props) {
    return (
        <div style={{ marginTop: "16px", width: "100%", maxWidth: "340px" }}>
            {/* Level buttons */}
            <div
                style={{
                    display: "flex",
                    gap: "6px",
                    justifyContent: "center",
                    marginBottom: "14px",
                    flexWrap: "wrap",
                }}
            >
                {LEVELS.map((lv) => {
                    const theme = LEVEL_THEMES[lv];
                    const isSel = selectedLevel === lv;
                    return (
                        <button
                            key={lv}
                            onClick={() => onLevelChange(lv)}
                            style={{
                                padding: "10px 16px",
                                borderRadius: "12px",
                                fontFamily: "var(--font-mono)",
                                fontSize: "14px",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s var(--ease-spring)",
                                border: `2px solid ${isSel ? theme.color : "var(--border-subtle)"}`,
                                background: isSel
                                    ? `${theme.color}18`
                                    : "var(--bg-elevated)",
                                color: isSel
                                    ? theme.color
                                    : "var(--text-muted)",
                                transform: isSel ? "scale(1.05)" : "scale(1)",
                            }}
                        >
                            {lv}
                        </button>
                    );
                })}
            </div>

            {/* Selected level label */}
            {selectedLevel && (
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color:
                            LEVEL_THEMES[selectedLevel]?.color ??
                            "var(--text-muted)",
                        fontWeight: 600,
                        marginBottom: "18px",
                    }}
                >
                    {LEVEL_THEMES[selectedLevel]?.label}
                </p>
            )}

            {/* Study time */}
            <p
                style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "10px",
                }}
            >
                Mỗi ngày bạn học bao lâu?
            </p>
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "center",
                }}
            >
                {STUDY_OPTIONS.map((opt) => {
                    const isSel = studyTime === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => onStudyTimeChange(opt.value)}
                            style={{
                                padding: "10px 14px",
                                borderRadius: "12px",
                                fontFamily: "var(--font-body)",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                textAlign: "center",
                                transition: "all 0.15s var(--ease-spring)",
                                border: `2px solid ${isSel ? "var(--cyan)" : "var(--border-subtle)"}`,
                                background: isSel
                                    ? "rgba(0,212,255,0.1)"
                                    : "var(--bg-elevated)",
                                color: isSel
                                    ? "var(--cyan)"
                                    : "var(--text-muted)",
                                transform: isSel ? "scale(1.05)" : "scale(1)",
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontWeight: 700,
                                }}
                            >
                                {opt.label}
                            </div>
                            <div
                                style={{
                                    fontSize: "9px",
                                    marginTop: "2px",
                                    opacity: 0.7,
                                }}
                            >
                                {opt.desc}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
