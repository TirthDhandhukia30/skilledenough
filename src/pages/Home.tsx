import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [username, setUsername] = useState('')
  const [compareUsername, setCompareUsername] = useState('')
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Extract username from GitHub URL or return as-is if it's just a username
  const parseUsername = (input: string): string => {
    const trimmed = input.trim()
    // Match github.com/username or github.com/username/ patterns
    const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\/?$/i)
    if (urlMatch) {
      return urlMatch[1]
    }
    // Also handle github.com/username/repo by taking just the username
    const repoUrlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\//i)
    if (repoUrlMatch) {
      return repoUrlMatch[1]
    }
    return trimmed
  }

  const handleAnalyze = () => {
    const parsedUsername = parseUsername(username)
    if (!parsedUsername) {
      setError('Please enter a GitHub username or profile URL')
      return
    }
    if (isComparing) {
      const parsedCompare = parseUsername(compareUsername)
      if (!parsedCompare) {
        setError('Add a second GitHub username or URL to compare')
        return
      }
      if (parsedCompare.toLowerCase() === parsedUsername.toLowerCase()) {
        setError('Use two different usernames for comparison')
        return
      }
      const primary = encodeURIComponent(parsedUsername)
      const secondary = encodeURIComponent(parsedCompare)
      navigate(`/analysis/${primary}?compare=${secondary}`)
      return
    }

    const primary = encodeURIComponent(parsedUsername)
    navigate(`/analysis/${primary}`)
  }

  return (
    <div className="relative h-screen overflow-hidden bg-black text-white">
      {/* Animated grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]"
      />

      <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-6 py-20">
        {/* Gradient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-transparent blur-3xl"
        />

        {/* Hero */}
        <div className="text-center">
          <h1 className="text-7xl font-black tracking-tighter sm:text-8xl md:text-9xl">
            SKILLED
            <br />
            <span className="text-white">ENOUGH?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-gray-400">
            Benchmark your GitHub presence against industry-grade signals. Uncover your stack, velocity, and career runway.
          </p>
        </div>

        {/* Input area */}
        <div className="mt-14 w-full max-w-2xl space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            {/* Primary username */}
            <div className="flex flex-1 items-center overflow-hidden border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm transition-colors hover:border-zinc-700 focus-within:border-zinc-600">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="username or github.com/username"
                className="w-full bg-transparent px-4 py-4 text-base text-white placeholder-gray-600 focus:outline-none font-mono"
              />
            </div>

            {/* Compare username (side by side) */}
            {isComparing && (
              <>
                <span className="hidden sm:flex items-center text-gray-500 text-sm font-mono px-2">vs</span>
                <div className="flex flex-1 items-center overflow-hidden border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm transition-colors hover:border-zinc-700 focus-within:border-zinc-600">
                  <input
                    type="text"
                    value={compareUsername}
                    onChange={(e) => {
                      setCompareUsername(e.target.value)
                      setError(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    placeholder="other username"
                    className="w-full bg-transparent px-4 py-4 text-base text-white placeholder-gray-600 focus:outline-none font-mono"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleAnalyze}
              className="shrink-0 bg-white px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-gray-200"
            >
              {isComparing ? 'Compare' : 'Analyze'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-widest text-gray-500">
            <button
              type="button"
              onClick={() => {
                setIsComparing((current) => {
                  if (current) setCompareUsername('')
                  return !current
                })
                setError(null)
              }}
              className="hover:text-white transition-colors"
            >
              {isComparing ? 'Cancel comparison' : 'Compare with someone?'}
            </button>
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}
