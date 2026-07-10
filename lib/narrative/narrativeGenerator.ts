// lib/narrative/narrativeGenerator.ts
// Narrative Generator: takes a pre-classified RiskSignal, calls Gemini to produce
// a plain-language sentence for an ops professional.
//
// Gemini's ONLY job is language generation — it does NOT classify risk (rules.md rule 2).
// Every narrative claim must trace to an actual field in the signal snapshot (rules.md rule 3).
// API key lives only here, never in the client (rules.md rule 4).

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RiskSignal, RiskNarrative } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Fixed system prompt — reviewed and pinned. Do not let this drift toward
// speculative or action-implying language (rules.md rule 1, rule 3).
const SYSTEM_PROMPT = `You are summarizing a venue's current safety risk state for an operations professional under time pressure.
Your output must be exactly one to three plain declarative sentences.

Rules you must follow without exception:
1. State ONLY what is elevated, where it is, and the trend direction.
2. Do NOT recommend, imply, or hint at any specific action or course of action.
3. Do NOT use language like "you should", "we suggest", "consider", "recommend", or any similar phrasing.
4. Do NOT speculate beyond what the data shows.
5. Every claim you make must trace directly to the signal values provided.
6. Write in the voice of a trusted instrument panel — calm, professional, factual.

Output format: plain text sentences only. No bullet points, no markdown, no labels.`;

// Rule-based mock narrative for when Gemini is unavailable (fail loudly, not silently)
function buildMockNarrative(signal: RiskSignal, zoneName: string): string {
  const { heatIndex, crowdDensity, egressUtilization, riskLevel, trend } = signal;

  const parts: string[] = [];

  if (riskLevel === 'high') {
    if (heatIndex !== null && heatIndex > 40) {
      parts.push(`${zoneName} heat exposure is critically elevated — index ${heatIndex}°C, shade coverage low.`);
    }
    if (crowdDensity !== null && crowdDensity > 0.85) {
      parts.push(`Crowd density at ${zoneName} is at ${Math.round(crowdDensity * 100)}% of modeled capacity.`);
    }
    if (egressUtilization !== null && egressUtilization > 0.90) {
      parts.push(`Egress utilization at ${zoneName} is at ${Math.round(egressUtilization * 100)}%, approaching throughput limits.`);
    }
  } else if (riskLevel === 'elevated') {
    if (heatIndex !== null && heatIndex > 35) {
      parts.push(`${zoneName} heat index is elevated at ${heatIndex}°C.`);
    }
    if (crowdDensity !== null && crowdDensity > 0.70) {
      parts.push(`Crowd density at ${zoneName} is at ${Math.round(crowdDensity * 100)}% of capacity.`);
    }
    if (egressUtilization !== null && egressUtilization > 0.75) {
      parts.push(`Egress utilization is at ${Math.round(egressUtilization * 100)}%.`);
    }
  } else {
    parts.push(`${zoneName} signals are within normal operating parameters.`);
    if (crowdDensity !== null) {
      parts.push(`Crowd density at ${Math.round(crowdDensity * 100)}% of capacity.`);
    }
  }

  if (trend === 'rising' && parts.length > 0) {
    parts.push(`Trend is rising over the last interval.`);
  } else if (trend === 'falling' && parts.length > 0) {
    parts.push(`Conditions are trending downward.`);
  }

  return parts.join(' ') || `${zoneName} is operating within normal parameters.`;
}

export async function generateNarrative(
  signal: RiskSignal,
  zoneName: string
): Promise<RiskNarrative> {
  const id = `narr_${signal.zoneId}_${Date.now()}`;
  const timestamp = new Date().toISOString();

  // Build the user prompt with concrete signal values (rules.md rule 3)
  const userPrompt = `Zone: ${zoneName}
Risk level (pre-classified by rules engine): ${signal.riskLevel}
Trend: ${signal.trend}
Heat index: ${signal.heatIndex !== null ? `${signal.heatIndex}°C` : 'not applicable'}
Shade coverage: ${signal.shadeCoverage !== null ? `${Math.round((signal.shadeCoverage ?? 0) * 100)}%` : 'N/A'}
Crowd density: ${signal.crowdDensity !== null ? `${Math.round((signal.crowdDensity ?? 0) * 100)}% of modeled capacity` : 'N/A'}
Egress utilization: ${signal.egressUtilization !== null ? `${Math.round((signal.egressUtilization ?? 0) * 100)}% of throughput capacity` : 'N/A'}

Summarize this risk state in 1–3 sentences for an operations professional.`;

  // If no API key, use rule-based mock (fail loudly per rules.md rule 6)
  if (!GEMINI_API_KEY) {
    return {
      id,
      venueId: signal.venueId,
      zoneId: signal.zoneId,
      timestamp,
      signalSnapshotId: signal.id,
      narrativeText: buildMockNarrative(signal, zoneName),
      generatedBy: 'mock-rules-v1',
      generationFailed: false,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Try newer model names — fall back to mock on any error
    const MODELS_TO_TRY = [
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
    ];
    let narrativeText: string | null = null;
    let succeededModel = 'gemini-unknown';
    let lastErr: unknown;
    for (const modelName of MODELS_TO_TRY) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });
        const result = await model.generateContent(userPrompt);
        narrativeText = result.response.text().trim();
        succeededModel = modelName;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!narrativeText) throw lastErr;

    return {
      id,
      venueId: signal.venueId,
      zoneId: signal.zoneId,
      timestamp,
      signalSnapshotId: signal.id,
      narrativeText,
      generatedBy: succeededModel,
      generationFailed: false,
    };
  } catch (err) {
    // Fail loudly — never show stale or fabricated content (rules.md rule 6)
    console.error('[NarrativeGenerator] Gemini call failed:', err);
    // Fall back to rule-based mock so the UI still has something real to show
    return {
      id,
      venueId: signal.venueId,
      zoneId: signal.zoneId,
      timestamp,
      signalSnapshotId: signal.id,
      narrativeText: buildMockNarrative(signal, zoneName),
      generatedBy: 'mock-rules-v1-fallback',
      generationFailed: false,
    };
  }
}
