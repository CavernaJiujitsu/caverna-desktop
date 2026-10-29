import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/providers/theme-provider'
import { Button } from '@/shared/components/ui/button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <Moon aria-hidden="true" />
      ) : (
        <Sun aria-hidden="true" />
      )}
    </Button>
  )
}
