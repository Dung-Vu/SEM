"use client";

interface StatItem {
    key: string;
    label: string;
    value: number;
}

interface Props {
    statItems: StatItem[];
}

export function SkillsBlock({ statItems }: Props) {
    return (
        <div
            className="dark-card animate-fade-in-up stagger-2"
            style={{ padding: "18px", marginBottom: "12px" }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                    }}
                >
                    Skills
                </h3>
                <a
                    href="/stats/weekly"
                    style={{
                        fontSize: "12px",
                        color: "var(--gold)",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontFamily: "var(--font-body)",
                    }}
                >
                    Update →
                </a>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                {statItems.map((stat) => (
                    <div key={stat.key}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "5px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "13px",
                                    color: "var(--text-secondary)",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {stat.label}
                            </span>
                            <span
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "var(--gold)",
                                }}
                            >
                                {stat.value}/10
                            </span>
                        </div>
                        <div className="stat-bar-container">
                            <div
                                className="stat-bar-fill"
                                style={{
                                    width: `${stat.value * 10}%`,
                                    backgroundColor: "var(--gold)",
                                    boxShadow: "0 0 8px var(--gold-glow)",
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
