import { OwnerShell } from '@/components/layout/OwnerShell'

// TODO: The owner command room is now structurally separated from the learner shell.
// Production-grade RBAC/auth hardening still needs to be implemented before this shell
// should be treated as a true privileged surface.
export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <OwnerShell>{children}</OwnerShell>
}
