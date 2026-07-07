'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useImpactSchools, useCreateImpactSchool } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Schools Setup Page
 */
export default function ImpactSchoolsPage() {
  const { data: schoolsData, isLoading } = useImpactSchools()
  const createSchool = useCreateImpactSchool()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    province: '',
    school_type: '' as 'primary' | 'secondary' | 'tertiary' | '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    await createSchool.mutateAsync({
      name: formData.name,
      district: formData.district || undefined,
      province: formData.province || undefined,
      school_type: formData.school_type || undefined,
    })

    setFormData({ name: '', district: '', province: '', school_type: '' })
    setShowCreateForm(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/impact" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to Impact Intelligence
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Schools</h1>
          <p className="text-slate-600 mt-1">Manage schools and their settings</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add school
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Create school</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  School name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Zimbabwe High School"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Harare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Province
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Harare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  School type
                </label>
                <select
                  value={formData.school_type}
                  onChange={(e) => setFormData({ ...formData, school_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="tertiary">Tertiary</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSchool.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createSchool.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schools List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {schoolsData?.schools.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No schools yet</h3>
            <p className="text-slate-600 mb-4">Get started by creating your first school</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create school
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {schoolsData?.schools.map((school) => (
              <Link
                key={school.id}
                href={`/impact/school-dashboard?school=${school.id}`}
                className="block p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">{school.name}</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      {[school.district, school.province, school.school_type]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
