import { useEffect, useState } from 'react'

interface GitHubProfile {
  login: string
  name: string | null
  bio: string | null
  public_repos: number
  followers: number
  following: number
  html_url: string
}

interface State {
  data: GitHubProfile | null
  loading: boolean
  error: boolean
}

const USERNAME = import.meta.env.VITE_GITHUB_USERNAME as string | undefined

// 静的スタック表示（API非依存）
const MAIN_STACK = ['React', 'TypeScript', 'Node.js', 'Strapi']

export default function GitHubActivityCard() {
  const [state, setState] = useState<State>({ data: null, loading: true, error: false })

  useEffect(() => {
    if (!USERNAME) {
      setState({ data: null, loading: false, error: false })
      return
    }

    let cancelled = false
    fetch(`https://api.github.com/users/${USERNAME}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json() as Promise<GitHubProfile>
      })
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: false })
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, error: true })
      })

    return () => { cancelled = true }
  }, [])

  if (!USERNAME || state.error) return null

  if (state.loading) {
    return (
      <div className="w-full rounded-sm border border-gray-100 dark:border-gray-800 p-4 animate-pulse space-y-3">
        <div className="h-2 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-2 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    )
  }

  const { data } = state
  if (!data) return null

  return (
    <a
      href={data.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-full rounded-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 transition-colors hover:border-gray-300 dark:hover:border-gray-700"
    >
      {/* header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3 fill-current text-gray-300 dark:text-gray-700"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span className="font-mono text-[9px] uppercase tracking-widest text-gray-300 dark:text-gray-700">
            @{data.login}
          </span>
        </div>
        <span className="font-mono text-[9px] text-gray-300 dark:text-gray-700 group-hover:text-gray-500 transition-colors">
          ↗
        </span>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-gray-300 dark:text-gray-700">repos</p>
          <p className="font-mono text-base font-medium text-gray-700 dark:text-gray-300 leading-none">
            {data.public_repos}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-gray-300 dark:text-gray-700">followers</p>
          <p className="font-mono text-base font-medium text-gray-700 dark:text-gray-300 leading-none">
            {data.followers}
          </p>
        </div>
      </div>

      {/* bio (if available) */}
      {data.bio && (
        <p className="mb-3 font-mono text-[10px] leading-relaxed text-gray-400 dark:text-gray-600 line-clamp-2">
          {data.bio}
        </p>
      )}

      {/* main stack */}
      <div className="border-t border-gray-50 dark:border-gray-800 pt-2.5 flex flex-wrap gap-1.5">
        {MAIN_STACK.map((tech) => (
          <span
            key={tech}
            className="font-mono text-[9px] text-gray-300 dark:text-gray-700"
          >
            {tech}
          </span>
        ))}
      </div>
    </a>
  )
}
