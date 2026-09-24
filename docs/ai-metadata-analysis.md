# Análisis de documentos con IA — Datos y contrato

Documento de referencia del pipeline de extracción de metadatos con IA (DeepSeek).
Admin UI: `/app/admin/ai-settings` · Código: `GetAiSuggestionsQuery` + `DeepSeekLlmAdapter`.

## 1. Flujo del análisis

```
documento (PDF/imagen/DOCX)
  → ExtractTextAsync (cache .md → MarkItDown → PdfPig → OCR Tesseract)
  → truncado a 50.000 caracteres
  → carga esquema SNRD del tipo de documento (GetMetadataSchemaByTypeQuery)
  → construcción del system prompt ({fields} + reglas)
  → DeepSeek chat/completions
  → parse tolerante (ParseLlmContent)
  → inyecciones determinísticas (format, format_extent)
  → gate "nada útil" → AiSuggestionsDto
```

Endpoint: `GET /api/documents/{id}/ai-suggestions?type=<TipoDocumento>` (requiere auth).
Timeout proxy dedicado: 300s (OCR de escaneados + LLM puede tardar).

## 2. Configuración del proveedor (tabla `ai_provider_config`)

| Campo | Origen | Ejemplo actual |
|---|---|---|
| `api_url` | DB (fallback: appsettings `DeepSeek`) | `https://api.deepseek.com/v1/chat/completions` |
| `api_key` | DB / fallback | (secreto, enmascarado en el API como `********`) |
| `model` | DB / fallback | `deepseek-chat` |
| `max_tokens` | DB / fallback | `4096` |
| `system_prompt` | DB | prompt RDA/SNRD institucional |
| `{fields}` | **obligatorio** en el prompt | el backend lo reemplaza por el bloque de campos |

Si `system_prompt` está vacío se usa el `defaultPrompt` interno del adapter.

## 3. Template del system prompt

- Se lee el prompt **activo** de `ai_provider_config`.
- `{fields}` se reemplaza por el bloque construido en §4.
- Al final se anexa siempre: *"Devuelve SOLO un objeto JSON válido sin formato adicional ni markdown. No incluyas bloques ```json ni explicaciones."*
- El texto extraído del documento (máx 50k chars) va como **mensaje de usuario** separado:
  `Analiza el siguiente texto del documento "<nombre-archivo>": ...`
- Si el PDF tiene páginas contadas, se agrega al final del texto:
  `[INFORMACIÓN TÉCNICA DEL ARCHIVO] El documento es un archivo PDF de {N} páginas en total. Usá exactamente este dato para el campo de extensión (RDA 3.4): no lo deduzcas del texto ni lo inventes.`

## 4. Bloque de campos SNRD (expansión de `{fields}`)

Por cada campo del esquema **no oculto** y con obligatoriness distinta de `NotApplicable`, ordenado por `sortOrder`:

```
"<Label> (<internalName>) — <typeHint><guía>"
```

### 4.1 Type hints

| FieldType | Hint |
|---|---|
| Text | `texto` |
| Textarea | `texto largo` |
| Date | `fecha (AAAA-MM-DD)` |
| Select | `opciones: <v1>, <v2>, ...` (usa EXACTAMENTE una) |
| MultiText | `texto (múltiples valores separados por ;)` |

### 4.2 Guía por campo (orden de prioridad)

1. Si el campo tiene **`AiPrompt`** (`metadata_fields.ai_prompt`) → `| Instrucción IA: <texto>`
2. Si no, si tiene **`HelpText`** → `| Guía de catalogación: <texto>`
3. Si no tiene ninguno → sin guía

> El `AiPrompt` se edita por campo en `/app/admin/ai-settings` (sección Vista previa → Prompts por campo SNRD) o en `/app/admin/metadata-schemas` (⚙️ del campo → textarea Prompt IA). Persistencia: `PUT /api/MetadataSchemas/fields/{id}` con `aiPrompt`.

### 4.3 Instrucciones del bloque (siempre anexadas)

- `metadataValues`: objeto con los campos detectables; las **claves DEBEN ser exactamente los textos entre paréntesis** (los internalName).
- Select: un valor de las opciones indicadas.
- MultiText: separar con `" ; "`.
- Fecha: `AAAA-MM-DD` o **omitir**.
- Sin placeholders ("No detectado", "N/A", vacíos): **omitir el campo**.
- Completar la mayor cantidad posible.

## 5. REGLAS DE IDIOMA (obligatorias, anexadas al bloque)

- NO traducir ningún valor: cada valor en el idioma en que aparece en el documento.
- `abstractEn`: SOLO si el documento contiene un resumen escrito en inglés (transcripción textual). Si no existe → **omitir la clave** (jamás generarlo ni traducirlo).
- `keywordsEn`: solo keywords que aparezcan en inglés en el texto; si no hay → omitir.
- `summary` y `description`: en el idioma del documento.
- Documento íntegramente en español → el JSON **no debe contener** `abstractEn` ni `keywordsEn`.

## 6. Contrato JSON de respuesta (lo que parsea el backend)

El parser (`ParseLlmContent`) es **tolerante**: acepta variantes y nunca lanza excepción (fallback `EmptyResult`).

| Clave esperada | Tipo | Mapeo tolerante |
|---|---|---|
| `summary` | string | string o array→join `" ; "` |
| `description` | string | string o array→join |
| `keywords` | string[] | array; si vacío → `subjects` |
| `keywordsEn` | string[] | array |
| `authors` | string[] | array de strings; si vacío → `creators` (strings u objetos con `name`) |
| `abstractEn` | string\|null | string no vacío; si falta → `null` |
| `publicationVersion` | string\|null | ej. `publishedVersion` |
| `digitalIdentifier` | string\|null | DOI / URI / handle |
| `extractedEntities` | string\|null | string o array→join `" ; "` |
| `confidence` | number | number o string numérico |
| `metadataValues` | objeto | string / number (→ texto) / bool (→ `"true"`/`"false"`) / array de strings (→ join `" ; "`) por clave; se omiten vacíos |

Claves RDA del prompt institucional que NO mapea el parser y se ignoran: `documentType`, `title`, `alternativeTitle`, `creators` (solo `name` → authors), `contributors`, `dateIssued`, `publicationStatement`, `language`, `extent`, `mediaType`, `carrierType`, `accessRights`, `license`, `relatedWorks`.

## 7. Inyecciones determinísticas (post-LLM, no dependen del modelo)

| Campo | Valor | Origen |
|---|---|---|
| `format` (dc.format, Select) | MIME real del archivo (ej. `application/pdf`) | `document_files.mime_type`; solo si la opción existe en el combo del campo |
| `format_extent` (dc.format.extent) | `"{N} p.; 1 PDF"` | conteo real con PdfPig (`GetPdfPageCountAsync`, suma de PDFs); **sobrescribe** lo que diga la IA |

Formato RDA 3.4 según el HelpText del campo: `"N p.; 1 PDF"` (N = páginas reales).

## 8. Gate de "nada útil"

Si `confidence <= 0` **y** no hay `metadataValues` **y** no hay `summary`/`description` **y** no hay keywords → el endpoint devuelve **404** `Could not generate AI suggestions`.

## 9. DTO de respuesta (`AiSuggestionsDto`)

`description`, `abstractEs` (= `summary`), `abstractEn`, `suggestedKeywords`, `suggestedKeywordsEn`, `suggestedAuthors` (name/email:null/orcid:null/order), `suggestedType` (= tipo efectivo usado), `publicationVersion`, `digitalIdentifier`, `metadataValues`.

El frontend (`MetadataEditor`) aplica `metadataValues` a los campos vacíos del `DynamicMetadataForm` (sin pisar valores guardados) y mapea `abstractEn`→`description_abstract`, `keywordsEn`→`subject_other`, version→`type_version`, identifier→`identifier_uri`.

## 10. Puntos de edición (dónde cambiar qué)

| Qué cambiar | Dónde |
|---|---|
| Template global del prompt | `/app/admin/ai-settings` → System Prompt (mantener `{fields}`) |
| Instrucción de UN campo | `/app/admin/ai-settings` → Preview por tipo → textarea del campo, o `/app/admin/metadata-schemas` → ⚙️ del campo |
| Guía de catalogación (visible también como tooltip "?" en formularios) | `HelpText` del campo en `/app/admin/metadata-schemas` |
| Opciones de un combo | Ícono lista (☰) en el campo Select |
| Modelo / tokens / API key | `/app/admin/ai-settings` (la key se enmascara; `********` conserva el valor) |
