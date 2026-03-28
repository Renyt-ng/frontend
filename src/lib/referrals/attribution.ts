const STORAGE_KEY = "renyt:referral-attribution";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

interface StoredReferralAttribution {
  propertyId: string;
  referralCode: string;
  capturedAt: number;
}

type ReferralAttributionStore = Record<string, StoredReferralAttribution>;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readStore(): ReferralAttributionStore {
  if (!canUseStorage()) {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ReferralAttributionStore;
    const now = Date.now();
    const nextStore: ReferralAttributionStore = {};

    Object.entries(parsed).forEach(([propertyId, entry]) => {
      if (now - entry.capturedAt <= MAX_AGE_MS) {
        nextStore[propertyId] = entry;
      }
    });

    if (Object.keys(nextStore).length !== Object.keys(parsed).length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
    }

    return nextStore;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

function writeStore(store: ReferralAttributionStore) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function persistReferralAttribution(
  propertyId: string,
  referralCode: string,
) {
  const normalizedCode = referralCode.trim().toUpperCase();

  if (!normalizedCode) {
    return;
  }

  const store = readStore();
  store[propertyId] = {
    propertyId,
    referralCode: normalizedCode,
    capturedAt: Date.now(),
  };
  writeStore(store);
}

export function getReferralAttribution(propertyId: string) {
  return readStore()[propertyId]?.referralCode ?? null;
}

export function clearReferralAttribution(propertyId: string) {
  const store = readStore();
  delete store[propertyId];
  writeStore(store);
}