import { WorkspaceShell } from '@/components/workspace-shell';
import { getAuthenticatedUserContext } from '@/lib/auth/authorization';

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session, visibleNavigationGroups, visibleNavigationItemCount } =
    await getAuthenticatedUserContext();

  return (
    <WorkspaceShell
      session={session}
      navigationGroups={visibleNavigationGroups}
      navigationItemCount={visibleNavigationItemCount}
    >
      {children}
    </WorkspaceShell>
  );
}
