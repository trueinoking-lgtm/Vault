export type BackendSourceStatus = 'new' | 'queued' | 'running' | 'completed' | 'failed'
export type LearnerSourceStatus = 'preparing' | 'building' | 'ready' | 'failed'

export function normalizeBackendSourceStatus(
  rawStatus: unknown,
  hasCommandId = false
): BackendSourceStatus {
  if (
    rawStatus === 'new' ||
    rawStatus === 'queued' ||
    rawStatus === 'running' ||
    rawStatus === 'completed' ||
    rawStatus === 'failed'
  ) {
    return rawStatus
  }

  return hasCommandId ? 'new' : 'completed'
}

export function mapBackendSourceStatusToLearnerStatus(
  status: BackendSourceStatus
): LearnerSourceStatus {
  switch (status) {
    case 'new':
    case 'queued':
      return 'preparing'
    case 'running':
      return 'building'
    case 'failed':
      return 'failed'
    case 'completed':
    default:
      return 'ready'
  }
}

export function isProcessingSourceStatus(status: BackendSourceStatus): boolean {
  return status === 'new' || status === 'queued' || status === 'running'
}
