"use client"

import { useState, useTransition } from "react"
import { validateLicense, type ValidateResult } from "@/app/actions"
import { PLAINTEXT_PRESETS } from "@/lib/license"
import { Field, inputClass, selectClass } from "./field"

export function Validator() {
  const [mode, setMode] = useState<"plain" | "fields">("fields")

  // modo texto plano
  const [plaintext, setPlaintext] = useState("")

  // modo campos + plantilla
  const [owner, setOwner] = useState("Any")
  const [init, setInit] = useState("2025-10-21")
  const [qty, setQty] = useState("360000")
  const [licenseId, setLicenseId] = useState("1777573127")
  const [template, setTemplate] = useState(PLAINTEXT_PRESETS[0].template)

  const [hash, setHash] = useState("")
  const [result, setResult] = useState<ValidateResult | null>(null)
  const [pending, startTransition] = useTransition()

  function onValidate() {
    startTransition(async () => {
      const res = await validateLicense(
        mode === "plain"
          ? { plaintext, hash }
          : {
              fields: { owner, init, qty: Number(qty), license_id: licenseId },
              template,
              hash,
            },
      )
      setResult(res)
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Validar licencia</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Comprueba un hash exactamente como <code className="font-mono">password_verify()</code> en PHP.
          </p>
        </div>

        <div className="flex gap-2 rounded-md border border-border bg-input p-1">
          <button
            type="button"
            onClick={() => setMode("fields")}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition ${
              mode === "fields" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Campos + plantilla
          </button>
          <button
            type="button"
            onClick={() => setMode("plain")}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition ${
              mode === "plain" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Texto plano
          </button>
        </div>

        {mode === "plain" ? (
          <Field label="Texto plano" hint="El valor exacto que se hashea" htmlFor="plain">
            <input id="plain" className={inputClass} value={plaintext} onChange={(e) => setPlaintext(e.target.value)} />
          </Field>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="owner" htmlFor="v-owner">
                <input id="v-owner" className={inputClass} value={owner} onChange={(e) => setOwner(e.target.value)} />
              </Field>
              <Field label="init" htmlFor="v-init">
                <input id="v-init" className={inputClass} value={init} onChange={(e) => setInit(e.target.value)} />
              </Field>
              <Field label="qty" htmlFor="v-qty">
                <input id="v-qty" className={inputClass} value={qty} onChange={(e) => setQty(e.target.value)} />
              </Field>
              <Field label="license_id" htmlFor="v-lid">
                <input id="v-lid" className={inputClass} value={licenseId} onChange={(e) => setLicenseId(e.target.value)} />
              </Field>
            </div>
            <Field label="Plantilla" hint="Tokens: {owner} {init} {qty} {license_id}">
              <select
                className={selectClass}
                value={PLAINTEXT_PRESETS.find((p) => p.template === template)?.id ?? "custom"}
                onChange={(e) => {
                  const p = PLAINTEXT_PRESETS.find((x) => x.id === e.target.value)
                  if (p) setTemplate(p.template)
                }}
              >
                {PLAINTEXT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Plantilla (editable)" htmlFor="v-tpl">
              <input id="v-tpl" className={inputClass} value={template} onChange={(e) => setTemplate(e.target.value)} />
            </Field>
          </>
        )}

        <Field label="Hash bcrypt (string / code)" hint="$2y$… / $2b$… / $2a$…" htmlFor="v-hash">
          <input id="v-hash" className={inputClass} value={hash} onChange={(e) => setHash(e.target.value)} />
        </Field>

        <button
          type="button"
          onClick={onValidate}
          disabled={pending || !hash}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Validando…" : "Validar"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {!result ? (
          <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            Introduce un hash y pulsa <span className="mx-1 font-medium text-foreground">Validar</span>.
          </div>
        ) : !result.ok ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive-foreground">
            Error: {result.error}
          </div>
        ) : (
          <div
            className={`rounded-xl border p-5 ${
              result.valid
                ? "border-primary/40 bg-primary/10"
                : "border-destructive/50 bg-destructive/10"
            }`}
          >
            <p className="text-lg font-semibold text-foreground">
              {result.valid ? "Licencia VÁLIDA" : "Licencia NO válida"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Texto plano comprobado:</p>
            <code className="mt-1 block break-all font-mono text-sm text-foreground">{result.usedPlaintext}</code>
          </div>
        )}
      </div>
    </div>
  )
}
