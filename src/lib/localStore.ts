import type { Trip } from "@/hooks/useTrips";

const ACCOUNTS_KEY = "cycle-thrive:accounts";
const CURRENT_USER_KEY = "cycle-thrive:current-user";
const tripsKey = (userId: string) => `cycle-thrive:trips:${userId}`;

export interface LocalUser {
  id: string;
  email: string;
}

interface LocalAccount extends LocalUser {
  password: string;
}

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function getCurrentUser(): LocalUser | null {
  return readJson<LocalUser | null>(CURRENT_USER_KEY, null);
}

export function createLocalAccount(email: string, password: string): LocalUser {
  const normalizedEmail = normalizeEmail(email);
  const accounts = readJson<LocalAccount[]>(ACCOUNTS_KEY, []);

  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error("An account already exists for this email in this browser.");
  }

  const account: LocalAccount = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password,
  };

  writeJson(ACCOUNTS_KEY, [...accounts, account]);
  const user = { id: account.id, email: account.email };
  writeJson(CURRENT_USER_KEY, user);
  return user;
}

export function signInLocalAccount(email: string, password: string): LocalUser {
  const normalizedEmail = normalizeEmail(email);
  const accounts = readJson<LocalAccount[]>(ACCOUNTS_KEY, []);
  const account = accounts.find(
    (candidate) => candidate.email === normalizedEmail && candidate.password === password,
  );

  if (!account) {
    throw new Error("No local account found with that email and password.");
  }

  const user = { id: account.id, email: account.email };
  writeJson(CURRENT_USER_KEY, user);
  return user;
}

export function signOutLocalAccount() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function deleteLocalAccount(userId: string) {
  const accounts = readJson<LocalAccount[]>(ACCOUNTS_KEY, []);
  writeJson(
    ACCOUNTS_KEY,
    accounts.filter((account) => account.id !== userId),
  );
  localStorage.removeItem(tripsKey(userId));
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getLocalTrips(userId: string): Trip[] {
  return readJson<Trip[]>(tripsKey(userId), []).sort((a, b) => b.date.localeCompare(a.date));
}

export function addLocalTrip(userId: string, trip: Omit<Trip, "id">): Trip {
  const trips = getLocalTrips(userId);
  const savedTrip = {
    id: crypto.randomUUID(),
    ...trip,
  };

  writeJson(tripsKey(userId), [savedTrip, ...trips]);
  return savedTrip;
}

export function deleteLocalTrip(userId: string, tripId: string) {
  const trips = getLocalTrips(userId);
  writeJson(
    tripsKey(userId),
    trips.filter((trip) => trip.id !== tripId),
  );
}
