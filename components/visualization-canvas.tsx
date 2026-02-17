"use client"

import type { ExecutionStep } from "@/lib/code-parser"
import { Play, Square, Diamond, RotateCcw, ArrowRight, Layers, Terminal, ArrowDown } from "lucide-react"

interface VisualizationCanvasProps {
  steps: ExecutionStep[]
  currentStep: number // -1 means show only start, 0+ means show steps up to currentStep
  viewMode: "beginner" | "advanced"
}

export function VisualizationCanvas({ steps, currentStep, viewMode }: VisualizationCanvasProps) {
  const executedSteps = currentStep >= 0 ? steps.slice(0, currentStep + 1) : []
  const currentStepData = currentStep >= 0 ? steps[currentStep] : null

  const getStepIcon = (type: ExecutionStep["type"]) => {
    switch (type) {
      case "start":
        return <Play className="w-5 h-5" />
      case "end":
        return <Square className="w-5 h-5" />
      case "condition":
        return <Diamond className="w-5 h-5" />
      case "loop":
        return <RotateCcw className="w-5 h-5" />
      case "function-call":
        return <Layers className="w-5 h-5" />
      case "function-return":
        return <ArrowRight className="w-5 h-5" />
      case "output":
        return <Terminal className="w-5 h-5" />
      default:
        return <ArrowRight className="w-5 h-5" />
    }
  }

  const getStepColor = (type: ExecutionStep["type"], isActive: boolean) => {
    const baseColors: Record<string, string> = {
      start: "bg-emerald-500/20 text-emerald-400 border-emerald-500",
      end: "bg-rose-500/20 text-rose-400 border-rose-500",
      condition: "bg-amber-500/20 text-amber-400 border-amber-500",
      loop: "bg-violet-500/20 text-violet-400 border-violet-500",
      "function-call": "bg-cyan-500/20 text-cyan-400 border-cyan-500",
      "function-return": "bg-cyan-500/20 text-cyan-400 border-cyan-500",
      output: "bg-sky-500/20 text-sky-400 border-sky-500",
      assignment: "bg-primary/20 text-primary border-primary",
    }
    if (!isActive) {
      return "bg-muted/50 text-muted-foreground border-muted-foreground/30"
    }
    return baseColors[type] || "bg-primary/20 text-primary border-primary"
  }

  const getBlockShape = (type: ExecutionStep["type"]) => {
    switch (type) {
      case "start":
      case "end":
        return "rounded-full px-6 py-3"
      case "condition":
        return "rotate-0 px-6 py-3 clip-diamond"
      case "loop":
        return "rounded-xl px-6 py-3"
      default:
        return "rounded-lg px-6 py-3"
    }
  }

  if (currentStep < 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="rounded-full px-8 py-4 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 flex items-center gap-2 shadow-lg">
            <Play className="w-6 h-6" />
            <span className="font-semibold text-lg">START</span>
          </div>
          <div className="flex flex-col items-center my-4">
            <div className="w-0.5 h-8 bg-border" />
            <ArrowDown className="w-5 h-5 text-muted-foreground -mt-1" />
          </div>
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Click "Explain Next Step" to begin</p>
            <p className="text-xs mt-1 opacity-70">Each click advances one step of execution</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 overflow-auto max-h-full">
      {/* Current Step Flowchart Block */}
      {currentStepData && (
        <div className="flex flex-col items-center">
          <div
            className={`
              ${getBlockShape(currentStepData.type)}
              ${getStepColor(currentStepData.type, true)}
              border-2 flex items-center justify-center
              transition-all duration-300 ease-out shadow-lg
              animate-in fade-in zoom-in-95
            `}
          >
            <div className="flex items-center gap-2">
              {getStepIcon(currentStepData.type)}
              <span className="font-semibold capitalize text-sm">{currentStepData.type.replace("-", " ")}</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center my-2">
            <div className="w-0.5 h-6 bg-border" />
            <ArrowDown className="w-4 h-4 text-muted-foreground -mt-1" />
          </div>
        </div>
      )}

      {/* Current Step Details Card */}
      {currentStepData && (
        <div className="bg-card rounded-xl border-2 border-primary/50 overflow-hidden shadow-lg animate-in slide-in-from-bottom-2">
          {/* Code Line */}
          <div className="px-4 py-3 bg-primary/10 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded text-xs font-medium">
                Line {currentStepData.lineNumber || "—"}
              </span>
              <span className="px-2 py-0.5 bg-secondary rounded text-xs font-semibold">
                Step {currentStep + 1} of {steps.length}
              </span>
              {currentStepData.loopIteration && (
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-xs">
                  Iteration {currentStepData.loopIteration}
                </span>
              )}
            </div>
            <code className="text-sm font-mono text-foreground block bg-background/50 px-3 py-2 rounded border">
              {currentStepData.code}
            </code>
          </div>

          {/* Explanation */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              {viewMode === "beginner" ? "What's happening?" : "Technical Details"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {viewMode === "beginner" ? currentStepData.explanation : currentStepData.advancedExplanation}
            </p>
          </div>

          {/* Additional Details */}
          {(currentStepData.conditionResult !== undefined || currentStepData.result !== undefined) && (
            <div className="px-4 pb-4 space-y-2">
              {currentStepData.conditionResult !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Condition Result:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-xs ${
                      currentStepData.conditionResult
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {currentStepData.conditionResult ? "TRUE" : "FALSE"}
                  </span>
                </div>
              )}
              {currentStepData.result !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Output:</span>
                  <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded font-mono text-xs">
                    {String(currentStepData.result)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {executedSteps.length > 1 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Previous Steps</h3>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {executedSteps.slice(0, -1).map((step, index) => (
              <div key={step.id} className="px-4 py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">Step {index + 1}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <code className="text-xs font-mono text-foreground/70">{step.code}</code>
                </div>
                <p className="text-xs text-muted-foreground">
                  {viewMode === "beginner" ? step.explanation : step.advancedExplanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini Flowchart Overview */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Execution Progress</h3>
        <div className="flex flex-wrap gap-1.5">
          {steps.map((step, index) => {
            const isExecuted = index <= currentStep
            const isCurrent = index === currentStep
            return (
              <div
                key={step.id}
                title={isExecuted ? `Step ${index + 1}: ${step.type}` : "Not yet executed"}
                className={`
                  w-7 h-7 rounded flex items-center justify-center text-xs font-mono
                  transition-all duration-200
                  ${
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                      : isExecuted
                        ? "bg-emerald-500/30 text-emerald-400"
                        : "bg-secondary/50 text-muted-foreground/30"
                  }
                `}
              >
                {isExecuted ? index + 1 : "?"}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
