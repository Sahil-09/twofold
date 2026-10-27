export type Theme = "light" | "dark" | "system";

/** Most wanted first; the string values are the form's values, the order is in lib/priority.ts. */
export type Priority = "dream" | "high" | "essential" | "nice";

export type UserDoc = {
  _id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  theme: Theme;
  /** Absent means on: only an explicit `false` mutes partner activity. */
  notifyPartnerUpdates?: boolean;
  /** Absent means on. Off lets the owner see claims on their own list. */
  surpriseMode?: boolean;
  /** Absent means on. Off hides the paste-a-link bar. */
  autoParse?: boolean;
  /** Watermark for the "new on their list" dot. */
  partnerSeenAt?: Date;
  createdAt: Date;
};

export type SessionDoc = {
  _id: string; // sha256 of the cookie token, so the DB never holds a usable token
  userId: string;
  expiresAt: Date;
};

export type ItemDoc = {
  _id: string;
  ownerId: string;
  url?: string;
  title: string;
  imageUrl?: string;
  price?: { amount: number; currency: string; capturedAt: Date };
  note?: string;
  priority: Priority;
  quantity: number;
  occasion?: { label: string; date?: string };
  targetPrice?: number;
  /** Hidden from the partner and never announced. */
  secret?: boolean;
  alertedAt?: Date;
  status: "wanted" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

export type ClaimDoc = {
  _id: string;
  itemId: string;
  claimantId: string;
  claimedAt: Date;
  boughtAt?: Date;
  archivedAt?: Date;
};

/** Written only for owner-side edits; a claim never produces one. */
export type ActivityDoc = {
  _id: string;
  recipientId: string;
  actorId: string;
  kind: "added" | "updated" | "archived";
  itemId: string;
  title: string;
  at: Date;
  readAt?: Date;
};

export type PushSubDoc = {
  _id: string;
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
};

export type PriceCheckDoc = {
  _id: string;
  itemId: string;
  checkedAt: Date;
  price?: number;
  ok: boolean;
  error?: string;
};
