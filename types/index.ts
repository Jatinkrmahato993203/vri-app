// types/index.ts — mirrors schema.md exactly
// These types must never silently drift from schema.md (rules.md §7)

export type RiskLevel = 'normal' | 'elevated' | 'high';
export type Trend = 'rising' | 'falling' | 'stable';
export type UserRole = 'ops_director' | 'compliance_officer' | 'insurer' | 'admin';
export type CertificationStatus = 'not_started' | 'in_progress' | 'certified';
export type ZoneType = 'gate' | 'concourse' | 'concession' | 'section';
export type AuditStatus = 'draft' | 'submitted' | 'certified';
export type HazardType = 'heat' | 'crowd' | 'egress';

// schema.md §2
export interface Venue {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  capacity: number;
  hazardProfile: HazardType[];
  certificationStatus: CertificationStatus;
  certificationScore: number | null;
  lastAuditDate: string | null;
}

// schema.md §3
export interface Zone {
  id: string;
  venueId: string;
  name: string;
  type: ZoneType;
  capacityModel: number;
}

// schema.md §4
export interface RiskSignal {
  id: string;
  venueId: string;
  zoneId: string;
  timestamp: string;
  heatIndex: number | null;       // °C
  shadeCoverage: number | null;   // 0–1
  crowdDensity: number | null;    // 0–1 normalized
  egressUtilization: number | null; // 0–1 fraction of capacityModel
  trend: Trend;                   // computed server-side, not by LLM (rules.md rule 2)
  riskLevel: RiskLevel;           // computed by deterministic rules function (rules.md rule 2)
}

// schema.md §5
export interface RiskNarrative {
  id: string;
  venueId: string;
  zoneId: string;
  timestamp: string;
  signalSnapshotId: string;       // traceable to exact riskSignals doc (rules.md rule 3)
  narrativeText: string;
  generatedBy: string;            // model version string
  generationFailed: boolean;      // if true, UI shows "narrative unavailable" (rules.md rule 6)
}

// schema.md §6
export interface CertificationAudit {
  id: string;
  venueId: string;
  date: string;
  rubricScores: {
    crowdFlowDesign: number;
    heatMitigation: number;
    egressCapacity: number;
    staffProtocol: number;
  };
  overallScore: number;
  auditorNotes: string;
  status: AuditStatus;
}

// schema.md §7
export interface BenchmarkAggregate {
  id: string;
  hazardType: HazardType;
  periodId: string;
  anonymizedAverage: number;
  percentileDistribution: { p25: number; p50: number; p75: number };
}

// schema.md §8
export interface AppUser {
  id: string;
  role: UserRole;
  venueAccess: string[];
  displayName: string;
}

// schema.md §9 — read-receipt only, intentionally no agree/disagree/action field (rules.md rule 1)
export interface Acknowledgement {
  id: string;
  userId: string;
  venueId: string;
  zoneId: string;
  narrativeId: string;
  signalSnapshotId: string;   // audit trail — which signal was current at time of ack
  riskLevelAtAck: RiskLevel; // audit trail — captures the risk level seen by the reviewer
  timestamp: string;
}

// Historical signal point for sparklines
export interface SignalHistoryPoint {
  timestamp: string;
  heatIndex: number | null;
  crowdDensity: number | null;
  egressUtilization: number | null;
  riskLevel: RiskLevel;
}

// Combined zone state for UI
export interface ZoneState {
  zone: Zone;
  latestSignal: RiskSignal | null;
  latestNarrative: RiskNarrative | null;
  signalHistory: SignalHistoryPoint[];
  acknowledgedBy: string[];
}

// Rubric item for certification view
export type RubricItemStatus = 'met' | 'not_met' | 'needs_evidence';

export interface RubricItem {
  id: string;
  label: string;
  status: RubricItemStatus;
  notes?: string;
}

export interface CertificationCategory {
  id: string;
  label: string;
  description: string;
  score: number;
  items: RubricItem[];
}
