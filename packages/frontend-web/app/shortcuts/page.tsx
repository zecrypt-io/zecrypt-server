import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"

export default function ShortcutsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Zecrypt Keyboard Shortcuts</h1>
        <p className="text-muted-foreground text-center mb-8">
          Master Zecrypt with these keyboard shortcuts to boost your productivity
        </p>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <KeyboardShortcutsHelp />
        </div>

        <div className="mt-8 text-center">
          <a href="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

