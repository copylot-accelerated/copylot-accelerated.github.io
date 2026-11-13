/**
 * Measured values transcribed from the archived annual benchmark matrix.
 * Source: benchmarks/results/annual-benchmark-matrix.csv in the source
 * repository. Do not round these inputs; presentation helpers round only for
 * display, and ratios are computed from the unrounded wall times.
 */

export type BenchmarkMode = "original" | "refactored" | "multicore" | "cuda";

export interface BenchmarkRow {
  mode: BenchmarkMode;
  label: string;
  tag: string;
  totalWallSeconds: number;
  evaluationStatesPerSecond: number;
}

export interface BenchmarkCase {
  rows: BenchmarkRow[];
}

export const commercialAnnual: BenchmarkCase = {
  rows: [
    {
      mode: "original",
      label: "Original SolarPILOT/CoPylot",
      tag: "1 state · 1 thread",
      totalWallSeconds: 71212.64473257028,
      evaluationStatesPerSecond: 0.06182942604894084,
    },
    {
      mode: "refactored",
      label: "Refactored CPU",
      tag: "1 state · 1 thread",
      totalWallSeconds: 31154.606479875743,
      evaluationStatesPerSecond: 0.14133020544836605,
    },
    {
      mode: "multicore",
      label: "Multicore CPU",
      tag: "24 states · 1 thread each",
      totalWallSeconds: 2586.206597821787,
      evaluationStatesPerSecond: 1.706712456668709,
    },
    {
      mode: "cuda",
      label: "CUDA GPU",
      tag: "24 rolling contexts",
      totalWallSeconds: 511.92732851207256,
      evaluationStatesPerSecond: 8.723445565482578,
    },
  ],
};

export function speedupOverOriginal(
  benchmark: BenchmarkCase,
  row: BenchmarkRow,
): number {
  const original = benchmark.rows.find((candidate) => candidate.mode === "original");
  if (!original) return 1;
  return original.totalWallSeconds / row.totalWallSeconds;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, "0")} min`;
  }
  return `${minutes} min ${String(Math.floor(seconds % 60)).padStart(2, "0")} s`;
}

export function formatThroughput(statesPerSecond: number): string {
  return `${statesPerSecond.toFixed(3)} states/s`;
}

export function formatSpeedup(value: number): string {
  return `${value.toFixed(2)}×`;
}

export function formatExactSeconds(seconds: number): string {
  return `${seconds.toFixed(6)} s`;
}
