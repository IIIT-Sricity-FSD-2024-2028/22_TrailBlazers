/**
 * Centralized Role-and-Department Dashboard Resolver
 * Returns the authorized destination tab based on user.role and user.department.
 */
export function getDashboardForUser(user) {
  if (!user) return 'landing';

  const role = (user.role || '').toUpperCase();
  const dept = (user.department || '').toUpperCase();

  if (role === 'SUPER_ADMIN') {
    return 'super-admin-space';
  }

  if (role === 'DEPARTMENT_MANAGER') {
    // All department managers use the department manager space,
    // which dynamically filters by their assigned user.department
    return 'department-manager-space';
  }

  if (role === 'IT_SUPPORT') {
    return 'it-support-space';
  }

  if (role === 'EVENT_MANAGER') {
    return 'event-manager-space';
  }

  if (role === 'ONSITE_COORDINATOR') {
    return 'onsite-coordinator-space';
  }

  if (role === 'REVENUE') {
    return 'revenue-space';
  }

  // ATTENDEE / CLIENT
  return 'my-space';
}

/**
 * Checks if a tab/route is a protected area requiring authentication
 */
export function isProtectedRoute(tab) {
  const protectedTabs = [
    'super-admin-space',
    'department-manager-space',
    'it-support-space',
    'event-manager-space',
    'onsite-coordinator-space',
    'revenue-space',
    'analytics-space',
    'dashboard',
    'my-space',
    'create-event',
    'my-tickets'
  ];
  return protectedTabs.includes(tab);
}

/**
 * Checks if a user is staff/admin (non-client)
 */
export function isStaffUser(user) {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  return role !== 'ATTENDEE' && role !== 'CLIENT';
}
