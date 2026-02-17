"use client"

import type React from "react"

import { useRef, useEffect, useMemo } from "react"

interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
  highlightLine?: number
  language: string
}

// Syntax highlighting is handled via a separate overlay without mutating the actual code text
export function CodeEditor({ code, onChange, highlightLine, language }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const lines = useMemo(() => code.split("\n"), [code])

  // Sync scroll between all three panels
  const handleScroll = () => {
    if (textareaRef.current) {
      const scrollTop = textareaRef.current.scrollTop
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = scrollTop
      }
    }
  }

  useEffect(() => {
    handleScroll()
  }, [code])

  // Tokenize a single line for syntax highlighting (pure function, no mutation)
  const tokenizeLine = (line: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = []
    let remaining = line
    let key = 0

    // Token patterns in priority order
    const patterns: { regex: RegExp; className: string }[] = [
      // Comments (Python # and JS //)
      { regex: /^(#.*|\/\/.*)/, className: "text-muted-foreground italic" },
      // Strings
      { regex: /^(["'`])(?:(?!\1)[^\\]|\\.)*\1/, className: "text-amber-400" },
      // Keywords
      {
        regex:
          /^(const|let|var|function|return|if|else|elif|for|while|do|switch|case|break|continue|class|import|export|from|default|new|try|catch|finally|throw|async|await|def|print|in|range|public|static|void|int|float|double|string|boolean|true|false|True|False|null|undefined|None|and|or|not)\b/,
        className: "text-pink-400 font-medium",
      },
      // Numbers
      { regex: /^(\d+\.?\d*)/, className: "text-orange-400" },
      // Function calls (word followed by parenthesis)
      { regex: /^(\w+)(?=\s*\()/, className: "text-sky-400" },
      // Operators
      { regex: /^([+\-*/%=<>!&|^~]+)/, className: "text-cyan-300" },
      // Punctuation
      { regex: /^([(){}[\],;:])/, className: "text-muted-foreground" },
      // Identifiers (variables)
      { regex: /^(\w+)/, className: "text-foreground" },
      // Whitespace
      { regex: /^(\s+)/, className: "" },
    ]

    while (remaining.length > 0) {
      let matched = false

      for (const { regex, className } of patterns) {
        const match = remaining.match(regex)
        if (match) {
          const text = match[0]
          if (className) {
            tokens.push(
              <span key={key++} className={className}>
                {text}
              </span>,
            )
          } else {
            tokens.push(<span key={key++}>{text}</span>)
          }
          remaining = remaining.slice(text.length)
          matched = true
          break
        }
      }

      // If no pattern matched, consume one character
      if (!matched) {
        tokens.push(<span key={key++}>{remaining[0]}</span>)
        remaining = remaining.slice(1)
      }
    }

    return tokens
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-background font-mono text-sm">
      {/* Line Numbers Column */}
      <div
        ref={lineNumbersRef}
        className="flex flex-col py-4 px-2 bg-card text-muted-foreground select-none overflow-hidden border-r border-border"
        style={{ minWidth: "3.5rem" }}
      >
        {lines.map((_, index) => {
          const lineNum = index + 1
          const isHighlighted = highlightLine === lineNum
          return (
            <div
              key={index}
              className={`h-6 leading-6 px-2 text-right transition-colors ${
                isHighlighted ? "text-primary font-bold bg-primary/10" : ""
              }`}
            >
              {lineNum}
            </div>
          )
        })}
      </div>

      {/* Code Area - Three layers */}
      <div className="flex-1 relative">
        {/* Layer 1: Line highlight background */}
        <div className="absolute inset-0 py-4 pointer-events-none overflow-hidden">
          {lines.map((_, index) => {
            const lineNum = index + 1
            const isHighlighted = highlightLine === lineNum
            return (
              <div
                key={index}
                className={`h-6 transition-colors ${isHighlighted ? "bg-primary/20 border-l-2 border-primary" : ""}`}
              />
            )
          })}
        </div>

        {/* Layer 2: Syntax highlighted display (read-only visual layer) */}
        <div ref={highlightRef} className="absolute inset-0 py-4 px-4 overflow-auto pointer-events-none">
          {lines.map((line, index) => (
            <div key={index} className="h-6 leading-6 whitespace-pre">
              {line ? tokenizeLine(line) : <span>&nbsp;</span>}
            </div>
          ))}
        </div>

        {/* Layer 3: Actual editable textarea (invisible text, visible caret) */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full py-4 px-4 bg-transparent text-transparent caret-foreground resize-none outline-none leading-6 whitespace-pre"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
    </div>
  )
}
