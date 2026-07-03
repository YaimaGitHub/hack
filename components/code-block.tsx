"use client"

import { useState } from "react"

export function CodeBlock({
  title,
  code,
  filename,
}: {
  title: string
  code: string
  filename?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  function download() {
    const blob = new Blob([code], { type: "text/sql;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename ?? "output.sql"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
          {filename ? (
            <button
              type="button"
              onClick={download}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Descargar
            </button>
          ) : null}
        </div>
      </div>
      <pre className="max-h-80 overflow-auto px-4 py-3 text-xs leading-relaxed text-foreground">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}
