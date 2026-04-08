export type NavigationItem = {
  title: string;
  slug: string;
  description: string;
  href: string;
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
      },
      {
        title: 'Invoices',
        slug: 'invoices',
        description:
          'Placeholder view for invoice queues, aging, and approval tasks.',
        href: '/transaction/invoices',
      },
      {
        title: 'Payments',
        slug: 'payments',
        description:
          'Placeholder view for payment monitoring, reconciliation, and issues.',
        href: '/transaction/payments',
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
          'Placeholder view for user lifecycle, status, and ownership.',
        href: '/admin/users',
      },
      {
        title: 'Roles',
        slug: 'roles',
        description:
          'Placeholder view for role definitions, assignments, and policy checks.',
        href: '/admin/roles',
      },
      {
        title: 'Audit Log',
        slug: 'audit-log',
        description:
          'Placeholder view for operational history, traceability, and reviews.',
        href: '/admin/audit-log',
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
