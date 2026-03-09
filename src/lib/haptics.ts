/**
 * Haptic feedback utility — vibration API for tactile response.
 * Falls back gracefully on devices without vibration support.
 */

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const PATTERNS: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [10, 50, 10],
    warning: [20, 40, 20],
    error: [40, 20, 40],
};

export function haptic(style: HapticStyle = "light"): void {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    try {
        navigator.vibrate(PATTERNS[style]);
    } catch {
        // Silently fail on unsupported devices
    }
}

/**
 * Action → haptic mapping for consistent feedback across the app
 */
export const HAPTIC_MAP = {
    // Navigation
    tab_switch: "light" as HapticStyle,
    modal_open: "light" as HapticStyle,

    // Positive actions
    quest_complete: "success" as HapticStyle,
    checkin_done: "success" as HapticStyle,
    level_up: "heavy" as HapticStyle,
    personal_best: "success" as HapticStyle,
    anki_easy: "light" as HapticStyle,
    anki_good: "light" as HapticStyle,

    // Negative
    anki_again: "medium" as HapticStyle,
    wrong_answer: "medium" as HapticStyle,

    // UI
    button_tap: "light" as HapticStyle,
    card_flip: "light" as HapticStyle,
};
