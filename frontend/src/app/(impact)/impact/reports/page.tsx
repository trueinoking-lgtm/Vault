import { redirect } from 'next/navigation'

export default function ReportsRedirectPage() {
  redirect('/impact?tab=reports')
}
