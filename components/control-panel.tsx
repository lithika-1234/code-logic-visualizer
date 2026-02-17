"use client"
import { SkipBack, RotateCcw, ArrowRight } from "lucide-react"

interface ControlPanelProps {
  onNext: () => void
  onPrevious: () => void
  onReset: () => void
  currentStep: number
  totalSteps: number
}

export function ControlPanel({ onNext, onPrevious, onReset, currentStep, totalSteps }: ControlPanelProps) {
  const isAtStart = currentStep < 0
  const isAtEnd = currentStep >= totalSteps - 1

  return (
    <div className="px-6 py-4 border-t border-border bg-card/80 backdrop-blur">
      <div className="flex items-center justify-between gap-6">
        {/* Control Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            disabled={totalSteps === 0 || isAtStart}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Reset to beginning"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">Reset</span>
          </button>

          <button
            onClick={onPrevious}
            disabled={isAtStart || totalSteps === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Go to previous step"
          >
            <SkipBack className="w-4 h-4" />
            <span className="text-sm font-medium">Previous Step</span>
          </button>

          <button
            onClick={onNext}
            disabled={isAtEnd || totalSteps === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            title="Explain the next step"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-semibold">Explain Next Step</span>
          </button>
        </div>

        {/* Step Counter */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {totalSteps > 0 ? (
              isAtStart ? (
                <span>Ready to start ({totalSteps} steps)</span>
              ) : (
                <span>
                  Step <span className="font-mono font-semibold text-foreground">{currentStep + 1}</span> of{" "}
                  <span className="font-mono">{totalSteps}</span>
                </span>
              )
            ) : (
              <span>No steps yet</span>
            )}
          </div>
          {/* Progress bar */}
          {totalSteps > 0 && (
            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${isAtStart ? 0 : ((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
