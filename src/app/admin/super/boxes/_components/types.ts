// Shape extendido de PlatformBoxRow con planName (campo SaaS que se agrega en listAllBoxesCrossTenant)
// @mock shape: PlatformBoxRow + { planName: string | null }
export type SuperBoxRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string;
  subscriptionStatus: string;
  ownerEmail: string | null;
  athleteCount: number;
  userCount: number;
  planName: string | null;
  createdAt: string; // ISO string (los fixtures usan string, el server action usará Date serializada)
};

export type MockState = "positive" | "negative" | "neutral";
