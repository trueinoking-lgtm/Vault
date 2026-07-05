'use client'

import { useState } from 'react'
import { Building2, Loader2, Plus, RefreshCw } from 'lucide-react'

import { useSchools, useCreateSchool, useUpdateSchool } from '@/lib/hooks/use-schools'
import { useTranslation } from '@/lib/hooks/use-translation'
import type { SchoolResponse } from '@/lib/types/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OwnerSchoolsPage() {
  const { t } = useTranslation()
  const { data: schools, isLoading, isError, refetch } = useSchools()
  const createSchool = useCreateSchool()
  const updateSchool = useUpdateSchool()

  const [showCreate, setShowCreate] = useState(false)
  const [editingSchool, setEditingSchool] = useState<SchoolResponse | null>(null)

  // Create form state
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createDescription, setCreateDescription] = useState('')

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const handleCreate = async () => {
    if (!createName.trim() || !createSlug.trim()) return
    await createSchool.mutateAsync({
      name: createName.trim(),
      slug: createSlug.trim(),
      description: createDescription.trim() || undefined,
    })
    setShowCreate(false)
    setCreateName('')
    setCreateSlug('')
    setCreateDescription('')
  }

  const handleEdit = async () => {
    if (!editingSchool) return
    await updateSchool.mutateAsync({
      id: editingSchool.id,
      data: {
        name: editName.trim() || undefined,
        slug: editSlug.trim() || undefined,
        description: editDescription.trim() || undefined,
      },
    })
    setEditingSchool(null)
  }

  const openEdit = (school: SchoolResponse) => {
    setEditName(school.name)
    setEditSlug(school.slug)
    setEditDescription(school.description ?? '')
    setEditingSchool(school)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Owner / Schools
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              {t('schools.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t('schools.description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t('schools.createSchool')}
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-400">{t('schools.loadError')}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              {t('common.retryConnection')}
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && schools?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 dark:border-slate-700">
            <Building2 className="mb-3 h-10 w-10 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('schools.noSchools')}</p>
            <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t('schools.createSchool')}
            </Button>
          </div>
        )}

        {/* School list */}
        {!isLoading && !isError && schools && schools.length > 0 && (
          <div className="grid gap-4">
            {schools.map((school) => (
              <div
                key={school.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                      <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                        {school.name}
                      </h2>
                      {!school.active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800">
                          inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {school.slug}
                    </p>
                    {school.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {school.description}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(school)}>
                    {t('common.edit')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('schools.createSchool')}</DialogTitle>
              <DialogDescription>{t('schools.createDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">{t('schools.name')}</Label>
                <Input
                  id="create-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Zimbabwe High School"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">{t('schools.slug')}</Label>
                <Input
                  id="create-slug"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                  placeholder="e.g. zimbabwe-high"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-desc">{t('schools.descLabel')}</Label>
                <Input
                  id="create-desc"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder={t('common.optional')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!createName.trim() || !createSlug.trim() || createSchool.isPending}
              >
                {createSchool.isPending ? t('common.creating') : t('common.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editingSchool} onOpenChange={(open) => !open && setEditingSchool(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('schools.editSchool')}</DialogTitle>
              <DialogDescription>{t('schools.editDescription')}</DialogDescription>
            </DialogHeader>
            {editingSchool && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('schools.name')}</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">{t('schools.slug')}</Label>
                  <Input
                    id="edit-slug"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-desc">{t('schools.description')}</Label>
                  <Input
                    id="edit-desc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={t('common.optional')}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSchool(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleEdit}
                disabled={updateSchool.isPending}
              >
                {updateSchool.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
