export type NavigationAccess = {
  menuPermissionCode: string;
  requiredPermissionCodes?: string[];
  ownerOrganizationOnly?: boolean;
};

export type NavigationItem = {
  title: string;
  slug: string;
  description: string;
  href: string;
  access: NavigationAccess;
};

export type NavigationGroup = {
  title: string;
  slug: string;
  description: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    title: 'Transaction',
    slug: 'transaction',
    description:
      'Operational views for billing, payment flow, and workspace summaries.',
    items: [
      {
        title: 'Overview',
        slug: 'overview',
        description:
          'High-level transaction metrics, trends, and status indicators.',
        href: '/transaction/overview',
        access: {
          menuPermissionCode: 'MENU_TRANSACTION_OVERVIEW',
        },
      },
      {
        title: 'Invoices',
        slug: 'invoices',
        description:
          'Placeholder view for invoice queues, aging, and approval tasks.',
        href: '/transaction/invoices',
        access: {
          menuPermissionCode: 'MENU_TRANSACTION_INVOICES',
        },
      },
      {
        title: 'Payments',
        slug: 'payments',
        description:
          'Placeholder view for payment monitoring, reconciliation, and issues.',
        href: '/transaction/payments',
        access: {
          menuPermissionCode: 'MENU_TRANSACTION_PAYMENTS',
        },
      },
    ],
  },
  {
    title: 'Admin',
    slug: 'admin',
    description:
      'Administrative views for access control and platform oversight.',
    items: [
      {
        title: 'Users',
        slug: 'users',
        description:
          'Manage organisation-scoped users through maker-checker requests.',
        href: '/admin/users',
        access: {
          menuPermissionCode: 'MENU_ADMIN_USERS',
          requiredPermissionCodes: ['USER_READ'],
        },
      },
      {
        title: 'Organizations',
        slug: 'organization',
        description:
          'Manage organizations through maker-checker requests.',
        href: '/admin/organization',
        access: {
          menuPermissionCode: 'MENU_ADMIN_ORGANIZATION',
          requiredPermissionCodes: ['ORGANIZATION_READ'],
          ownerOrganizationOnly: true,
        },
      },
      {
        title: 'User Group',
        slug: 'user-group',
        description:
          'Manage organisation-scoped user groups through maker-checker requests.',
        href: '/admin/user-group',
        access: {
          menuPermissionCode: 'MENU_ADMIN_USER_GROUP',
          requiredPermissionCodes: ['USER_GROUP_READ'],
        },
      },
      {
        title: 'User Group Permission',
        slug: 'user-group-permission',
        description:
          'Manage organisation-scoped user group permission assignments through maker-checker requests.',
        href: '/admin/user-group-permission',
        access: {
          menuPermissionCode: 'MENU_ADMIN_USER_GROUP_PERMISSION',
          requiredPermissionCodes: ['GROUP_PERMISSION_READ'],
        },
      },
      {
        title: 'User Group Membership',
        slug: 'user-group-membership',
        description:
          'Manage organisation-scoped user group membership assignments through maker-checker requests.',
        href: '/admin/user-group-membership',
        access: {
          menuPermissionCode: 'MENU_ADMIN_USER_GROUP_MEMBERSHIP',
          requiredPermissionCodes: ['GROUP_MEMBERSHIP_READ'],
        },
      },
      {
        title: 'Approval Request',
        slug: 'approval-request',
        description:
          'Review pending and historical approval requests across all resource types.',
        href: '/admin/approval-request',
        access: {
          menuPermissionCode: 'MENU_ADMIN_APPROVAL_REQUEST',
          requiredPermissionCodes: ['APPROVAL_REQUEST_READ'],
        },
      },
      {
        title: 'Audit Log',
        slug: 'audit-log',
        description:
          'Placeholder view for operational history, traceability, and reviews.',
        href: '/admin/audit-log',
        access: {
          menuPermissionCode: 'MENU_ADMIN_AUDIT_LOG',
          requiredPermissionCodes: ['AUDIT_LOG_READ'],
        },
      },
    ],
  },
  {
    title: 'System',
    slug: 'system',
    description:
      'Owner-only platform configuration and lookup maintenance views.',
    items: [
      {
        title: 'System Codes',
        slug: 'system-code',
        description:
          'Manage global lookup codes and approved System Code Values through maker-checker requests.',
        href: '/admin/system-code',
        access: {
          menuPermissionCode: 'MENU_ADMIN_SYSTEM_CODE',
          requiredPermissionCodes: ['SYSTEM_CODE_READ'],
          ownerOrganizationOnly: true,
        },
      },
      {
        title: 'System Properties',
        slug: 'system-property',
        description:
          'Manage owner-only system property sets and their values through maker-checker requests.',
        href: '/admin/system-property',
        access: {
          menuPermissionCode: 'MENU_ADMIN_SYSTEM_PROPERTY',
          requiredPermissionCodes: ['SYSTEM_PROPERTY_READ'],
          ownerOrganizationOnly: true,
        },
      },
    ],
  },
];

export const navigationItemCount = navigationGroups.reduce(
  (count, group) => count + group.items.length,
  0
);

export function findNavigationItem(groupSlug: string, itemSlug: string) {
  const group = navigationGroups.find((entry) => entry.slug === groupSlug);

  if (!group) {
    return null;
  }

  const item = group.items.find((entry) => entry.slug === itemSlug);

  if (!item) {
    return null;
  }

  return { group, item };
}

export function countNavigationItems(groups: NavigationGroup[]) {
  return groups.reduce((count, group) => count + group.items.length, 0);
}
