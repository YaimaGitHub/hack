// Núcleo de la lógica de licencias para las tablas `lic_info` y `lic_code`
// de la base de datos `bd_pos`. Mantiene EXACTAMENTE la estructura de los
// volcados SQL originales (phpMyAdmin 4.7.4 / MariaDB 10.1.29).

export type HashFields = {
  owner: string
  init: string // YYYY-MM-DD
  qty: number // timestamp de expiración (Unix, segundos)
  license_id: string // timestamp Unix de creación
}

// Plantilla del texto plano que el sistema PHP pasa a password_verify().
// Tokens disponibles: {owner} {init} {qty} {license_id}
// Presets pensados según la estructura interna de lic_info.
export const PLAINTEXT_PRESETS: { id: string; label: string; template: string }[] = [
  { id: "license_id", label: "Solo license_id", template: "{license_id}" },
  { id: "owner_license", label: "owner + license_id", template: "{owner}{license_id}" },
  { id: "owner_init_qty", label: "owner + init + qty", template: "{owner}{init}{qty}" },
  { id: "license_qty", label: "license_id + qty", template: "{license_id}{qty}" },
  {
    id: "full",
    label: "owner|init|qty|license_id",
    template: "{owner}|{init}|{qty}|{license_id}",
  },
  { id: "custom", label: "Personalizada", template: "{owner}{init}{qty}{license_id}" },
]

export function buildPlaintext(template: string, f: HashFields): string {
  return template
    .replaceAll("{owner}", f.owner)
    .replaceAll("{init}", f.init)
    .replaceAll("{qty}", String(f.qty))
    .replaceAll("{license_id}", f.license_id)
}

// Escapa una cadena para uso seguro dentro de comillas simples en SQL.
export function sqlEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

// Formatea una fecha como 'YYYY-MM-DD HH:MM:SS' (formato timestamp de MySQL, UTC).
export function formatMysqlDateTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
  )
}

export function formatGenTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} a las ${p(
    d.getUTCHours(),
  )}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
}

const DUMP_HEADER = (genTime: string) => `-- phpMyAdmin SQL Dump
-- version 4.7.4
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: ${genTime}
-- Versión del servidor: 10.1.29-MariaDB
-- Versión de PHP: 7.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: \`bd_pos\`
--

-- --------------------------------------------------------
`

const DUMP_FOOTER = `
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
`

export type InfoRow = {
  id: number
  init: string
  qty: number
  owner: string
  string: string
  license_id: string
  updated_at: string
}

export type CodeRow = {
  id: number
  code: string
  updated_at: string
}

// Genera el volcado completo de lic_info respetando la estructura original.
export function buildLicInfoDump(rows: InfoRow[], genTime: string): string {
  const values = rows
    .map(
      (r) =>
        `(${r.id}, '${sqlEscape(r.init)}', ${r.qty}, '${sqlEscape(r.owner)}', '${sqlEscape(
          r.string,
        )}', '${sqlEscape(r.license_id)}', '${sqlEscape(r.updated_at)}')`,
    )
    .join(",\n")

  return `${DUMP_HEADER(genTime)}
--
-- Estructura de tabla para la tabla \`lic_info\`
--

CREATE TABLE \`lic_info\` (
  \`id\` int(11) NOT NULL,
  \`init\` date NOT NULL,
  \`qty\` int(11) NOT NULL,
  \`owner\` varchar(250) NOT NULL,
  \`string\` varchar(250) NOT NULL,
  \`license_id\` varchar(250) NOT NULL,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla \`lic_info\`
--

INSERT INTO \`lic_info\` (\`id\`, \`init\`, \`qty\`, \`owner\`, \`string\`, \`license_id\`, \`updated_at\`) VALUES
${values};

--
-- Disparadores \`lic_info\`
--
DELIMITER $$
CREATE TRIGGER \`after_lic_info_delete\` AFTER DELETE ON \`lic_info\` FOR EACH ROW BEGIN INSERT INTO log_eliminaciones (tabla, registro_id) VALUES ('lic_info', OLD.id); END
$$
DELIMITER ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla \`lic_info\`
--
ALTER TABLE \`lic_info\`
  ADD PRIMARY KEY (\`id\`);
COMMIT;
${DUMP_FOOTER}`
}

// Genera el volcado completo de lic_code respetando la estructura original.
export function buildLicCodeDump(rows: CodeRow[], genTime: string): string {
  const values = rows
    .map((r) => `(${r.id}, '${sqlEscape(r.code)}', '${sqlEscape(r.updated_at)}')`)
    .join(",\n")
  const autoIncrement = rows.length + 1

  return `${DUMP_HEADER(genTime)}
--
-- Estructura de tabla para la tabla \`lic_code\`
--

CREATE TABLE \`lic_code\` (
  \`id\` int(11) NOT NULL,
  \`code\` varchar(250) NOT NULL,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla \`lic_code\`
--

INSERT INTO \`lic_code\` (\`id\`, \`code\`, \`updated_at\`) VALUES
${values};

--
-- Disparadores \`lic_code\`
--
DELIMITER $$
CREATE TRIGGER \`after_lic_code_delete\` AFTER DELETE ON \`lic_code\` FOR EACH ROW BEGIN INSERT INTO log_eliminaciones (tabla, registro_id) VALUES ('lic_code', OLD.id); END
$$
DELIMITER ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla \`lic_code\`
--
ALTER TABLE \`lic_code\`
  ADD PRIMARY KEY (\`id\`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla \`lic_code\`
--
ALTER TABLE \`lic_code\`
  MODIFY \`id\` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=${autoIncrement};
COMMIT;
${DUMP_FOOTER}`
}

// Solo las sentencias INSERT (útil para actualizar registros existentes).
export function buildInfoInserts(rows: InfoRow[]): string {
  const values = rows
    .map(
      (r) =>
        `(${r.id}, '${sqlEscape(r.init)}', ${r.qty}, '${sqlEscape(r.owner)}', '${sqlEscape(
          r.string,
        )}', '${sqlEscape(r.license_id)}', '${sqlEscape(r.updated_at)}')`,
    )
    .join(",\n")
  return `INSERT INTO \`lic_info\` (\`id\`, \`init\`, \`qty\`, \`owner\`, \`string\`, \`license_id\`, \`updated_at\`) VALUES\n${values};`
}

export function buildCodeInserts(rows: CodeRow[]): string {
  const values = rows
    .map((r) => `(${r.id}, '${sqlEscape(r.code)}', '${sqlEscape(r.updated_at)}')`)
    .join(",\n")
  return `INSERT INTO \`lic_code\` (\`id\`, \`code\`, \`updated_at\`) VALUES\n${values};`
}
