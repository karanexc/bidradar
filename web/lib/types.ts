export type MatchStatus = "new" | "interested" | "bidding" | "dismissed";

export type Tender = {
  id: string;
  source: string;
  title: string;
  description: string | null;
  buyer: string | null;
  value_amount: number | null;
  currency: string | null;
  deadline: string | null;
  url: string | null;
  cpv_codes: string[];
  regions: string[];
};

export type Match = {
  id: string;
  score: number;
  verdict: "strong" | "possible";
  reasons: string[];
  risks: string[];
  summary: string | null;
  requirements: string[];
  draft: string | null;
  status: MatchStatus;
  created_at: string;
  tenders: Tender | null;
};

export type Profile = {
  id: string;
  email: string | null;
  company_name: string | null;
  description: string | null;
  keywords: string[];
  exclude_keywords: string[];
  regions: string[];
  cpv_prefixes: string[];
  min_value: number | null;
  max_value: number | null;
  onboarded: boolean;
  subscription_status: string;
  trial_ends_at: string;
  stripe_customer_id: string | null;
};

export const UK_REGIONS: { code: string; name: string }[] = [
  { code: "UK", name: "Anywhere in the UK" },
  { code: "UKI", name: "London" },
  { code: "UKJ", name: "South East" },
  { code: "UKK", name: "South West" },
  { code: "UKH", name: "East of England" },
  { code: "UKG", name: "West Midlands" },
  { code: "UKF", name: "East Midlands" },
  { code: "UKE", name: "Yorkshire and the Humber" },
  { code: "UKD", name: "North West" },
  { code: "UKC", name: "North East" },
  { code: "UKL", name: "Wales" },
  { code: "UKM", name: "Scotland" },
  { code: "UKN", name: "Northern Ireland" },
];

export const STATUS_LABELS: Record<MatchStatus, string> = {
  new: "New",
  interested: "Interested",
  bidding: "Bidding",
  dismissed: "Not for us",
};
