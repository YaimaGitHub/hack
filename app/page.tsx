import { LicenseTool } from "@/components/license-tool"

export default function Page() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">bd_pos</span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            license generator
          </span>
        </div>
        <h1 className="mt-3 text-balance text-2xl font-bold text-foreground sm:text-3xl">
          Generador y validador de licencias
        </h1>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Genera licencias válidas para las tablas <code className="font-mono">lic_info</code> y{" "}
          <code className="font-mono">lic_code</code> respetando exactamente la estructura de los volcados SQL. Ajusta el
          tiempo de expiración (<code className="font-mono">qty</code>) a la nueva actualización y descarga el SQL listo
          para importar. Cada licencia generada se auto-valida con <code className="font-mono">password_verify()</code>.
        </p>
      </header>

      <LicenseTool />

      <footer className="mt-12 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          Nota: <code className="font-mono">string</code> y <code className="font-mono">code</code> son hashes bcrypt con
          salt aleatorio. Para que las licencias pasen la validación del sistema, la{" "}
          <span className="text-foreground">fórmula del texto plano</span> debe coincidir con la que usa el PHP en{" "}
          <code className="font-mono">password_verify()</code>. Usa los presets o una plantilla personalizada para
          igualarla.
        </p>
      </footer>
    </main>
  )
}
