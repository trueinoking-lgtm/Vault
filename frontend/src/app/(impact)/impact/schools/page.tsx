import { redirect } from 'next/navigation'

export default function SchoolsRedirectPage() {
  redirect('/impact?tab=schools')
}
