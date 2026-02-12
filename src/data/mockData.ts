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
}

export interface Organization {
  id: string;
  organization_name: string;
  org_code: string;
  contact_name: string;
  contact_email: string;
  status: "prospect" | "client" | "churned";
  candidates_linked: number;
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
  "https://api.dicebear.com/7.x/personas/svg?seed=chef1",
  "https://api.dicebear.com/7.x/personas/svg?seed=chef2",
  "https://api.dicebear.com/7.x/personas/svg?seed=chef3",
  "https://api.dicebear.com/7.x/personas/svg?seed=manager1",
  "https://api.dicebear.com/7.x/personas/svg?seed=concierge1",
  "https://api.dicebear.com/7.x/personas/svg?seed=server1",
  "https://api.dicebear.com/7.x/personas/svg?seed=bartender1",
  "https://api.dicebear.com/7.x/personas/svg?seed=hostess1",
  "https://api.dicebear.com/7.x/personas/svg?seed=sommelier1",
  "https://api.dicebear.com/7.x/personas/svg?seed=pastry1",
  "https://api.dicebear.com/7.x/personas/svg?seed=frontdesk1",
  "https://api.dicebear.com/7.x/personas/svg?seed=housekeep1",
];

export const mockCandidates: Candidate[] = [
  {
    id: "c1",
    full_name: "Sample Chef John",
    email: "john@demo.com",
    phone: "+44 7700 900001",
    photo_url: avatars[0],
    current_stage: "interview",
    days_in_stage: 3,
    risk_level: "low",
    engagement_score: 92,
    last_contact_date: "2026-02-10",
    referral_source: "LinkedIn",
    current_location: "London, UK",
    desired_location: "Dubai, UAE",
    organization_id: "o1",
    archetype: "lion",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 85, collaboration: 60, precision: 90, adaptability: 70, leadership: 80 },
  },
  {
    id: "c2",
    full_name: "Demo Candidate Maria",
    email: "maria@demo.com",
    phone: "+44 7700 900002",
    photo_url: avatars[1],
    current_stage: "pre_screening",
    days_in_stage: 1,
    risk_level: "low",
    engagement_score: 88,
    last_contact_date: "2026-02-11",
    referral_source: "Indeed",
    current_location: "Paris, France",
    desired_location: "Maldives",
    organization_id: "o1",
    archetype: "whale",
    prescreening_complete: false,
    tribe_viral_scores: { autonomy: 45, collaboration: 92, precision: 78, adaptability: 85, leadership: 55 },
  },
  {
    id: "c3",
    full_name: "Demo Sous Chef Alex",
    email: "alex@demo.com",
    phone: "+44 7700 900003",
    photo_url: avatars[2],
    current_stage: "offer_pending",
    days_in_stage: 5,
    risk_level: "medium",
    engagement_score: 65,
    last_contact_date: "2026-02-07",
    referral_source: "Employee Referral",
    current_location: "Manchester, UK",
    desired_location: "London, UK",
    organization_id: "o2",
    archetype: "falcon",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 70, collaboration: 75, precision: 95, adaptability: 60, leadership: 65 },
  },
  {
    id: "c4",
    full_name: "Sample Concierge Priya",
    email: "priya@demo.com",
    phone: "+44 7700 900004",
    photo_url: avatars[4],
    current_stage: "submitted",
    days_in_stage: 2,
    risk_level: "low",
    engagement_score: 95,
    last_contact_date: "2026-02-11",
    referral_source: "LinkedIn",
    current_location: "Mumbai, India",
    desired_location: "Abu Dhabi, UAE",
    organization_id: "o1",
    archetype: "whale",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 50, collaboration: 95, precision: 80, adaptability: 90, leadership: 60 },
  },
  {
    id: "c5",
    full_name: "Demo Bartender Lucas",
    email: "lucas@demo.com",
    phone: "+44 7700 900005",
    photo_url: avatars[6],
    current_stage: "in_review",
    days_in_stage: 4,
    risk_level: "low",
    engagement_score: 78,
    last_contact_date: "2026-02-09",
    referral_source: "Indeed",
    current_location: "Barcelona, Spain",
    desired_location: "Miami, USA",
    organization_id: "o3",
    archetype: "lion",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 88, collaboration: 55, precision: 72, adaptability: 80, leadership: 75 },
  },
  {
    id: "c6",
    full_name: "Sample Host Emma",
    email: "emma@demo.com",
    phone: "+44 7700 900006",
    photo_url: avatars[7],
    current_stage: "offer_accepted",
    days_in_stage: 1,
    risk_level: "low",
    engagement_score: 98,
    last_contact_date: "2026-02-12",
    referral_source: "Employee Referral",
    current_location: "Sydney, Australia",
    desired_location: "London, UK",
    organization_id: "o2",
    archetype: "whale",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 40, collaboration: 98, precision: 85, adaptability: 92, leadership: 50 },
  },
  {
    id: "c7",
    full_name: "Demo Sommelier Henri",
    email: "henri@demo.com",
    phone: "+44 7700 900007",
    photo_url: avatars[8],
    current_stage: "pre_arrival",
    days_in_stage: 7,
    risk_level: "high",
    engagement_score: 32,
    last_contact_date: "2026-01-28",
    referral_source: "LinkedIn",
    current_location: "Bordeaux, France",
    desired_location: "New York, USA",
    organization_id: "o1",
    archetype: "falcon",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 75, collaboration: 60, precision: 98, adaptability: 55, leadership: 70 },
  },
  {
    id: "c8",
    full_name: "Sample Pastry Chef Yuki",
    email: "yuki@demo.com",
    phone: "+44 7700 900008",
    photo_url: avatars[9],
    current_stage: "active",
    days_in_stage: 30,
    risk_level: "low",
    engagement_score: 90,
    last_contact_date: "2026-02-10",
    referral_source: "Other",
    current_location: "Tokyo, Japan",
    desired_location: "Paris, France",
    organization_id: "o3",
    archetype: "falcon",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 65, collaboration: 70, precision: 99, adaptability: 75, leadership: 55 },
  },
  {
    id: "c9",
    full_name: "Demo Front Desk Aisha",
    email: "aisha@demo.com",
    phone: "+44 7700 900009",
    photo_url: avatars[10],
    current_stage: "interview",
    days_in_stage: 6,
    risk_level: "high",
    engagement_score: 40,
    last_contact_date: "2026-02-01",
    referral_source: "Indeed",
    current_location: "Nairobi, Kenya",
    desired_location: "Dubai, UAE",
    organization_id: "o2",
    archetype: "lion",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 82, collaboration: 65, precision: 70, adaptability: 88, leadership: 90 },
  },
  {
    id: "c10",
    full_name: "Sample Housekeeper Rosa",
    email: "rosa@demo.com",
    phone: "+44 7700 900010",
    photo_url: avatars[11],
    current_stage: "pre_screening",
    days_in_stage: 8,
    risk_level: "medium",
    engagement_score: 55,
    last_contact_date: "2026-02-04",
    referral_source: "Other",
    current_location: "Manila, Philippines",
    desired_location: "Singapore",
    organization_id: "o3",
    archetype: undefined,
    prescreening_complete: false,
  },
  {
    id: "c11",
    full_name: "Demo Executive Chef Carlos",
    email: "carlos@demo.com",
    phone: "+44 7700 900011",
    photo_url: avatars[3],
    current_stage: "submitted",
    days_in_stage: 3,
    risk_level: "low",
    engagement_score: 85,
    last_contact_date: "2026-02-09",
    referral_source: "LinkedIn",
    current_location: "Mexico City, Mexico",
    desired_location: "Las Vegas, USA",
    organization_id: "o1",
    archetype: "lion",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 92, collaboration: 50, precision: 85, adaptability: 65, leadership: 95 },
  },
  {
    id: "c12",
    full_name: "Sample Server Fatima",
    email: "fatima@demo.com",
    phone: "+44 7700 900012",
    photo_url: avatars[5],
    current_stage: "offer_pending",
    days_in_stage: 12,
    risk_level: "high",
    engagement_score: 28,
    last_contact_date: "2026-01-30",
    referral_source: "Indeed",
    current_location: "Cairo, Egypt",
    desired_location: "London, UK",
    organization_id: "o2",
    archetype: "whale",
    prescreening_complete: true,
    tribe_viral_scores: { autonomy: 35, collaboration: 90, precision: 75, adaptability: 80, leadership: 45 },
  },
];

export const mockOrganizations: Organization[] = [
  {
    id: "o1",
    organization_name: "Demo Hotel Group",
    org_code: "demo-hotel",
    contact_name: "James Wilson",
    contact_email: "james@demohotel.com",
    status: "client",
    candidates_linked: 5,
  },
  {
    id: "o2",
    organization_name: "Sample Resort Chain",
    org_code: "sample-resort",
    contact_name: "Sarah Chen",
    contact_email: "sarah@sampleresort.com",
    status: "client",
    candidates_linked: 4,
  },
  {
    id: "o3",
    organization_name: "Demo Boutique Hotels",
    org_code: "demo-boutique",
    contact_name: "Ahmed Hassan",
    contact_email: "ahmed@demoboutique.com",
    status: "prospect",
    candidates_linked: 3,
  },
];
