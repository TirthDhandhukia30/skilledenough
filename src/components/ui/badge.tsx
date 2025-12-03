import * as React from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'outline' | 'solid'

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant
  tone?: 'dark' | 'light'
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'outline', tone = 'dark', ...props }, ref) => {
    const base = 'inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-mono uppercase tracking-wider'

    const solidStyles =
      tone === 'light'
        ? 'border-zinc-200 bg-zinc-100 text-zinc-900'
        : 'border-white/10 bg-white/10 text-white'

    const outlineStyles =
      tone === 'light'
        ? 'border-zinc-200 bg-white text-zinc-600'
        : 'border-white/10 bg-black/40 text-gray-400'

    const styles = variant === 'solid' ? solidStyles : outlineStyles

    return <div ref={ref} className={cn(base, styles, className)} {...props} />
  },
)
Badge.displayName = 'Badge'
