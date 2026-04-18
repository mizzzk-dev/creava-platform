const EXPERIMENT_KEY = 'mizzz_experiments_v1'

export interface ExperimentAssignment {
  experimentId: string
  variantId: string
  assignedAt: string
}

function loadAssignments(): Record<string, ExperimentAssignment> {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(EXPERIMENT_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, ExperimentAssignment>
  } catch {
    return {}
  }
}

function saveAssignments(assignments: Record<string, ExperimentAssignment>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(EXPERIMENT_KEY, JSON.stringify(assignments))
}

export function getOrAssignVariant(experimentId: string, variants: string[]): ExperimentAssignment | null {
  if (variants.length === 0) return null

  const assignments = loadAssignments()
  const existing = assignments[experimentId]
  if (existing && variants.includes(existing.variantId)) return existing

  const bucket = Math.floor(Math.random() * variants.length)
  const assignment: ExperimentAssignment = {
    experimentId,
    variantId: variants[bucket],
    assignedAt: new Date().toISOString(),
  }

  assignments[experimentId] = assignment
  saveAssignments(assignments)
  return assignment
}

export function getExperimentVariant(experimentId: string): ExperimentAssignment | null {
  const assignments = loadAssignments()
  return assignments[experimentId] ?? null
}
