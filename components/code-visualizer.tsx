"use client"

import { useState, useCallback, useEffect } from "react"
import { CodeEditor } from "./code-editor"
import { VisualizationCanvas } from "./visualization-canvas"
import { ControlPanel } from "./control-panel"
import { MemoryPanel } from "./memory-panel"
import { parseCode, type ParsedCode, type ExecutionStep } from "@/lib/code-parser"
import { Play, Code2, BookOpen, Save, FolderOpen, LogOut, LogIn } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const SAMPLE_CODE = `x = 5
y = 10

if x < y:
    x = x + 1

print(x)`

interface Visualization {
  id: string
  title: string
  code: string
  language: string
  created_at: string
}

export function CodeVisualizer() {
  const [code, setCode] = useState(SAMPLE_CODE)
  const [parsedCode, setParsedCode] = useState<ParsedCode | null>(null)
  const [currentStep, setCurrentStep] = useState(-1)
  const [viewMode, setViewMode] = useState<"beginner" | "advanced">("beginner")
  const [language, setLanguage] = useState("python")

  const [user, setUser] = useState<User | null>(null)
  const [savedVisualizations, setSavedVisualizations] = useState<Visualization[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [saveTitle, setSaveTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check auth state on mount
  useEffect(() => {
    const supabase = createSupabaseClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load saved visualizations when user logs in
  useEffect(() => {
    if (user) {
      loadSavedVisualizations()
    } else {
      setSavedVisualizations([])
    }
  }, [user])

  const loadSavedVisualizations = async () => {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("visualizations").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setSavedVisualizations(data)
    }
  }

  const handleSave = async () => {
    if (!user || !saveTitle.trim()) return

    setIsSaving(true)
    const supabase = createSupabaseClient()

    const { error } = await supabase.from("visualizations").insert({
      user_id: user.id,
      title: saveTitle.trim(),
      code,
      language,
    })

    if (!error) {
      await loadSavedVisualizations()
      setShowSaveDialog(false)
      setSaveTitle("")
    }

    setIsSaving(false)
  }

  const handleLoad = async (visualization: Visualization) => {
    setCode(visualization.code)
    setLanguage(visualization.language)
    setParsedCode(null)
    setCurrentStep(-1)
    setShowLoadDialog(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createSupabaseClient()
    await supabase.from("visualizations").delete().eq("id", id)
    await loadSavedVisualizations()
  }

  const handleLogout = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
  }

  const handleVisualize = useCallback(() => {
    const result = parseCode(code)
    setParsedCode(result)
    setCurrentStep(-1)
  }, [code])

  const handleNext = useCallback(() => {
    if (parsedCode && currentStep < parsedCode.steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [parsedCode, currentStep])

  const handlePrevious = useCallback(() => {
    if (currentStep >= 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleReset = useCallback(() => {
    setCurrentStep(-1)
  }, [])

  const currentStepData: ExecutionStep | null =
    parsedCode && currentStep >= 0 ? (parsedCode.steps[currentStep] ?? null) : null

  const currentVariables = currentStepData?.variables ?? []
  const currentCallStack = currentStepData?.callStack ?? []

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Code2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Code Logic Visualizer</h1>
            <p className="text-sm text-muted-foreground">Debugger + Flowchart + Tutor</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
                <FolderOpen className="w-4 h-4 mr-1" />
                My Saves
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSaveTitle("")
                  setShowSaveDialog(true)
                }}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/login">
                <LogIn className="w-4 h-4 mr-1" />
                Login to Save
              </Link>
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
            <button
              onClick={() => setViewMode("beginner")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "beginner"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-1" />
              Beginner
            </button>
            <button
              onClick={() => setViewMode("advanced")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "advanced"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Advanced
            </button>
          </div>

          {/* Visualize Button */}
          <button
            onClick={handleVisualize}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Play className="w-4 h-4" />
            Visualize Logic
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Code Editor */}
        <div className="w-1/2 flex flex-col border-r border-border">
          <div className="px-4 py-3 border-b border-border bg-card/50">
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-sm border-none outline-none"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="c">C / C++</option>
              </select>
              <span className="text-sm text-muted-foreground">Paste your code below</span>
            </div>
          </div>
          <CodeEditor code={code} onChange={setCode} highlightLine={currentStepData?.lineNumber} language={language} />
        </div>

        {/* Right Side: Visualization + Memory */}
        <div className="w-1/2 flex flex-col">
          {/* Visualization Canvas */}
          <div className="flex-1 overflow-auto">
            {parsedCode ? (
              <VisualizationCanvas steps={parsedCode.steps} currentStep={currentStep} viewMode={viewMode} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Code2 className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No visualization yet</p>
                <p className="text-sm">Click &quot;Visualize Logic&quot; to see your code in action</p>
              </div>
            )}
          </div>

          {/* Memory Panel - only shows executed variables */}
          <MemoryPanel variables={currentVariables} callStack={currentCallStack} />

          {/* Control Panel - no auto-play */}
          <ControlPanel
            onNext={handleNext}
            onPrevious={handlePrevious}
            onReset={handleReset}
            currentStep={currentStep}
            totalSteps={parsedCode?.steps.length ?? 0}
          />
        </div>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Visualization</DialogTitle>
            <DialogDescription>Give your visualization a name to save it for later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Bubble Sort Algorithm"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !saveTitle.trim()}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>My Saved Visualizations</DialogTitle>
            <DialogDescription>Load a previously saved visualization.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-auto">
            {savedVisualizations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved visualizations yet.</p>
            ) : (
              <div className="space-y-2">
                {savedVisualizations.map((viz) => (
                  <div
                    key={viz.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => handleLoad(viz)}>
                      <p className="font-medium">{viz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {viz.language} - {new Date(viz.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(viz.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
