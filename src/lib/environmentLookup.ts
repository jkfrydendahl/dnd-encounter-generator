import environmentsData from "../data/environments.json";
import type { Environment } from "../types";

const environments = environmentsData as Environment[];
const envMap = new Map(environments.map((e) => [e.id, e.tags]));
const envAlignMap = new Map(environments.map((e) => [e.id, e.preferredAlignments ?? []]));

export function getEnvironmentTags(environmentId?: string): string[] {
  if (!environmentId) return [];
  return envMap.get(environmentId) ?? [];
}

export function getEnvironmentAlignments(environmentId?: string): string[] {
  if (!environmentId) return [];
  return envAlignMap.get(environmentId) ?? [];
}
