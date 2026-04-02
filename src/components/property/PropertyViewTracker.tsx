"use client";

import { useEffect } from "react";
import { useTrackPropertyView } from "@/lib/hooks";

const PROPERTY_VIEW_SESSION_STORAGE_KEY = "renyt:property-view-session-id";
const PROPERTY_VIEW_PENDING_TTL_MS = 30_000;

function getTrackedViewKey(propertyId: string) {
  return `renyt:property-viewed:${propertyId}`;
}

function hasFreshPendingViewAttempt(value: string | null) {
  if (!value?.startsWith("pending:")) {
    return false;
  }

  const startedAt = Number(value.slice("pending:".length));
  if (!Number.isFinite(startedAt)) {
    return false;
  }

  return Date.now() - startedAt < PROPERTY_VIEW_PENDING_TTL_MS;
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
    const currentStatus = window.sessionStorage.getItem(trackedKey);
    if (currentStatus === "tracked" || hasFreshPendingViewAttempt(currentStatus)) {
      return;
    }

    const sessionId = getOrCreateSessionId();
    const attemptToken = `pending:${Date.now()}`;
    window.sessionStorage.setItem(trackedKey, attemptToken);

    void trackPropertyView
      .mutateAsync({
        propertyId,
        data: { session_id: sessionId },
      })
      .then(() => {
        if (window.sessionStorage.getItem(trackedKey) === attemptToken) {
          window.sessionStorage.setItem(trackedKey, "tracked");
        }
      })
      .catch(() => {
        if (window.sessionStorage.getItem(trackedKey) === attemptToken) {
          window.sessionStorage.removeItem(trackedKey);
        }
      });
  }, [propertyId, trackPropertyView]);

  return null;
}