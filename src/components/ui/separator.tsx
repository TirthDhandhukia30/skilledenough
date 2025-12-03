import * as React from 'react'
import { cn } from '../../lib/utils'

type SeparatorProps = React.HTMLAttributes<HTMLDivElement>

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('w-full border-t border-zinc-800/80', className)} role="separator" {...props} />
  ),
)
Separator.displayName = 'Separator'
