'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { IMPACT_TABS, type ImpactTabId } from '@/lib/impact/product-navigation'
import OverviewPanel from '@/components/impact/panels/OverviewPanel'
import SchoolsPanel from '@/components/impact/panels/SchoolsPanel'
import ClassesPanel from '@/components/impact/panels/ClassesPanel'
import AssessmentsPanel from '@/components/impact/panels/AssessmentsPanel'
import InterventionsPanel from '@/components/impact/panels/InterventionsPanel'
import ReportsPanel from '@/components/impact/panels/ReportsPanel'
import StakeholderPanel from '@/components/impact/panels/StakeholderPanel'

export default function ImpactTabs() {
  const [activeTab, setActiveTab] = useState<ImpactTabId>('overview')
  const reduce = useReducedMotion()

  const applyTabFromUrl = () => {
    const requested = new URLSearchParams(window.location.search).get('tab')
    setActiveTab(IMPACT_TABS.some((item) => item.id === requested)
      ? (requested as ImpactTabId)
      : 'overview')
  }

  useEffect(() => {
    applyTabFromUrl()
    window.addEventListener('popstate', applyTabFromUrl)
    return () => window.removeEventListener('popstate', applyTabFromUrl)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [activeTab, reduce])

  const selectTab = (tab: ImpactTabId) => {
    setActiveTab(tab)
    window.history.replaceState(null, '', `${window.location.pathname}?tab=${tab}`)
  }
  const panel = activeTab === 'overview' ? <OverviewPanel onSelectTab={selectTab} />
    : activeTab === 'schools' ? <SchoolsPanel />
      : activeTab === 'classes' ? <ClassesPanel />
        : activeTab === 'assessments' ? <AssessmentsPanel />
          : activeTab === 'interventions' ? <InterventionsPanel />
            : activeTab === 'reports' ? <ReportsPanel />
              : <StakeholderPanel />

  return (
    <div className="flex min-w-0 flex-col gap-5 lg:flex-row">
      <div role="tablist" aria-label="Impact dashboard sections" className="flex shrink-0 gap-2 overflow-x-auto rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 lg:w-16 lg:flex-col lg:items-center lg:overflow-visible lg:py-3">
        {IMPACT_TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              id={`impact-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`impact-panel-${id}`}
              title={label}
              onClick={() => selectTab(id)}
              className={`group relative flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] lg:w-11 lg:px-0 ${active ? 'text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] hover:text-[var(--text-primary)]'}`}
            >
              {active && <motion.span layoutId="impact-active-nav" transition={reduce ? { duration: 0 } : { duration: .22 }} className="absolute inset-0 rounded-xl bg-[var(--accent-primary)]" />}
              <Icon aria-hidden className="relative z-10 size-5" strokeWidth={1.8} />
              <span className="relative z-10 text-xs font-medium lg:sr-only">{label}</span>
            </button>
          )
        })}
      </div>

      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            id={`impact-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`impact-tab-${activeTab}`}
            tabIndex={0}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: .99 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: .99 }}
            transition={{ duration: reduce ? .15 : .34, ease: [0.22, 1, 0.36, 1] }}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            {panel}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
