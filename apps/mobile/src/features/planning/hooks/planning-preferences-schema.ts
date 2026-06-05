import { z } from 'zod';

export const PriorityZoneSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radiusKm: z.number().min(0.1).max(50),
});

export const PlanningPreferencesSchema = z.object({
  dayStartMinutes: z.number().min(0).max(23 * 60).default(8 * 60),
  pauseStartMinutes: z.number().min(0).max(23 * 60).default(12 * 60 + 30),
  lunchDurationMinutes: z.number().min(0).max(240).default(30),
  manualModePur: z.boolean().default(false),
  priorityZones: z.array(PriorityZoneSchema).max(3).default([]),
});

export type PlanningPreferences = z.infer<typeof PlanningPreferencesSchema>;
export type PriorityZone = z.infer<typeof PriorityZoneSchema>;

export const DEFAULT_PLANNING_PREFERENCES: PlanningPreferences = {
  dayStartMinutes: 8 * 60,
  pauseStartMinutes: 12 * 60 + 30,
  lunchDurationMinutes: 30,
  manualModePur: false,
  priorityZones: [],
};
