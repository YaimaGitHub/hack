"use client"

import { useState } from "react"
import { Generator } from "./generator"
import { Validator } from "./validator"

export function LicenseTool() {
  const [tab, setTab] = useState<"gen" | "val">("gen")

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex w-fit gap-1 rounded-lg border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setTab("gen")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "gen" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Generar
        </button>
        <button
          type="button"
          onClick={() => setTab("val")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "val" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Validar
        </button>
      </div>

      {tab === "gen" ? <Generator /> : <Validator />}
    </div>
  )
}
