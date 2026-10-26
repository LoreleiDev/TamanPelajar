"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * false saat render server dan saat hydration, true sesudahnya. Dipakai komponen yang
 * bercabang pada data yang hanya ada di client (mis. sesi dari /api/auth/session) agar HTML
 * server sama dengan render pertama client. Dievaluasi per komponen, sehingga aman juga
 * untuk komponen di dalam Suspense yang hydrate belakangan.
 */
export const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);
