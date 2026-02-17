"use client"

import type { Variable } from "@/lib/code-parser"
import { Database, Layers } from "lucide-react"

interface MemoryPanelProps {
  variables: Variable[]
  callStack: string[]
}

export function MemoryPanel({ variables, callStack }: MemoryPanelProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "number":
        return "bg-primary/20 text-primary"
      case "string":
        return "bg-accent/20 text-accent"
      case "boolean":
        return "bg-chart-3/20 text-chart-3"
      case "array":
        return "bg-chart-4/20 text-chart-4"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="border-t border-border bg-card">
      <div className="flex">
        {/* Variables Section */}
        <div className="flex-1 p-4 border-r border-border">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Memory (Variables)</h3>
          </div>

          {variables.length > 0 ? (
            <div className="space-y-2">
              {variables.map((variable, index) => (
                <div
                  key={`${variable.name}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 animate-in fade-in slide-in-from-left-2"
                >
                  <span className="font-mono text-sm font-semibold text-foreground min-w-[60px]">{variable.name}</span>
                  <span className="text-muted-foreground">=</span>
                  <span className={`px-2 py-0.5 rounded text-sm font-mono ${getTypeColor(variable.type)}`}>
                    {JSON.stringify(variable.value)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">({variable.type})</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No variables defined yet</p>
          )}
        </div>

        {/* Call Stack Section */}
        <div className="w-48 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-chart-4" />
            <h3 className="text-sm font-semibold text-foreground">Call Stack</h3>
          </div>

          <div className="space-y-1">
            {callStack
              .slice()
              .reverse()
              .map((func, index) => (
                <div
                  key={`${func}-${index}`}
                  className={`px-3 py-1.5 rounded text-sm font-mono ${
                    index === 0 ? "bg-chart-4/20 text-chart-4 font-semibold" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {func}()
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
