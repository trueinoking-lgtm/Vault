import { OwnerShell } from '@/components/layout/OwnerShell'

// TODO: Beta B adds owner-route hardening around the extracted owner command room.
// This is still NOT production-grade RBAC. Follow-up authorization work should
// introduce explicit roles for at least owner and learner, then later teacher
// and school_admin, with server-side authorization enforcement.
export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <OwnerShell>{children}</OwnerShell>
}
