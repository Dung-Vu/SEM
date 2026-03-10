"use client";
// Phase 18: HERALD — Notification Settings Card
// Drop this inside settings/page.tsx after <PushNotificationCard />

import { useState, useEffect, useCallback } from "react";
import { Bell, Clock, Moon, SkipForward, Zap } from "lucide-react";

interface NotifSettings {
  streakWarning: boolean;
  ankiReminder: boolean;
  questReminder: boolean;
  levelUp: boolean;
  weeklyReport: boolean;
  aiInsight: boolean;
  ankiReminderTime: string;
  questReminderTime: string;
  streakWarningHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  skipIfAlreadyDone: boolean;
  maxPerDay: number;
}

const DEFAULT: NotifSettings = {
  streakWarning: true,
  ankiReminder: true,
  questReminder: true,
  levelUp: true,
  weeklyReport: true,
  aiInsight: true,
  ankiReminderTime: "08:00",
  questReminderTime: "20:00",
  streakWarningHour: 21,
  quietHoursStart: 23,
  quietHoursEnd: 7,
  skipIfAlreadyDone: true,
  maxPerDay: 3,
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 99,
        border: "none",
        cursor: "pointer",
        background: on
          ? "linear-gradient(to right, var(--gold-muted), var(--gold))"
          : "var(--bg-raised)",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        boxShadow: on ? "0 0 8px rgba(245,200,66,0.3)" : "none",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "var(--bg-surface)",
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

function ToggleRow({
  label,
  sublabel,
  on,
  onToggle,
  extra,
}: {
  label: string;
  sublabel: string;
  on: boolean;
  onToggle: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 2px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {label}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            {sublabel}
          </p>
        </div>
        <Toggle on={on} onToggle={onToggle} />
      </div>
      {extra && on && <div style={{ marginTop: 8, paddingLeft: 0 }}>{extra}</div>}
    </div>
  );
}

function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "var(--bg-raised)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        color: "var(--gold)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 10px",
        cursor: "pointer",
        outline: "none",
      }}
    />
  );
}

export function NotificationSettingsCard() {
  const [s, setS] = useState<NotifSettings>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setS(d.settings);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const patch = useCallback(
    (update: Partial<NotifSettings>) => {
      const next = { ...s, ...update };
      setS(next);
      fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      }).catch(() => {});
    },
    [s]
  );

  if (!loaded) return null;

  return (
    <div
      className="glass-card animate-fade-in-up stagger-2"
      style={{ padding: "16px", marginBottom: "12px" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: 99,
            background: "var(--emerald)",
            flexShrink: 0,
          }}
        />
        <Bell size={14} style={{ color: "var(--emerald)" }} />
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          Notification Schedule
        </h3>
      </div>

      {/* Per-type toggles */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <ToggleRow
          label="🔥 Streak Warning"
          sublabel={`Nhắc check-in lúc ${s.streakWarningHour}:00 khi chưa check-in`}
          on={s.streakWarning}
          onToggle={() => patch({ streakWarning: !s.streakWarning })}
        />
        <ToggleRow
          label="📚 Anki Reminder"
          sublabel="Nhắc review cards khi có due"
          on={s.ankiReminder}
          onToggle={() => patch({ ankiReminder: !s.ankiReminder })}
          extra={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={12} style={{ color: "var(--text-muted)" }} />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Giờ nhắc:
              </span>
              <TimeInput
                value={s.ankiReminderTime}
                onChange={(v) => patch({ ankiReminderTime: v })}
              />
            </div>
          }
        />
        <ToggleRow
          label="⚔️ Quest Reminder"
          sublabel="Nhắc hoàn thành quest cuối ngày"
          on={s.questReminder}
          onToggle={() => patch({ questReminder: !s.questReminder })}
          extra={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={12} style={{ color: "var(--text-muted)" }} />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Giờ nhắc:
              </span>
              <TimeInput
                value={s.questReminderTime}
                onChange={(v) => patch({ questReminderTime: v })}
              />
            </div>
          }
        />
        <ToggleRow
          label="🏆 Level Up"
          sublabel="Thông báo ngay khi thăng cấp"
          on={s.levelUp}
          onToggle={() => patch({ levelUp: !s.levelUp })}
        />
        <ToggleRow
          label="📊 Báo cáo tuần"
          sublabel="Mỗi thứ Hai 8:00 sáng"
          on={s.weeklyReport}
          onToggle={() => patch({ weeklyReport: !s.weeklyReport })}
        />
        <div style={{ marginBottom: 0 }}>
          <ToggleRow
            label="🧠 AI Insight (ORACLE)"
            sublabel="Tối đa 1 lần/tuần · Thứ Tư 9:00"
            on={s.aiInsight}
            onToggle={() => patch({ aiInsight: !s.aiInsight })}
          />
        </div>
      </div>

      {/* Smart Settings */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            fontFamily: "var(--font-display)",
            margin: "0 0 10px",
          }}
        >
          Smart Behaviour
        </p>

        <ToggleRow
          label="Bỏ qua nếu đã làm xong"
          sublabel="Không nhắc nếu user đã tự học rồi"
          on={s.skipIfAlreadyDone}
          onToggle={() => patch({ skipIfAlreadyDone: !s.skipIfAlreadyDone })}
        />

        {/* Max per day */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Zap size={12} style={{ color: "var(--text-muted)" }} />
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              Tối đa mỗi ngày
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 5].map((n) => (
              <button
                key={n}
                onClick={() => patch({ maxPerDay: n })}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: 8,
                  border: `1px solid ${s.maxPerDay === n ? "rgba(245,200,66,0.3)" : "transparent"}`,
                  background:
                    s.maxPerDay === n
                      ? "rgba(107,90,42,0.5)"
                      : "var(--bg-raised)",
                  color:
                    s.maxPerDay === n ? "var(--gold)" : "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            thông báo / ngày
          </p>
        </div>
      </div>

      {/* Quiet Hours */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <Moon size={12} style={{ color: "var(--violet)" }} />
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              fontFamily: "var(--font-display)",
            }}
          >
            Giờ yên tĩnh
          </p>
        </div>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          Không gửi thông báo trong khung giờ này
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              Bắt đầu
            </p>
            <select
              value={s.quietHoursStart}
              onChange={(e) =>
                patch({ quietHoursStart: Number(e.target.value) })
              }
              style={{
                background: "var(--bg-raised)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "var(--violet)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 600,
                padding: "4px 8px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
          <SkipForward
            size={14}
            style={{ color: "var(--text-muted)", marginTop: 16 }}
          />
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              Kết thúc
            </p>
            <select
              value={s.quietHoursEnd}
              onChange={(e) =>
                patch({ quietHoursEnd: Number(e.target.value) })
              }
              style={{
                background: "var(--bg-raised)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "var(--violet)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 600,
                padding: "4px 8px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
