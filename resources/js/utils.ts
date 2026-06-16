export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    item_created: 'Item Created',
    item_updated: 'Item Updated',
    item_deleted: 'Item Deleted',
    category_created: 'Category Created',
    category_updated: 'Category Updated',
    category_deleted: 'Category Deleted',
    login: 'User Login',
    logout: 'User Logout',
    report_printed: 'Report Printed',
    impersonation_started: 'Impersonation Started',
    impersonation_ended: 'Impersonation Ended',
    user_created: 'User Created',
    user_updated: 'User Updated',
    user_deleted: 'User Deleted',
  };
  return labels[action] || action.replace(/_/g, ' ');
}
