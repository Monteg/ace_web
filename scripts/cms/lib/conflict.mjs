export function detectRevisionConflict(expectedRevision, currentRevision, hasLocalChanges = true) {
  if (!hasLocalChanges || !expectedRevision) return false;
  return String(expectedRevision) !== String(currentRevision ?? '');
}

export function assertRevision(expectedRevision, currentRevision, hasLocalChanges = true) {
  if (detectRevisionConflict(expectedRevision, currentRevision, hasLocalChanges)) {
    throw new Error('CONFLICT: CMS item changed after last Sheet sync. Reload row before saving.');
  }
}
