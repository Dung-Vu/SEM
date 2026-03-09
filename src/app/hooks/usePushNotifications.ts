"use client";
// usePushNotifications — Phase 12.5
// Handles permission request, SW subscription, and API registration
import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return view;
}

export type PushStatus = "unsupported" | "default" | "granted" | "denied" | "subscribed";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("default");
  const [loading, setLoading] = useState(false);

  // Check current status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      const permission = Notification.permission;
      if (permission === "denied") { setStatus("denied"); return; }

      const sub = await reg.pushManager.getSubscription();
      if (sub) setStatus("subscribed");
      else if (permission === "granted") setStatus("granted");
      else setStatus("default");
    });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator)) return false;
    setLoading(true);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setLoading(false);
        return false;
      }

      // Register SW (may already be registered by Next.js)
      const reg = await navigator.serviceWorker.ready;

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      const json = sub.toJSON();
      const { endpoint, keys } = json;

      // Save to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          p256dh: keys?.p256dh,
          auth: keys?.auth,
        }),
      });

      setStatus("subscribed");
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      setLoading(false);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator)) return false;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        // Remove from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      setStatus("granted");
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      setLoading(false);
      return false;
    }
  }, []);

  return { status, loading, subscribe, unsubscribe };
}
