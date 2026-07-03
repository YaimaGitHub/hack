"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { generateLicense, type GenerateResult } from "@/app/actions"
import { PLAINTEXT_PRESETS } from "@/lib/license"
import { Field, inputClass, selectClass } from "./field"
import { CodeBlock } from "./code-block"

function nowUnix() {
  return Math.floor(Date.now() / 1000)
}

function toDateInput(unix: number) {
  return new Date(unix * 1000).toISOString().slice(0, 10)
}

function toDatetimeLocal(unix: number) {
  return new Date(unix * 1000).toISOString().slice(0, 16)
}

export function Generator() {
  const [mounted, setMounted] = useState(false)
  const [owner, setOwner] = useState("Any")
  const [init, setInit] = useState("")
  const [expLocal, setExpLocal] = useState("")
  const [licenseId, setLicenseId] = useState("")

  // Los valores basados en la hora actual se rellenan tras el montaje
  // para evitar desajustes de hidratación entre servidor y cliente.
  useEffect(() => {
    const created = nowUnix()
    const defaultExp = created + 365 * 24 * 3600
    setInit(toDateInput(created))
    setExpLocal(toDatetimeLocal(defaultExp))
    setLicenseId(String(created))
    setMounted(true)
  }, [])
  const [presetId, setPresetId] = useState("license_id")
  const [infoTemplate, setInfoTemplate] = useState(PLAINTEXT_PRESETS[0].template)
  const [codeTemplate, setCodeTemplate] = useState("{license_id}-{i}")
  const [codeCount, setCodeCount] = useState(7)
  const [prefix, setPrefix] = useState<"$2y$" | "$2b$" | "$2a$">("$2y$")
  const [rounds, setRounds] = useState(10)

  const [result, setResult] = useState<GenerateResult | null>(null)
  const [pending, startTransition] = useTransition()

  const qty = useMemo(() => Math.floor(new Date(expLocal).getTime() / 1000) || 0, [expLocal])
  const qtyReadable = useMemo(() => {
    if (!qty) return "—"
    return new Date(qty * 1000).toUTCString()
  }, [qty])

  function onPreset(id: string) {
    setPresetId(id)
    const p = PLAINTEXT_PRESETS.find((x) => x.id === id)
    if (p && id !== "custom") setInfoTemplate(p.template)
  }

  function onGenerate() {
    startTransition(async () => {
      const res = await generateLicense({
        owner,
        init,
        qty,
        licenseId,
        infoTemplate,
        codeTemplate,
        codeCount,
        prefix,
        rounds,
        infoId: 1,
        codeStartId: 1,
      })
      setResult(res)
    })
  }

  function syncLicenseToNow() {
    const n = nowUnix()
    setLicenseId(String(n))
    setInit(toDateInput(n))
  }

  if (!mounted) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-sm text-muted-foreground">
        Cargando generador…
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Formulario */}
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Datos de la licencia (lic_info)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Los valores respetan la estructura de la tabla <code className="font-mono">lic_info</code>.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="owner" hint="Propietario de la licencia" htmlFor="owner">
            <input id="owner" className={inputClass} value={owner} onChange={(e) => setOwner(e.target.value)} />
          </Field>
          <Field label="init (fecha de inicio)" hint="Formato date: YYYY-MM-DD" htmlFor="init">
            <input id="init" type="date" className={inputClass} value={init} onChange={(e) => setInit(e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="qty (expiración)"
            hint={`Timestamp Unix = ${qty || "—"}`}
            htmlFor="exp"
          >
            <input
              id="exp"
              type="datetime-local"
              className={inputClass}
              value={expLocal}
              onChange={(e) => setExpLocal(e.target.value)}
            />
          </Field>
          <Field label="license_id" hint="Timestamp Unix de creación" htmlFor="lid">
            <div className="flex gap-2">
              <input id="lid" className={inputClass} value={licenseId} onChange={(e) => setLicenseId(e.target.value)} />
              <button
                type="button"
                onClick={syncLicenseToNow}
                className="shrink-0 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Ahora
              </button>
            </div>
          </Field>
        </div>

        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Expira: <span className="text-foreground">{qtyReadable}</span>
        </p>

        <div className="h-px bg-border" />

        <div>
          <h3 className="text-sm font-semibold text-foreground">Fórmula del hash (string / code)</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Texto plano que el sistema pasa a <code className="font-mono">password_verify()</code>. Tokens:{" "}
            <code className="font-mono">{"{owner} {init} {qty} {license_id}"}</code>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preset de fórmula (string)">
            <select className={selectClass} value={presetId} onChange={(e) => onPreset(e.target.value)}>
              {PLAINTEXT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Plantilla string (lic_info)" htmlFor="tpl">
            <input
              id="tpl"
              className={inputClass}
              value={infoTemplate}
              onChange={(e) => {
                setInfoTemplate(e.target.value)
                setPresetId("custom")
              }}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Plantilla code (lic_code)" hint="Usa {i} para el índice" htmlFor="ctpl">
            <input id="ctpl" className={inputClass} value={codeTemplate} onChange={(e) => setCodeTemplate(e.target.value)} />
          </Field>
          <Field label="Nº de codes" htmlFor="ccount">
            <input
              id="ccount"
              type="number"
              min={1}
              max={50}
              className={inputClass}
              value={codeCount}
              onChange={(e) => setCodeCount(Number(e.target.value))}
            />
          </Field>
          <Field label="Coste bcrypt" hint="4–15 (dumps usan 10)" htmlFor="rounds">
            <input
              id="rounds"
              type="number"
              min={4}
              max={15}
              className={inputClass}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label="Prefijo de versión bcrypt" hint="$2y$ = PHP · $2b$ = Node. Compatibles con password_verify().">
          <select className={selectClass} value={prefix} onChange={(e) => setPrefix(e.target.value as typeof prefix)}>
            <option value="$2y$">$2y$ (PHP nativo)</option>
            <option value="$2b$">$2b$ (Node / bcryptjs)</option>
            <option value="$2a$">$2a$ (clásico)</option>
          </select>
        </Field>

        <button
          type="button"
          onClick={onGenerate}
          disabled={pending}
          className="mt-1 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Generando…" : "Generar licencia + SQL"}
        </button>
      </div>

      {/* Resultados */}
      <div className="flex flex-col gap-4">
        {!result ? (
          <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            Configura los datos y pulsa <span className="mx-1 font-medium text-foreground">Generar</span> para obtener el
            SQL listo para <code className="mx-1 font-mono">bd_pos</code>.
          </div>
        ) : !result.ok ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive-foreground">
            Error: {result.error}
          </div>
        ) : (
          <>
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                result.verified
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-destructive/50 bg-destructive/10 text-destructive-foreground"
              }`}
            >
              <span className="font-semibold">
                {result.verified ? "Licencia validada correctamente" : "La verificación falló"}
              </span>
              {result.verified ? (
                <span className="text-muted-foreground">— los hashes pasan password_verify()</span>
              ) : null}
            </div>

            <div className="rounded-lg border border-border bg-card p-4 text-xs">
              <p className="mb-1 text-muted-foreground">Texto plano usado (string):</p>
              <code className="font-mono text-foreground break-all">{result.infoPlaintext}</code>
            </div>

            <CodeBlock title="lic_info.sql" code={result.infoDump ?? ""} filename="lic_info.sql" />
            <CodeBlock title="lic_code.sql" code={result.codeDump ?? ""} filename="lic_code.sql" />
            <CodeBlock title="Solo INSERT (lic_info)" code={result.infoInserts ?? ""} />
            <CodeBlock title="Solo INSERT (lic_code)" code={result.codeInserts ?? ""} />
          </>
        )}
      </div>
    </div>
  )
}
