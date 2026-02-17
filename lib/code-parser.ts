// Types for our code visualization system
export interface Variable {
  name: string
  value: string | number | boolean | null | object
  type: string
}

export interface ExecutionStep {
  id: number
  lineNumber: number
  code: string
  type: "start" | "end" | "assignment" | "condition" | "loop" | "function-call" | "function-return" | "output" | "input"
  explanation: string
  advancedExplanation: string // Added separate advanced explanation
  variables: Variable[]
  result?: string | boolean | number
  loopIteration?: number
  conditionResult?: boolean
  callStack?: string[]
}

export interface ParsedCode {
  steps: ExecutionStep[]
  functions: string[]
  hasError: boolean
  errorMessage?: string
  errorLine?: number
}

// Helper to detect programming language
export function detectLanguage(code: string): string {
  if (
    code.includes("def ") ||
    code.includes("print(") ||
    code.includes("elif ") ||
    code.match(/for\s+\w+\s+in\s+range\(/)
  ) {
    return "python"
  }
  if (code.includes("public static void main") || code.includes("System.out.println")) {
    return "java"
  }
  if (code.includes("#include") || code.includes("printf(") || code.includes("cout <<")) {
    return "c"
  }
  return "javascript"
}

export function parseCode(code: string): ParsedCode {
  const language = detectLanguage(code)
  const lines = code.split("\n")
  const steps: ExecutionStep[] = []
  const variables: Variable[] = []
  const callStack: string[] = ["main"]
  let stepId = 0

  // Helper to create a deep copy of variables
  const cloneVariables = () => JSON.parse(JSON.stringify(variables))

  // Helper to evaluate simple expressions with current variables
  const evaluateExpression = (expr: string): any => {
    let result = expr.trim()
    // Replace variable names with their values
    for (const v of variables) {
      const regex = new RegExp(`\\b${v.name}\\b`, "g")
      result = result.replace(regex, JSON.stringify(v.value))
    }
    try {
      // Safe evaluation for simple math expressions
      return Function(`"use strict"; return (${result})`)()
    } catch {
      return expr
    }
  }

  // Add start step
  steps.push({
    id: stepId++,
    lineNumber: 0,
    code: "Program Start",
    type: "start",
    explanation:
      "The program begins here. The computer will read your code line by line, from top to bottom, executing each instruction in order.",
    advancedExplanation: "Execution context initialized. Call stack: [main]. Memory allocated for program scope.",
    variables: [],
    callStack: [...callStack],
  })

  const pyForRegex = /for\s+(\w+)\s+in\s+range\s*[(]\s*(\d+)\s*[)]/
  const printRegex = /(?:print|console[.]log|System[.]out[.]println|printf|cout\s*<<)\s*[(]?\s*(.+?)\s*[)]?;?$/
  const funcRegex = /(?:function|def|void|int|public\s+static\s+void)\s+(\w+)\s*[(]([^)]*)[)]/
  const jsVarRegex = /(?:let|const|var|int|float|double)\s+(\w+)\s*=\s*(.+?);?$/
  const pyAssignRegex = /^(\w+)\s*=\s*(.+)$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    const lineNumber = i + 1

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith("//") || trimmedLine.startsWith("#") || trimmedLine.startsWith("/*")) {
      continue
    }

    // Python-style simple assignment: x = 5 or x = "hello"
    const pyAssignMatch = trimmedLine.match(pyAssignRegex)
    if (
      pyAssignMatch &&
      !trimmedLine.includes("for") &&
      !trimmedLine.includes("while") &&
      !trimmedLine.includes("if")
    ) {
      const [, name, valueStr] = pyAssignMatch
      let value: any = valueStr.trim()
      let type = "unknown"

      // Determine type and evaluate
      if (value.match(/^-?\d+$/)) {
        value = Number.parseInt(value)
        type = "number"
      } else if (value.match(/^-?\d+\.\d+$/)) {
        value = Number.parseFloat(value)
        type = "number"
      } else if (value === "true" || value === "True") {
        value = true
        type = "boolean"
      } else if (value === "false" || value === "False") {
        value = false
        type = "boolean"
      } else if (value.startsWith('"') || value.startsWith("'")) {
        value = value.replace(/^["']|["']$/g, "")
        type = "string"
      } else if (value.startsWith("[")) {
        type = "array"
      } else {
        // Try to evaluate expression
        const evaluated = evaluateExpression(value)
        if (typeof evaluated === "number") {
          value = evaluated
          type = "number"
        }
      }

      const existingIdx = variables.findIndex((v) => v.name === name)
      if (existingIdx >= 0) {
        const oldValue = variables[existingIdx].value
        variables[existingIdx] = { name, value, type }
        steps.push({
          id: stepId++,
          lineNumber,
          code: trimmedLine,
          type: "assignment",
          explanation: `We update the variable "${name}" from ${JSON.stringify(oldValue)} to ${JSON.stringify(value)}. The computer changes what's stored in the memory location labeled "${name}".`,
          advancedExplanation: `Variable reassignment: ${name} = ${JSON.stringify(value)} (${type}). Memory address updated. Previous value ${JSON.stringify(oldValue)} is overwritten.`,
          variables: cloneVariables(),
          callStack: [...callStack],
        })
      } else {
        variables.push({ name, value, type })
        steps.push({
          id: stepId++,
          lineNumber,
          code: trimmedLine,
          type: "assignment",
          explanation: `We create a new variable called "${name}" and store the value ${JSON.stringify(value)} inside it. A variable is like a labeled box where we can store data.`,
          advancedExplanation: `Variable declaration and initialization: ${name} = ${JSON.stringify(value)}. Type: ${type}. Memory allocated in current scope.`,
          variables: cloneVariables(),
          callStack: [...callStack],
        })
      }
      continue
    }

    // JavaScript-style variable declaration: let/const/var x = 5
    const jsVarMatch = trimmedLine.match(jsVarRegex)
    if (jsVarMatch) {
      const [, name, valueStr] = jsVarMatch
      let value: any = valueStr.replace(/;$/, "").trim()
      let type = "unknown"

      if (value.match(/^-?\d+$/)) {
        value = Number.parseInt(value)
        type = "number"
      } else if (value.match(/^-?\d+\.\d+$/)) {
        value = Number.parseFloat(value)
        type = "number"
      } else if (value === "true" || value === "false") {
        value = value === "true"
        type = "boolean"
      } else if (value.startsWith('"') || value.startsWith("'")) {
        value = value.replace(/^["']|["']$/g, "")
        type = "string"
      } else {
        const evaluated = evaluateExpression(value)
        if (typeof evaluated === "number") {
          value = evaluated
          type = "number"
        }
      }

      variables.push({ name, value, type })
      steps.push({
        id: stepId++,
        lineNumber,
        code: trimmedLine,
        type: "assignment",
        explanation: `We declare a variable named "${name}" and assign it the value ${JSON.stringify(value)}. This creates a named storage location in the computer's memory.`,
        advancedExplanation: `Variable declaration: ${name} initialized to ${JSON.stringify(value)} (${type}). Scoped to current block.`,
        variables: cloneVariables(),
        callStack: [...callStack],
      })
      continue
    }

    // Python for loop: for i in range(n)
    const pyForMatch = trimmedLine.match(pyForRegex)
    if (pyForMatch) {
      const [, varName, endVal] = pyForMatch
      const end = Number.parseInt(endVal)

      steps.push({
        id: stepId++,
        lineNumber,
        code: trimmedLine,
        type: "loop",
        explanation: `This FOR loop will repeat the code inside it ${end} times. The variable "${varName}" starts at 0 and increases by 1 each time, stopping before ${end}.`,
        advancedExplanation: `For loop initialization: iterator ${varName} in range(0, ${end}). Loop will execute ${end} iterations with ${varName} values [0, ${end - 1}].`,
        variables: cloneVariables(),
        loopIteration: 0,
        callStack: [...callStack],
      })

      // Simulate loop iterations (limit to 10 for display)
      const maxIterations = Math.min(end, 10)
      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const existingIdx = variables.findIndex((v) => v.name === varName)
        if (existingIdx >= 0) {
          variables[existingIdx].value = iteration
        } else {
          variables.push({ name: varName, value: iteration, type: "number" })
        }

        steps.push({
          id: stepId++,
          lineNumber,
          code: `${varName} = ${iteration}`,
          type: "loop",
          explanation: `Loop iteration ${iteration + 1}: The variable "${varName}" is now ${iteration}. The code inside the loop will run with this value.`,
          advancedExplanation: `Iteration ${iteration + 1}/${maxIterations}: ${varName} = ${iteration}. Executing loop body.`,
          variables: cloneVariables(),
          loopIteration: iteration + 1,
          callStack: [...callStack],
        })
      }
      continue
    }

    const jsForMatch = trimmedLine.match(
      /for\s*[(]\s*(?:let|int|var)?\s*(\w+)\s*=\s*(\d+);\s*\1\s*([<>=!]+)\s*(\d+);\s*\1([+][+]|--|[+]=\d+|-=\d+)/,
    )
    if (jsForMatch) {
      const [, varName, startVal, operator, endVal, increment] = jsForMatch
      const start = Number.parseInt(startVal)
      const end = Number.parseInt(endVal)

      variables.push({ name: varName, value: start, type: "number" })

      steps.push({
        id: stepId++,
        lineNumber,
        code: trimmedLine,
        type: "loop",
        explanation: `This FOR loop creates a counter "${varName}" starting at ${start}. It keeps running while ${varName} ${operator} ${end} is true. After each round, ${varName} ${increment === "++" ? "increases by 1" : increment === "--" ? "decreases by 1" : "changes"}.`,
        advancedExplanation: `For loop: init ${varName}=${start}, condition ${varName}${operator}${end}, update ${varName}${increment}. Expected iterations: ${Math.abs(end - start)}.`,
        variables: cloneVariables(),
        loopIteration: 0,
        callStack: [...callStack],
      })

      // Simulate iterations
      let loopVar = start
      let iteration = 1
      const maxIterations = Math.min(Math.abs(end - start), 10)

      while (iteration <= maxIterations && loopVar < end) {
        const varIdx = variables.findIndex((v) => v.name === varName)
        if (varIdx >= 0) {
          variables[varIdx].value = loopVar
        }

        steps.push({
          id: stepId++,
          lineNumber,
          code: `${varName} = ${loopVar}`,
          type: "loop",
          explanation: `Loop iteration ${iteration}: "${varName}" equals ${loopVar}. Since ${loopVar} ${operator} ${end} is true, the loop body executes.`,
          advancedExplanation: `Iteration ${iteration}: ${varName}=${loopVar}, condition (${loopVar}${operator}${end})=true. Executing body, then ${increment}.`,
          variables: cloneVariables(),
          loopIteration: iteration,
          callStack: [...callStack],
        })

        if (increment === "++") loopVar++
        else if (increment === "--") loopVar--
        iteration++
      }
      continue
    }

    // If conditions
    const ifMatch = trimmedLine.match(/if\s*[:(]?\s*(.+?)\s*[):]?\s*[:{]?$/)
    if (ifMatch && trimmedLine.startsWith("if")) {
      const condition = ifMatch[1].replace(/[():{}]/g, "").trim()
      const conditionResult = evaluateExpression(condition)

      steps.push({
        id: stepId++,
        lineNumber,
        code: trimmedLine,
        type: "condition",
        explanation: `The IF statement checks: "${condition}". If this condition is TRUE, the code inside runs. If FALSE, it skips to the next section or an ELSE block.`,
        advancedExplanation: `Conditional branch: evaluating (${condition}). Result: ${conditionResult}. Branch taken: ${conditionResult ? "true-block" : "false-block/skip"}.`,
        variables: cloneVariables(),
        conditionResult: Boolean(conditionResult),
        callStack: [...callStack],
      })
      continue
    }

    // Else / elif
    if (trimmedLine.match(/^(else|elif|}\s*else)/)) {
      steps.push({
        id: stepId++,
        lineNumber,
        code: trimmedLine,
        type: "condition",
        explanation: `The ELSE block runs when the previous IF condition was FALSE. It provides an alternative path of execution.`,
        advancedExplanation: `Else branch reached. Previous condition was false, executing alternative block.`,
        variables: cloneVariables(),
        callStack: [...callStack],
      })
      continue
    }

    // Print / console.log / output
    const printMatch = trimmedLine.match(printRegex)
    if (printMatch) {
      const output = printMatch[1].replace(/^["'(]|["');]+$/g, "")
      // Try to evaluate if it's a variable
      const evaluated = evaluateExpression(output)

      steps.push({
        id: stepId++,
        lineNumber,
        code: trimmedLine,
        type: "output",
        explanation: `This line displays "${evaluated}" on the screen. Output statements let us see results and check if our program is working correctly.`,
        advancedExplanation: `Standard output: printing ${JSON.stringify(evaluated)} to console/stdout. Expression evaluated from: ${output}.`,
        variables: cloneVariables(),
        result: evaluated,
        callStack: [...callStack],
      })
      continue
    }

    // Function definitions
    const funcMatch = trimmedLine.match(funcRegex)
    if (funcMatch) {
      const [, funcName, params] = funcMatch
      callStack.push(funcName)
      steps.push({
        id: stepId++,
        lineNumber,
        code: trimmedLine,
        type: "function-call",
        explanation: `We define a function called "${funcName}"${params ? ` with parameters: ${params}` : ""}. A function is a reusable block of code that we can call multiple times.`,
        advancedExplanation: `Function definition: ${funcName}(${params}). Function object created and stored in scope. Not executed until called.`,
        variables: cloneVariables(),
        callStack: [...callStack],
      })
      continue
    }

    // Return statements
    if (trimmedLine.match(/return\s+/)) {
      const returnValue = trimmedLine.replace(/return\s+/, "").replace(/;$/, "")
      const evaluated = evaluateExpression(returnValue)
      if (callStack.length > 1) callStack.pop()

      steps.push({
        id: stepId++,
        lineNumber,
        code: trimmedLine,
        type: "function-return",
        explanation: `The function ends and returns the value "${evaluated}". Control goes back to wherever this function was called from.`,
        advancedExplanation: `Return statement: yielding ${JSON.stringify(evaluated)}. Popping stack frame, returning control to caller.`,
        variables: cloneVariables(),
        result: evaluated,
        callStack: [...callStack],
      })
      continue
    }

    // Skip braces
    if (trimmedLine.match(/^[{}:]+$/)) {
      continue
    }
  }

  // Add end step
  steps.push({
    id: stepId++,
    lineNumber: lines.length,
    code: "Program End",
    type: "end",
    explanation:
      "The program has finished running. All instructions have been executed. Check the Memory Panel to see the final values of all variables.",
    advancedExplanation:
      "Execution complete. All stack frames popped. Final variable state preserved. Exit code: 0 (success).",
    variables: cloneVariables(),
    callStack: ["main"],
  })

  return { steps, functions: [], hasError: false }
}
