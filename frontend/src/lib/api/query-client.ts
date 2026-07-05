import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

export const QUERY_KEYS = {
  notebooks: ['notebooks'] as const,
  notebook: (id: string) => ['notebooks', id] as const,
  notes: (notebookId?: string) => ['notes', notebookId] as const,
  note: (id: string) => ['notes', id] as const,
  sources: (notebookId?: string) => ['sources', notebookId] as const,
  sourcesInfinite: (notebookId: string) => ['sources', 'infinite', notebookId] as const,
  source: (id: string) => ['sources', id] as const,
  settings: ['settings'] as const,
  sourceChatSessions: (sourceId: string) => ['source-chat', sourceId, 'sessions'] as const,
  sourceChatSession: (sourceId: string, sessionId: string) => ['source-chat', sourceId, 'sessions', sessionId] as const,
  notebookChatSessions: (notebookId: string) => ['notebook-chat', notebookId, 'sessions'] as const,
  notebookChatSession: (sessionId: string) => ['notebook-chat', 'sessions', sessionId] as const,
  podcastEpisodes: ['podcasts', 'episodes'] as const,
  podcastEpisode: (episodeId: string) => ['podcasts', 'episodes', episodeId] as const,
  episodeProfiles: ['podcasts', 'episode-profiles'] as const,
  speakerProfiles: ['podcasts', 'speaker-profiles'] as const,
  languages: ['languages'] as const,
  vaultRecentSources: (limit: number) => ['vault', 'recentSources', limit] as const,
  vaultRecentNotes: (limit: number) => ['vault', 'recentNotes', limit] as const,

  // Study / review persistence
  studySession: (notebookId: string) => ['study', 'session', notebookId] as const,
  studyReviewQueue: (notebookId?: string) => ['study', 'review-queue', notebookId] as const,

  // Schools
  schools: ['schools'] as const,
  school: (id: string) => ['schools', id] as const,
  schoolMembers: (schoolId: string) => ['schools', schoolId, 'members'] as const,
  schoolClassrooms: (schoolId: string) => ['schools', schoolId, 'classrooms'] as const,
  classroom: (id: string) => ['classrooms', id] as const,
  classroomEnrollments: (classroomId: string) => ['classrooms', classroomId, 'enrollments'] as const,
  classroomAssignments: (classroomId: string) => ['classrooms', classroomId, 'assignments'] as const,

  // Auth / user role
  authMe: ['auth', 'me'] as const,

  // Teacher dashboard
  teacherClasses: ['teacher', 'classes'] as const,
  classProgress: (classroomId: string) => ['teacher', 'classes', classroomId] as const,
  classLearners: (classroomId: string) => ['teacher', 'classes', classroomId, 'learners'] as const,
  classActivity: (classroomId: string) => ['teacher', 'classes', classroomId, 'activity'] as const,

  // Learner assignments (E2.1)
  myAssignments: ['learner', 'assignments'] as const,
}
