/**
 * Client-safe utility for formatting permission names.
 * This file has no server dependencies (no db, pg, etc.) so it can be used in client components.
 */

/**
 * Converts a permission name like "create.Document" or "delete.document-approval"
 * into a human-readable format like "Create Document" or "Delete Document Approval".
 */
export function formatPermissionName(permissionName: string): string {
  if (!permissionName || permissionName === '*' || permissionName === 'manage.all' ||
    permissionName === 'sync.all' || permissionName === 'reset.all') {
    return permissionName;
  }
  const [action, subject] = permissionName.split('.');
  if (!action || !subject) return permissionName;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const formatSubject = (s: string) =>
    s
      .split('-')
      .map(part =>
        part
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
          .join(' ')
      )
      .join(' ');

  return `${capitalize(action)} ${formatSubject(subject)}`;
}
