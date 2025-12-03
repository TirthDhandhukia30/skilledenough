import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { GitHubService } from '../services/githubService'
import { SkillAnalyzer } from '../services/analyzer'
import type { AnalysisResult } from '../types/github'
import { Progress } from '../components/ui/progress'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { cn } from '../lib/utils'
import { getTechIcon } from '../lib/techIcons'

const numberFormatter = new Intl.NumberFormat('en-US')

const formatPercent = (value: number) => `${value.toFixed(1)}%`

const formatDate = (value: string) => {
  const date = new Date(value)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

const markerForIndex = (index: number, length: number) => {
  if (index === 0) return 'Kickoff'
  if (index === length - 1) return 'Latest'
  return 'Milestone'
}

export default function Analysis() {
  const { username } = useParams<{ username: string }>()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [comparison, setComparison] = useState<AnalysisResult | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const isLight = theme === 'light'
  const compareUsername = searchParams.get('compare')?.trim() || ''
  const hasComparison = Boolean(compareUsername)

  useEffect(() => {
    const githubService = new GitHubService()
    const analyzer = new SkillAnalyzer()

    const analyzeGitHub = async () => {
      if (!username) return

      setLoading(true)
      setError(null)
      setCompareError(null)
      setResult(null)
      setComparison(null)
      setProgress(0)

      try {
        setProgress(25)
        const { user, repos, contributions } = await githubService.analyzeUser(username)
        setProgress(hasComparison ? 45 : 70)
        const analysis = analyzer.analyzeRepositories(user, repos, contributions)
        setResult(analysis)
        setProgress(hasComparison ? 60 : 90)

        if (hasComparison) {
          if (compareUsername.toLowerCase() === username.toLowerCase()) {
            setComparison(null)
            setCompareError('Comparison target duplicates the primary username. Choose a different handle.')
            setProgress(95)
          } else {
            try {
              const { user: compareUser, repos: compareRepos, contributions: compareContributions } = await githubService.analyzeUser(compareUsername)
              setProgress(80)
              const compareAnalysis = analyzer.analyzeRepositories(compareUser, compareRepos, compareContributions)
              setComparison(compareAnalysis)
              setProgress(95)
            } catch (compareErr) {
              setComparison(null)
              setCompareError(
                compareErr instanceof Error
                  ? `Comparison failed for ${compareUsername}: ${compareErr.message}`
                  : `Comparison failed for ${compareUsername}`,
              )
            }
          }
        }

        setProgress(100)
        setTimeout(() => {
          setLoading(false)
        }, 220)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze GitHub profile')
        setResult(null)
        setComparison(null)
        setLoading(false)
        setProgress(0)
      }
    }

    analyzeGitHub()
  }, [username, hasComparison, compareUsername])

  if (error) {
    return (
      <div
        className={cn(
          'h-screen overflow-hidden bg-black text-white',
          isLight && 'bg-zinc-50 text-zinc-900',
        )}
      >
        <div className="flex h-full items-center justify-center px-4">
          <div className="max-w-md space-y-6 text-center">
            <h2 className="text-2xl font-bold font-mono tracking-widest">ERROR</h2>
            <p className={cn('text-gray-500', isLight && 'text-zinc-600')}>{error}</p>
            <Link
              to="/"
              className={cn(
                'inline-block px-6 py-3 border border-white/10 bg-zinc-900 text-white transition-all hover:bg-zinc-800 font-mono uppercase tracking-widest',
                isLight && 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100',
              )}
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    const loadingLabel = hasComparison
      ? progress < 25
        ? 'FETCHING_PRIMARY_PROFILE...'
        : progress < 60
        ? 'ANALYZING_PRIMARY_STACK...'
        : progress < 90
        ? 'FETCHING_COMPARISON_PROFILE...'
        : 'ALIGNING_SIGNALS...'
      : progress < 30
      ? 'FETCHING_REPOSITORIES...'
      : progress < 70
      ? 'ANALYZING_STACK...'
      : 'FINALIZING...'

    return (
      <div
        className={cn(
          'h-screen overflow-hidden bg-black text-white',
          isLight && 'bg-zinc-50 text-zinc-900',
        )}
      >
        <div className="flex h-full items-center justify-center px-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-mono tracking-widest mb-2">ANALYZING {username?.toUpperCase()}</h2>
              <p className={cn('text-sm font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-600')}>
                {loadingLabel}
              </p>
            </div>
            <Progress value={progress} className={cn('h-1 bg-zinc-900', isLight && 'bg-zinc-200')} />
          </div>
        </div>
      </div>
    )
  }

  if (!result) return null

  const primaryAnalysis = result

  let pageContent: ReactNode

  if (hasComparison) {
    pageContent = (
      <ComparisonLayout
        primary={primaryAnalysis}
        secondary={comparison}
        compareUsername={compareUsername}
        isLight={isLight}
        compareError={compareError}
      />
    )
  } else {
    const {
      user,
      skillAnalysis,
      highlights,
      activity,
      quality,
      opportunities,
      futurePrediction,
      timeline,
      contributions,
    } = primaryAnalysis

    const timelineMarkers = timeline.map((event, index) => ({
      ...event,
      marker: markerForIndex(index, timeline.length),
    }))

    const mergedActions = Array.from(new Set([...opportunities.recommendations, ...opportunities.nextActions]))

    pageContent = (
      <>
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
            <CardHeader className="flex flex-col gap-6 md:flex-row md:items-center">
              <img
                src={user.avatar_url}
                alt={user.name || user.login}
                className={cn('h-28 w-28 border border-white/10 object-cover transition-colors', isLight && 'border-zinc-200')}
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-black tracking-tight">{user.name || user.login}</h1>
                  <p className={cn('text-sm text-gray-500', isLight && 'text-zinc-600')}>{user.bio}</p>
                </div>
                <div
                  className={cn(
                    'flex flex-wrap gap-4 text-[11px] font-mono uppercase tracking-widest text-gray-500',
                    isLight && 'text-zinc-500',
                  )}
                >
                  <span>{numberFormatter.format(user.public_repos)} repositories</span>
                  <span>{numberFormatter.format(user.followers)} followers</span>
                  <span>{skillAnalysis.accountAge}y on github</span>
                  <span>{skillAnalysis.activeProjects}/{skillAnalysis.totalProjects} active</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-4 flex-1">
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white',
                    isLight && 'text-zinc-500 hover:text-zinc-900',
                  )}
                >
                  View profile ↗
                </a>

                {/* Featured repos */}
                {highlights.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                      {highlights.slice(0, 2).map((highlight) => (
                        <a
                          key={highlight.name}
                          href={highlight.url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            'group flex items-center gap-3 border border-zinc-800/60 bg-black/20 p-3 transition-all hover:border-zinc-700 hover:bg-black/40',
                            isLight && 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'truncate font-semibold text-white group-hover:text-gray-200 transition-colors',
                                isLight && 'text-zinc-900 group-hover:text-zinc-700',
                              )}
                            >
                              {highlight.name}
                            </p>
                            <p className={cn('text-[11px] font-mono text-gray-500', isLight && 'text-zinc-500')}>
                              {numberFormatter.format(highlight.stars)}★ • {numberFormatter.format(highlight.forks)} forks
                              {highlight.primaryLanguage && ` • ${highlight.primaryLanguage}`}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                )}
              </div>
              <CardFooter
                className={cn(
                  'w-full max-w-xs border border-white/10 bg-white/5 text-center transition-colors',
                  isLight && 'border-zinc-200 bg-white text-zinc-900',
                )}
              >
                <div className="space-y-2">
                  <p className={cn('text-[11px] font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                    Experience level
                  </p>
                  <p className="text-3xl font-black">{skillAnalysis.experienceLevel}</p>
                  <p className={cn('text-xs text-gray-500', isLight && 'text-zinc-600')}>
                    Velocity score {activity.velocityScore}/100 • {quality.releaseCadence} cadence
                  </p>
                </div>
              </CardFooter>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'flex flex-col justify-between',
              isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]',
            )}
          >
            <CardHeader>
              <CardTitle>Active cadence</CardTitle>
              <CardDescription>
                Snapshot of update rhythm across public repositories for the last quarter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow label="Pushes (14d)" value={activity.recentPushes} isLight={isLight} />
              <MetricRow label="Active repos (30d)" value={activity.activeLast30Days} isLight={isLight} />
              <MetricRow label="Active repos (90d)" value={activity.activeLast90Days} isLight={isLight} />
              <MetricRow label="Median update interval" value={`${activity.medianUpdateInterval} days`} isLight={isLight} />
              <MetricRow label="Longest quiet streak" value={`${activity.longestQuietStreak} days`} isLight={isLight} />
            </CardContent>
          </Card>
        </div>

        {/* Contributions / PR Activity */}
        {contributions && (contributions.totalPRs > 0 || contributions.recentPRs.length > 0) && (
          <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
            <CardHeader>
              <CardTitle>Pull request activity</CardTitle>
              <CardDescription>Recent PR contributions from the last 90 days of public activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className={cn('border border-zinc-800/60 bg-black/20 p-4 text-center', isLight && 'border-zinc-200 bg-zinc-50')}>
                  <p className="text-3xl font-black">{contributions.totalPRs}</p>
                  <p className={cn('text-[11px] font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                    PRs opened
                  </p>
                </div>
                <div className={cn('border border-zinc-800/60 bg-black/20 p-4 text-center', isLight && 'border-zinc-200 bg-zinc-50')}>
                  <p className="text-3xl font-black">{contributions.mergedPRs}</p>
                  <p className={cn('text-[11px] font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                    Merged
                  </p>
                </div>
                <div className={cn('border border-zinc-800/60 bg-black/20 p-4 text-center', isLight && 'border-zinc-200 bg-zinc-50')}>
                  <p className="text-3xl font-black">{contributions.openPRs}</p>
                  <p className={cn('text-[11px] font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                    Open
                  </p>
                </div>
                <div className={cn('border border-zinc-800/60 bg-black/20 p-4 text-center', isLight && 'border-zinc-200 bg-zinc-50')}>
                  <p className="text-3xl font-black">{contributions.totalIssues}</p>
                  <p className={cn('text-[11px] font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                    Issues
                  </p>
                </div>
              </div>

              {contributions.recentPRs.length > 0 && (
                <div className="space-y-3">
                  <p className={cn('text-[11px] font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                    Recent pull requests
                  </p>
                  <div className="space-y-2">
                    {contributions.recentPRs.map((pr, index) => (
                      <a
                        key={`${pr.repo}-${index}`}
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          'flex items-center gap-3 border border-zinc-800/60 bg-black/20 p-3 transition-all hover:border-zinc-700 hover:bg-black/40',
                          isLight && 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100',
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold',
                            pr.state === 'merged' && 'bg-purple-500/20 text-purple-400',
                            pr.state === 'open' && 'bg-green-500/20 text-green-400',
                            pr.state === 'closed' && 'bg-red-500/20 text-red-400',
                          )}
                        >
                          {pr.state === 'merged' ? '⇄' : pr.state === 'open' ? '○' : '✕'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn('truncate font-medium text-white', isLight && 'text-zinc-900')}>
                            {pr.title}
                          </p>
                          <p className={cn('text-[11px] font-mono text-gray-500', isLight && 'text-zinc-500')}>
                            {pr.repo} • {pr.state}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
          <CardHeader className="space-y-4">
            <CardTitle>Stack depth</CardTitle>
            <CardDescription>
              Core, supporting, and emerging technologies inferred from languages and repository metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <StackGroup label="Core" values={skillAnalysis.stackDepth.core} accent="solid" isLight={isLight} />
            <StackGroup label="Supporting" values={skillAnalysis.stackDepth.supporting} isLight={isLight} />
            <StackGroup label="Emerging" values={skillAnalysis.stackDepth.emerging} isLight={isLight} />

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <p className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                  Primary stack
                </p>
                <IconWall items={skillAnalysis.techStack.primary} isLight={isLight} />
              </div>
              <div className="space-y-4">
                <p className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                  Frameworks & tools
                </p>
                <IconWall
                  items={[...skillAnalysis.techStack.frameworks.slice(0, 8), ...skillAnalysis.techStack.tools.slice(0, 8)]}
                  small
                  isLight={isLight}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                Language mix
              </p>
              <div className="max-w-2xl space-y-3">
                {skillAnalysis.topLanguages.slice(0, 5).map((lang) => (
                  <div key={lang.language} className="space-y-1">
                    <div className={cn('flex items-center justify-between text-xs font-mono text-gray-400', isLight && 'text-zinc-600')}>
                      <span className={cn('text-white transition-colors', isLight && 'text-zinc-900')}>{lang.language}</span>
                      <span>{formatPercent(lang.percentage)}</span>
                    </div>
                    <Progress value={lang.percentage} className={cn('h-1 bg-zinc-900', isLight && 'bg-zinc-200')} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
            <CardHeader>
              <CardTitle>Quality signals</CardTitle>
              <CardDescription>Heuristics-led read on testing, automation, and documentation maturity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QualityBadge label="Testing" value={quality.testing} isLight={isLight} />
              <QualityBadge label="Automation" value={quality.automation} isLight={isLight} />
              <QualityBadge label="Documentation" value={quality.documentation} isLight={isLight} />
              <QualityBadge label="Cadence" value={quality.releaseCadence} isLight={isLight} />
              {quality.notes.length > 0 && (
                <div className={cn('space-y-2 text-xs text-gray-500', isLight && 'text-zinc-600')}>
                  {quality.notes.map((note) => (
                    <p key={note}>• {note}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
            <CardHeader>
              <CardTitle>Repository spotlight</CardTitle>
              <CardDescription>Flagship public work ranked by stars, recency, and stack alignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {highlights.length === 0 && (
                <p className={cn('text-sm text-gray-600', isLight && 'text-zinc-600')}>
                  No public repositories surfaced for spotlight analysis.
                </p>
              )}
              {highlights.map((highlight) => (
                <div
                  key={highlight.name}
                  className={cn(
                    'space-y-2 border border-zinc-800/60 bg-black/30 p-4 transition-colors',
                    isLight && 'border-zinc-200 bg-white',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={highlight.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        'text-lg font-semibold text-white transition-colors hover:text-gray-300',
                        isLight && 'text-zinc-900 hover:text-zinc-600',
                      )}
                    >
                      {highlight.name}
                    </a>
                    <Badge variant="solid" tone={isLight ? 'light' : 'dark'}>{highlight.reason}</Badge>
                  </div>
                  <p className={cn('text-sm text-gray-500', isLight && 'text-zinc-600')}>
                    {highlight.description || 'No description provided'}
                  </p>
                  <div
                    className={cn(
                      'flex flex-wrap gap-3 text-[11px] font-mono uppercase tracking-widest text-gray-500',
                      isLight && 'text-zinc-500',
                    )}
                  >
                    <span>{numberFormatter.format(highlight.stars)} ★</span>
                    <span>{numberFormatter.format(highlight.forks)} forks</span>
                    {highlight.primaryLanguage && <span>{highlight.primaryLanguage}</span>}
                    <span>Updated {formatDate(highlight.lastUpdated)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
          <CardHeader>
            <CardTitle>Trajectory</CardTitle>
            <CardDescription>Key adoption beats mapped across the public GitHub timeline.</CardDescription>
          </CardHeader>
          <CardContent>
            {timelineMarkers.length === 0 ? (
              <p className={cn('text-sm text-gray-500', isLight && 'text-zinc-600')}>No timeline data available.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {timelineMarkers.map((event) => (
                  <div
                    key={`${event.year}-${event.title}`}
                    className={cn(
                      'flex h-full flex-col justify-between gap-3 border border-zinc-800/80 bg-black/30 p-4 transition-colors',
                      isLight && 'border-zinc-200 bg-white',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="solid" tone={isLight ? 'light' : 'dark'}>{event.year}</Badge>
                      <span
                        className={cn(
                          'text-[11px] font-mono uppercase tracking-widest text-gray-500',
                          isLight && 'text-zinc-500',
                        )}
                      >
                        {event.marker}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className={cn('text-lg font-semibold text-white transition-colors', isLight && 'text-zinc-900')}>
                        {event.title}
                      </p>
                      <p className={cn('text-sm text-gray-500', isLight && 'text-zinc-600')}>{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
          <CardHeader>
            <CardTitle>Opportunity radar</CardTitle>
            <CardDescription>Potential fits and next steps grounded in observed stack strengths.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="roles">
              <TabsList>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="industries">Industries</TabsTrigger>
                <TabsTrigger value="actions">Next actions</TabsTrigger>
              </TabsList>
              <TabsContent value="roles" className="mt-4 border-none bg-transparent p-0">
                <div className={cn('space-y-2 text-sm text-gray-400', isLight && 'text-zinc-600')}>
                  {opportunities.jobRoles.length === 0 && <p>No obvious role matches detected yet.</p>}
                  {opportunities.jobRoles.map((role) => (
                    <p key={role}>• {role}</p>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="industries" className="mt-4 border-none bg-transparent p-0">
                <div className={cn('space-y-2 text-sm text-gray-400', isLight && 'text-zinc-600')}>
                  {opportunities.industries.length === 0 && <p>No specific industry signals detected.</p>}
                  {opportunities.industries.map((industry) => (
                    <p key={industry}>• {industry}</p>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="actions" className="mt-4 border-none bg-transparent p-0">
                <div className={cn('space-y-2 text-sm text-gray-400', isLight && 'text-zinc-600')}>
                  {mergedActions.map((item) => (
                    <p key={item}>• {item}</p>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
          <CardHeader>
            <CardTitle>Forward view</CardTitle>
            <CardDescription>Signals, learning paths, and suggested milestones to elevate the portfolio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
                Market demand
              </p>
              <p className="text-4xl font-black">{futurePrediction.marketDemand}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <ListBlock heading="Growth areas" items={futurePrediction.growthAreas} isLight={isLight} />
              <ListBlock heading="Invest next" items={futurePrediction.skillsToLearn.slice(0, 6)} isLight={isLight} />
              <ListBlock heading="Career path" items={futurePrediction.careerPath} isLight={isLight} />
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  const handleThemeToggle = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <div
      className={cn(
        'h-screen overflow-y-auto transition-colors duration-300',
        theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white',
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            to="/"
            className={cn(
              'inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-widest text-gray-600 transition-colors hover:text-white',
              isLight && 'text-zinc-500 hover:text-zinc-900',
            )}
          >
            ← Back to input
          </Link>
          <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
        </div>

        {pageContent}
      </div>
    </div>
  )
}

type MetricRowProps = {
  label: string
  value: string | number
  isLight: boolean
}

const summarizeCoreStack = (analysis: AnalysisResult) => {
  const core = Array.from(new Set(analysis.skillAnalysis.stackDepth.core)).slice(0, 3)
  if (core.length > 0) {
    return core.join(', ')
  }

  const supporting = Array.from(new Set(analysis.skillAnalysis.stackDepth.supporting)).slice(0, 2)
  return supporting.length > 0 ? supporting.join(', ') : 'No dominant stack yet'
}

const summarizeHighlight = (analysis: AnalysisResult) => {
  if (analysis.highlights.length === 0) {
    return 'No spotlight repo yet'
  }

  const top = analysis.highlights[0]
  return `${top.name} (${numberFormatter.format(top.stars)}★)`
}

type ComparisonLayoutProps = {
  primary: AnalysisResult
  secondary: AnalysisResult | null
  compareUsername: string
  isLight: boolean
  compareError: string | null
}

const ComparisonLayout = ({ primary, secondary, compareUsername, isLight, compareError }: ComparisonLayoutProps) => {
  if (!secondary) {
    const message = compareError || `No comparison data available for ${compareUsername}`
    return (
      <Card
        className={cn(
          'border border-red-500/30 bg-red-950/20 text-red-200',
          isLight && 'border-red-200 bg-red-100 text-red-700',
        )}
      >
        <CardHeader>
          <CardTitle>Comparison unavailable</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {compareError && (
        <div
          className={cn(
            'rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300',
            isLight && 'border-red-300 bg-red-100 text-red-700',
          )}
        >
          {compareError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
        <ComparisonCard analysis={primary} heading="Primary profile" isLight={isLight} />
        <ComparisonCard
          analysis={secondary}
          heading={secondary.user.name ? `vs ${secondary.user.name}` : `vs ${secondary.user.login}`}
          isLight={isLight}
        />
        <div className="md:col-span-2 xl:col-span-1">
          <ComparisonTable primary={primary} secondary={secondary} isLight={isLight} />
        </div>
      </div>
    </div>
  )
}

type ComparisonCardProps = {
  analysis: AnalysisResult
  heading: string
  isLight: boolean
}

const ComparisonCard = ({ analysis, heading, isLight }: ComparisonCardProps) => {
  const { user, skillAnalysis, activity, futurePrediction } = analysis
  const highlight = analysis.highlights[0]

  return (
    <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
      <CardHeader className="flex items-start gap-4">
        <img
          src={user.avatar_url}
          alt={user.name || user.login}
          className={cn('h-16 w-16 border border-white/10 object-cover', isLight && 'border-zinc-200')}
        />
        <div className="space-y-1">
          <CardDescription className={cn('text-[11px] font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
            {heading}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold">{user.name || user.login}</CardTitle>
          <p className={cn('text-sm text-gray-500', isLight && 'text-zinc-600')}>
            {numberFormatter.format(user.followers)} followers • {numberFormatter.format(user.public_repos)} repositories
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>
            Experience level
          </p>
          <p className="text-3xl font-black">{skillAnalysis.experienceLevel}</p>
        </div>

        <div className="space-y-2">
          <ComparisonMetric label="Velocity" value={`${activity.velocityScore}/100`} isLight={isLight} />
          <ComparisonMetric
            label="Active repos (90d)"
            value={numberFormatter.format(activity.activeLast90Days)}
            isLight={isLight}
          />
          <ComparisonMetric label="Market demand" value={futurePrediction.marketDemand} isLight={isLight} />
          <ComparisonMetric label="Core stack" value={summarizeCoreStack(analysis)} isLight={isLight} />
        </div>

        {highlight && (
          <div
            className={cn(
              'space-y-2 rounded-lg border border-zinc-800/60 bg-black/30 p-4',
              isLight && 'border-zinc-200 bg-white',
            )}
          >
            <p className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>Spotlight repo</p>
            <a
              href={highlight.url}
              target="_blank"
              rel="noreferrer"
              className={cn('text-base font-semibold text-white hover:text-gray-300', isLight && 'text-zinc-900 hover:text-zinc-600')}
            >
              {highlight.name}
            </a>
            <p className={cn('text-sm text-gray-500', isLight && 'text-zinc-600')}>
              {highlight.reason} • {numberFormatter.format(highlight.stars)}★
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type ComparisonMetricProps = {
  label: string
  value: string
  isLight: boolean
}

const ComparisonMetric = ({ label, value, isLight }: ComparisonMetricProps) => (
  <div className={cn('flex items-center justify-between text-sm text-gray-400', isLight && 'text-zinc-600')}>
    <span className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>{label}</span>
    <span className={cn('font-semibold text-white', isLight && 'text-zinc-900')}>{value}</span>
  </div>
)

type ComparisonTableProps = {
  primary: AnalysisResult
  secondary: AnalysisResult
  isLight: boolean
}

const ComparisonTable = ({ primary, secondary, isLight }: ComparisonTableProps) => {
  const headerClass = cn('text-[11px] font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')
  const valueClass = cn('text-right text-sm text-white', isLight && 'text-zinc-900')

  const rows = [
    {
      label: 'Experience level',
      left: primary.skillAnalysis.experienceLevel,
      right: secondary.skillAnalysis.experienceLevel,
    },
    {
      label: 'Velocity score',
      left: `${primary.activity.velocityScore}/100`,
      right: `${secondary.activity.velocityScore}/100`,
    },
    {
      label: 'Active repos (90d)',
      left: numberFormatter.format(primary.activity.activeLast90Days),
      right: numberFormatter.format(secondary.activity.activeLast90Days),
    },
    {
      label: 'Followers',
      left: numberFormatter.format(primary.user.followers),
      right: numberFormatter.format(secondary.user.followers),
    },
    {
      label: 'Market demand',
      left: primary.futurePrediction.marketDemand,
      right: secondary.futurePrediction.marketDemand,
    },
    {
      label: 'Core stack',
      left: summarizeCoreStack(primary),
      right: summarizeCoreStack(secondary),
    },
    {
      label: 'Spotlight repo',
      left: summarizeHighlight(primary),
      right: summarizeHighlight(secondary),
    },
  ]

  return (
    <Card className={cn(isLight && 'border-zinc-200 bg-white/80 text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]')}>
      <CardHeader className="space-y-2">
        <CardTitle>Key metrics contrast</CardTitle>
        <CardDescription>Side-by-side snapshot of the most telling signals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[1.2fr,1fr,1fr] gap-3">
          <span className={headerClass}>Metric</span>
          <span className={cn(headerClass, 'text-right text-gray-400', isLight && 'text-zinc-600')}>
            {primary.user.name || primary.user.login}
          </span>
          <span className={cn(headerClass, 'text-right text-gray-400', isLight && 'text-zinc-600')}>
            {secondary.user.name || secondary.user.login}
          </span>
        </div>
        <Separator />
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[1.2fr,1fr,1fr] items-start gap-3">
              <span className={headerClass}>{row.label}</span>
              <span className={valueClass}>{row.left}</span>
              <span className={valueClass}>{row.right}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const MetricRow = ({ label, value, isLight }: MetricRowProps) => (
  <div className={cn('flex items-center justify-between text-sm text-gray-400', isLight && 'text-zinc-600')}>
    <span className={cn('text-xs font-mono uppercase tracking-widest text-gray-600', isLight && 'text-zinc-500')}>{label}</span>
    <span className={cn('font-semibold text-white transition-colors', isLight && 'text-zinc-900')}>
      {typeof value === 'number' ? numberFormatter.format(value) : value}
    </span>
  </div>
)

type StackGroupProps = {
  label: string
  values: string[]
  accent?: 'solid' | 'outline'
  isLight: boolean
}

const StackGroup = ({ label, values, accent = 'outline', isLight }: StackGroupProps) => (
  <div className="space-y-2">
    <p className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>{label}</p>
    <div className="flex flex-wrap gap-2">
      {values.length === 0 && <span className={cn('text-xs text-gray-600', isLight && 'text-zinc-500')}>No signals yet</span>}
      {Array.from(new Set(values)).map((value) => (
        <Badge key={`${label}-${value}`} variant={accent} tone={isLight ? 'light' : 'dark'}>
          {value}
        </Badge>
      ))}
    </div>
  </div>
)

type IconWallProps = {
  items: string[]
  small?: boolean
  isLight: boolean
}

const IconWall = ({ items, small = false, isLight }: IconWallProps) => (
  <div className="flex flex-wrap gap-3">
    {items.length === 0 && <span className={cn('text-xs text-gray-600', isLight && 'text-zinc-500')}>No entries detected</span>}
    {Array.from(new Set(items.filter(Boolean))).map((tech) => {
      const icon = getTechIcon(tech)
      return (
        <div
          key={tech}
          title={tech}
          className={cn(
            'flex h-12 w-12 items-center justify-center border border-zinc-800 bg-black/30 p-2 transition-colors',
            isLight && 'border-zinc-200 bg-white',
          )}
        >
          <img
            src={icon}
            alt={tech}
            className={cn('object-contain', small ? 'h-8 w-8' : 'h-10 w-10')}
          />
        </div>
      )
    })}
  </div>
)

type QualityBadgeProps = {
  label: string
  value: string
  isLight: boolean
}

const QualityBadge = ({ label, value, isLight }: QualityBadgeProps) => (
  <div className="flex items-center justify-between">
    <span className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>{label}</span>
    <Badge variant="solid" tone={isLight ? 'light' : 'dark'}>{value}</Badge>
  </div>
)

type ListBlockProps = {
  heading: string
  items: string[]
  isLight: boolean
}

const ListBlock = ({ heading, items, isLight }: ListBlockProps) => (
  <div className={cn('space-y-2 text-sm text-gray-400', isLight && 'text-zinc-600')}>
    <p className={cn('text-xs font-mono uppercase tracking-widest text-gray-500', isLight && 'text-zinc-500')}>{heading}</p>
    {items.length === 0 && <p>No entries yet.</p>}
    {Array.from(new Set(items)).map((item) => (
      <p key={item}>• {item}</p>
    ))}
  </div>
)

type ThemeToggleProps = {
  theme: 'dark' | 'light'
  onToggle: () => void
}

const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => (
  <div
    className={cn(
      'flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-gray-500',
      theme === 'light' && 'text-zinc-500',
    )}
  >
    <span>Dark</span>
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      className={cn(
        'relative h-6 w-14 rounded-full border border-white/10 bg-black/50 transition-colors duration-300',
        theme === 'light' && 'border-zinc-300 bg-zinc-200',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 left-0.5 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition-all duration-300 ease-in-out',
          theme === 'light' && 'left-[calc(100%-1.375rem)] bg-zinc-900',
        )}
      />
    </button>
    <span>Light</span>
  </div>
)
