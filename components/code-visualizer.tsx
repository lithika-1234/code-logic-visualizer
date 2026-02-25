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
  user_id: string
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

  // Load user session
  useEffect(() => {
    const supabase = createSupabaseClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load saves when user logs in
  useEffect(() => {
    if (user) {
      loadSavedVisualizations()
    }
  }, [user])

  // ✅ FIXED: Load only current user's saves
  const loadSavedVisualizations = async () => {
    if (!user) return

    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from("visualizations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.log(error)
    }

    if (data) {
      setSavedVisualizations(data)
    }
  }

  // ✅ Save visualization
  const handleSave = async () => {
    if (!user || !saveTitle.trim()) return

    setIsSaving(true)

    const supabase = createSupabaseClient()

    const { error } = await supabase.from("visualizations").insert({
      user_id: user.id,
      title: saveTitle,
      code: code,
      language: language,
    })

    if (error) {
      console.log(error)
      alert("Save failed")
    } else {
      alert("Saved successfully!")

      await loadSavedVisualizations()

      setShowSaveDialog(false)
      setSaveTitle("")
    }

    setIsSaving(false)
  }

  // Load selected visualization
  const handleLoad = (visualization: Visualization) => {
    setCode(visualization.code)
    setLanguage(visualization.language)
    setParsedCode(null)
    setCurrentStep(-1)
    setShowLoadDialog(false)
  }

  // Delete visualization
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

  const handleNext = () => {
    if (parsedCode && currentStep < parsedCode.steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep >= 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleReset = () => {
    setCurrentStep(-1)
  }

  const currentStepData: ExecutionStep | null =
    parsedCode && currentStep >= 0 ? parsedCode.steps[currentStep] : null

  const currentVariables = currentStepData?.variables ?? []
  const currentCallStack = currentStepData?.callStack ?? []

  return (
    <div className="flex flex-col h-screen">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">

        <div className="flex items-center gap-3">
          <Code2 className="w-6 h-6"/>
          <h1 className="text-lg font-bold">
            Code Logic Visualizer
          </h1>
        </div>

        <div className="flex gap-2">

          {user ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowLoadDialog(true)}
              >
                <FolderOpen className="w-4 h-4 mr-1"/>
                My Saves
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="w-4 h-4 mr-1"/>
                Save
              </Button>

              <Button
                variant="ghost"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (

            <Button asChild>
              <Link href="/auth/login">
                Login
              </Link>
            </Button>

          )}

          <Button onClick={handleVisualize}>
            <Play className="w-4 h-4 mr-1"/>
            Visualize
          </Button>

        </div>
      </header>


      {/* Layout */}

      <div className="flex flex-1">

        <div className="w-1/2 border-r">
          <CodeEditor
            code={code}
            onChange={setCode}
            highlightLine={currentStepData?.lineNumber}
            language={language}
          />
        </div>


        <div className="w-1/2 flex flex-col">

          <VisualizationCanvas
            steps={parsedCode?.steps ?? []}
            currentStep={currentStep}
            viewMode={viewMode}
          />

          <MemoryPanel
            variables={currentVariables}
            callStack={currentCallStack}
          />

          <ControlPanel
            onNext={handleNext}
            onPrevious={handlePrevious}
            onReset={handleReset}
            currentStep={currentStep}
            totalSteps={parsedCode?.steps.length ?? 0}
          />

        </div>

      </div>



      {/* SAVE DIALOG */}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              Save Visualization
            </DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Enter title"
            value={saveTitle}
            onChange={(e)=>setSaveTitle(e.target.value)}
          />

          <DialogFooter>

            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>



      {/* LOAD DIALOG */}

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>

        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              My Saved Visualizations
            </DialogTitle>
          </DialogHeader>


          {savedVisualizations.length === 0 ? (

            <p>No saved visualizations yet.</p>

          ) : (

            savedVisualizations.map((viz)=>(
              <div
                key={viz.id}
                className="flex justify-between border p-2 rounded"
              >

                <div
                  onClick={()=>handleLoad(viz)}
                  className="cursor-pointer"
                >
                  {viz.title}
                </div>

                <Button
                  size="sm"
                  onClick={()=>handleDelete(viz.id)}
                >
                  Delete
                </Button>

              </div>
            ))

          )}

        </DialogContent>

      </Dialog>

    </div>
  )
}