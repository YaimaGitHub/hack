"use server"

import bcrypt from "bcryptjs"
import {
  buildPlaintext,
  buildLicInfoDump,
  buildLicCodeDump,
  buildInfoInserts,
  buildCodeInserts,
  formatMysqlDateTime,
  formatGenTime,
  type HashFields,
  type InfoRow,
  type CodeRow,
} from "@/lib/license"

export type GenerateInput = {
  owner: string
  init: string // YYYY-MM-DD
  qty: number // timestamp de expiración (Unix seg)
  licenseId: string // timestamp Unix de creación
  infoTemplate: string
  codeTemplate: string // admite {i}
  codeCount: number
  prefix: "$2y$" | "$2b$" | "$2a$"
  rounds: number
  infoId: number
  codeStartId: number
}

export type GenerateResult = {
  ok: boolean
  error?: string
  infoRow?: InfoRow
  codeRows?: CodeRow[]
  infoPlaintext?: string
  codePlaintexts?: string[]
  infoDump?: string
  codeDump?: string
  infoInserts?: string
  codeInserts?: string
  verified?: boolean
}

// Ajusta el prefijo de versión del hash bcrypt. Para texto ASCII, $2a/$2b/$2y
// son totalmente compatibles con password_verify() de PHP.
function withPrefix(hash: string, prefix: string): string {
  return hash.replace(/^\$2[aby]\$/, prefix)
}

function normalize(hash: string): string {
  // Para verificar con bcryptjs normalizamos a $2a$ (equivalente para ASCII).
  return hash.replace(/^\$2[by]\$/, "$2a$")
}

export async function generateLicense(input: GenerateInput): Promise<GenerateResult> {
  try {
    const rounds = Math.min(Math.max(Math.floor(input.rounds) || 10, 4), 15)
    const fields: HashFields = {
      owner: input.owner,
      init: input.init,
      qty: input.qty,
      license_id: input.licenseId,
    }

    const now = new Date()
    const updatedAt = formatMysqlDateTime(now)

    // --- lic_info ---
    const infoPlaintext = buildPlaintext(input.infoTemplate, fields)
    const infoHashRaw = await bcrypt.hash(infoPlaintext, rounds)
    const infoHash = withPrefix(infoHashRaw, input.prefix)

    const infoRow: InfoRow = {
      id: input.infoId,
      init: input.init,
      qty: input.qty,
      owner: input.owner,
      string: infoHash,
      license_id: input.licenseId,
      updated_at: updatedAt,
    }

    // --- lic_code ---
    const count = Math.min(Math.max(Math.floor(input.codeCount) || 1, 1), 50)
    const codeRows: CodeRow[] = []
    const codePlaintexts: string[] = []
    for (let i = 0; i < count; i++) {
      const plain = buildPlaintext(input.codeTemplate, fields).replaceAll("{i}", String(i + 1))
      const raw = await bcrypt.hash(plain, rounds)
      codePlaintexts.push(plain)
      codeRows.push({
        id: input.codeStartId + i,
        code: withPrefix(raw, input.prefix),
        updated_at: updatedAt,
      })
    }

    // --- verificación interna (auto-validación de las licencias generadas) ---
    const infoOk = await bcrypt.compare(infoPlaintext, normalize(infoHash))
    let codesOk = true
    for (let i = 0; i < codeRows.length; i++) {
      const ok = await bcrypt.compare(codePlaintexts[i], normalize(codeRows[i].code))
      if (!ok) codesOk = false
    }

    const genTime = formatGenTime(now)

    return {
      ok: true,
      infoRow,
      codeRows,
      infoPlaintext,
      codePlaintexts,
      infoDump: buildLicInfoDump([infoRow], genTime),
      codeDump: buildLicCodeDump(codeRows, genTime),
      infoInserts: buildInfoInserts([infoRow]),
      codeInserts: buildCodeInserts(codeRows),
      verified: infoOk && codesOk,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

export type ValidateInput = {
  plaintext?: string
  fields?: HashFields
  template?: string
  hash: string
}

export type ValidateResult = {
  ok: boolean
  valid?: boolean
  usedPlaintext?: string
  error?: string
}

// Valida una licencia igual que lo haría password_verify() en PHP.
export async function validateLicense(input: ValidateInput): Promise<ValidateResult> {
  try {
    let plain = input.plaintext ?? ""
    if (!plain && input.fields && input.template) {
      plain = buildPlaintext(input.template, input.fields)
    }
    if (!plain) return { ok: false, error: "Falta el texto plano o los campos + plantilla." }
    if (!/^\$2[aby]\$/.test(input.hash)) {
      return { ok: false, error: "El hash no tiene formato bcrypt ($2y$/$2b$/$2a$)." }
    }
    const valid = await bcrypt.compare(plain, normalize(input.hash))
    return { ok: true, valid, usedPlaintext: plain }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}
