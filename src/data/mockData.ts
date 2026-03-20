export type CandidateStage =
  | "pre_screening"
  | "submitted"
  | "in_review"
  | "interview"
  | "offer_pending"
  | "offer_accepted"
  | "pre_arrival"
  | "active";

export type RiskLevel = "low" | "medium" | "high";
export type Archetype = "lion" | "whale" | "falcon";

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  photo_url: string;
  current_stage: CandidateStage;
  days_in_stage: number;
  risk_level: RiskLevel;
  engagement_score: number;
  last_contact_date: string;
  referral_source: string;
  current_location: string;
  desired_location: string;
  organization_id: string;
  archetype?: Archetype;
  prescreening_complete: boolean;
  tribe_viral_scores?: {
    autonomy: number;
    collaboration: number;
    precision: number;
    adaptability: number;
    leadership: number;
  };
  career_goal?: string;
  role_title?: string;
}

export interface Organization {
  id: string;
  organization_name: string;
  org_code: string;
  contact_name: string;
  contact_email: string;
  status: "prospect" | "client" | "churned";
  candidates_linked: number;
  health_score?: number;
}

export interface DemoTeamMember {
  id: string;
  full_name: string;
  department: string;
  role: string;
  photo_url: string | null;
  tribe_viral_archetype: Archetype | null;
  years_experience: number;
}

export const STAGE_LABELS: Record<CandidateStage, string> = {
  pre_screening: "Pre-Screening",
  submitted: "Submitted",
  in_review: "In Review",
  interview: "Interview",
  offer_pending: "Offer Pending",
  offer_accepted: "Offer Accepted",
  pre_arrival: "Pre-Arrival",
  active: "Active",
};

export const STAGE_ORDER: CandidateStage[] = [
  "pre_screening",
  "submitted",
  "in_review",
  "interview",
  "offer_pending",
  "offer_accepted",
  "pre_arrival",
  "active",
];

const avatars = [
  "https://api.dicebear.com/7.x/personas/svg?seed=alexmurphy",
  "https://api.dicebear.com/7.x/personas/svg?seed=emmacollins",
  "https://api.dicebear.com/7.x/personas/svg?seed=jamesoconnor",
];

// ─── Ashford Manor Demo Team Members ──────────────────────────
export const mockTeamMembers: DemoTeamMember[] = [
  {
    id: "tm1",
    full_name: "Sarah O'Brien",
    department: "Kitchen",
    role: "Sous Chef",
    photo_url: "https://api.dicebear.com/7.x/personas/svg?seed=sarahobrien",
    tribe_viral_archetype: "whale",
    years_experience: 3,
  },
  {
    id: "tm2",
    full_name: "Tom Burke",
    department: "Front of House",
    role: "FOH Supervisor",
    photo_url: "https://api.dicebear.com/7.x/personas/svg?seed=tomburke",
    tribe_viral_archetype: "lion",
    years_experience: 5,
  },
  {
    id: "tm3",
    full_name: "Mary Doyle",
    department: "Housekeeping",
    role: "Head Housekeeper",
    photo_url: "https://api.dicebear.com/7.x/personas/svg?seed=marydoyle",
    tribe_viral_archetype: "falcon",
    years_experience: 7,
  },
];

// ─── Ashford Manor Demo Candidates ────────────────────────────
export const mockCandidates: Candidate[] = [
  {
    id: "c1",
    full_name: "Alex Murphy",
    email: "alex.murphy@demo.com",
    phone: "+353 87 123 4567",
    photo_url: avatars[0],
    current_stage: "submitted",
    days_in_stage: 2,
    risk_level: "high",
    engagement_score: 100,
    last_contact_date: "2026-02-14",
    referral_source: "LinkedIn",
    current_location: "Dublin, Ireland",
    desired_location: "Kildare, Ireland",
    organization_id: "o1",
    archetype: "lion",
    prescreening_complete: true,
    role_title: "Head Chef",
    career_goal: "Executive Chef within 2 years",
    tribe_viral_scores: {
      autonomy: 85,
      collaboration: 45,
      precision: 70,
      adaptability: 60,
      leadership: 92,
    },
  },
  {
    id: "c2",
    full_name: "Emma Collins",
    email: "emma.collins@demo.com",
    phone: "+353 86 234 5678",
    photo_url: avatars[1],
    current_stage: "interview",
    days_in_stage: 3,
    risk_level: "low",
    engagement_score: 100,
    last_contact_date: "2026-02-13",
    referral_source: "Indeed",
    current_location: "Cork, Ireland",
    desired_location: "Kildare, Ireland",
    organization_id: "o1",
    archetype: "whale",
    prescreening_complete: true,
    role_title: "Front of House Manager",
    career_goal: "Hotel GM within 3 years",
    tribe_viral_scores: {
      autonomy: 55,
      collaboration: 90,
      precision: 68,
      adaptability: 85,
      leadership: 72,
    },
  },
  {
    id: "c3",
    full_name: "James O'Connor",
    email: "james.oconnor@demo.com",
    phone: "+353 85 345 6789",
    photo_url: avatars[2],
    current_stage: "offer_pending",
    days_in_stage: 1,
    risk_level: "low",
    engagement_score: 80,
    last_contact_date: "2026-02-15",
    referral_source: "Employee Referral",
    current_location: "Galway, Ireland",
    desired_location: "Kildare, Ireland",
    organization_id: "o1",
    archetype: "falcon",
    prescreening_complete: false,
    role_title: "Sous Chef",
    tribe_viral_scores: undefined,
  },
];

// ─── Harrow House Demo Organization ──────────────────────────
export const mockOrganizations: Organization[] = [
  {
    id: "o1",
    organization_name: "The Harrow House Hotel",
    org_code: "harrow-house",
    contact_name: "Claire Hennessy",
    contact_email: "manager@harrowhouse.demo",
    status: "client",
    candidates_linked: 3,
    health_score: 55,
  },
];
