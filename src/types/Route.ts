// src/types/Route.ts
import type { Timestamp } from "firebase/firestore";

export type LatLng = { lat: number; lng: number };

export type RouteDoc = {
  name: string;
  originAddress?: string | null;
  destinationAddress?: string | null;
  company?: string | null;
  active: boolean;
  createdBy?: string | null;
  createdAt?: Timestamp | null;
  path?: LatLng[]; // ← polilínea dibujada por el admin
};

export type RouteRow = RouteDoc & { id: string };
