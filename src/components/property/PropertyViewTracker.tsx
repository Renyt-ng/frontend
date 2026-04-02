"use client";

import { useEffect } from "react";
import { useTrackPropertyView } from "@/lib/hooks";

const PROPERTY_VIEW_SESSION_STORAGE_KEY = "renyt:property-view-session-id";

function getTrackedViewKey(propertyId: string) {
  return `renyt:property-viewed:${propertyId}`;
}

function getOrCreateSessionId() {
  const existing = window.sessionStorage.getItem(PROPERTY_VIEW_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextValue =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `session-${Date.now()}`;

  window.sessionStorage.setItem(PROPERTY_VIEW_SESSION_STORAGE_KEY, nextValue);
  return nextValue;
}

interface PropertyViewTrackerProps {
  propertyId: string;
}

export function PropertyViewTracker({ propertyId }: PropertyViewTrackerProps) {
  const trackPropertyView = useTrackPropertyView();

  useEffect(() => {
    if (!propertyId || typeof window === "undefined") {
      return;
    }

    const trackedKey = getTrackedViewKey(propertyId);
    if (window.sessionStorage.getItem(trackedKey)) {
      return;
    }

    const sessionId = getOrCreateSessionId();
    window.sessionStorage.setItem(trackedKey, "pending");
    let active = true;

    void trackPropertyView
      .mutateAsync({
        propertyId,
        data: { session_id: sessionId },
      })
      .then(() => {
        if (active) {
          window.sessionStorage.setItem(trackedKey, "tracked");
        }
      })
      .catch(() => {
        if (active) {
          window.sessionStorage.removeItem(trackedKey);
        }
      });

    return () => {
      active = false;
    };
  }, [propertyId, trackPropertyView]);

  return null;
}