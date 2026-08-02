import { redirect } from 'next/navigation'

export default function InterventionsRedirectPage() {
  redirect('/impact?tab=interventions')
}
