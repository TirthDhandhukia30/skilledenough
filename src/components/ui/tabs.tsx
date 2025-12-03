import * as React from 'react'
import { cn } from '../../lib/utils'

type TabsContextValue = {
  value: string
  setValue: (next: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

const useTabsContext = () => {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within <Tabs> root')
  }
  return context
}

type TabsProps = React.HTMLAttributes<HTMLDivElement> & {
  defaultValue: string
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, className, children, ...props }) => {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn('space-y-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>

export const TabsList: React.FC<TabsListProps> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 text-[11px] font-mono uppercase tracking-widest',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className, children, ...props }) => {
  const { value: activeValue, setValue } = useTabsContext()
  const active = activeValue === value

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={cn(
        'rounded-full px-4 py-1 transition-all focus:outline-none',
        active
          ? 'bg-white text-black shadow-sm'
          : 'text-gray-500 hover:text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, className, children, ...props }) => {
  const { value: activeValue } = useTabsContext()

  if (activeValue !== value) return null

  return (
    <div className={cn('rounded-none border border-white/10 bg-black/40 p-6', className)} {...props}>
      {children}
    </div>
  )
}
