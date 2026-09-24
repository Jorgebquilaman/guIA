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

---

## Anexo A — Esquemas SNRD configurados en producción

Bloque `{fields}` exacto que recibe la IA para cada tipo de documento
(generado desde la configuración vigente; campos ordenados por `sortOrder`).

### Artículo — Artículo

- Campos configurables enviados a la IA: **32** (ocultos excluidos: 0)

```text
  "Resumen / Abstract (description) — texto largo | Guía de catalogación: SNRD: resumen o abstract del artículo en el idioma del texto, transcrito tal como lo publica la revista (abstract de autor). Las traducciones del resumen van en dc.description.abstract.": "<valor extraído>"
  "Notas / Observaciones (description_notes) — texto largo | Guía de catalogación: Local: notas de catalogación: información de financiamiento (grants/agencias), erratas, datos complementarios, o aclaraciones sobre la revisión. No duplicar información ya registrada en otros campos.": "<valor extraído>"
  "Formato (format) — opciones: image/png, application/zip, application/json, application/pdf, image/jpeg, image/tiff, application/xml, text/plain | Guía de catalogación: SNRD: seleccionar el MIME del archivo principal. En artículos es casi siempre application/pdf (versión editorial o postprint). Un formato por ítem; formatos acompañantes se anotan en dc.description.notes.": "<valor extraído>"
  "Título (title) — texto | Guía de catalogación: RDA 2.3: transcribir el título propio del artículo tal como figura en el encabezado de la versión publicada; incluir subtítulo separado por ":". Sin abreviaturas ni GMD.": "<valor extraído>"
  "Título alternativo (title_alternative) — texto | Guía de catalogación: RDA 2.3: título paralelo en otro idioma o variante del título de la versión publicada (Ej.: título del preprint). No reemplaza al título propio del encabezado.": "<valor extraído>"
  "Autor/es (creator) — texto | Guía de catalogación: RDA 9: nombre personal tal como firma en el byline del artículo, en el orden y forma en que aparece; una instancia por autor. Sin grados ni títulos. El ORCID, si la revista lo provee, va en dc.identifier.other.": "<valor extraído>"
  "Editor / Traductor / Coordinador (contributor) — texto | Guía de catalogación: RDA 9 / RDA 11: contribuyentes secundarios del artículo o del dossier: traductor, editor o coordinador, con el rol al final (trad., ed., coord.). Los autores van en dc.creator.": "<valor extraído>"
  "Materias / Descriptores (subject) — texto | Guía de catalogación: SNRD: palabras clave del trabajo más descriptores asignados por el catalogador; un concepto por instancia. Preferir vocabulario controlado institucional si existe; no mezclar idiomas.": "<valor extraído>"
  "Descriptores en otro idioma (subject_other) — texto | Guía de catalogación: SNRD: descriptores o keywords en otro idioma (típicamente inglés en revistas bilingües). No mezclar con los descriptores en el idioma del artículo, que van en dc.subject.": "<valor extraído>"
  "Resumen en otro idioma (description_abstract) — texto largo | Guía de catalogación: SNRD: traducción del resumen a otro idioma tal como la publica la revista (típicamente inglés). No mezclar con el resumen en el idioma del texto, que va en dc.description.": "<valor extraído>"
  "Filiación institucional (description_fil) — texto | Guía de catalogación: SNRD: sintaxis estricta "Fil: Apellido, Nombre. Institución Mayor. Dependencia. País." Registrar la filiación declarada por el autor al momento de la publicación, aunque difiera de la actual. Repetir por cada filiación distinta.": "<valor extraído>"
  "Editorial / Institución editora de la revista (publisher) — texto | Guía de catalogación: RDA 2.8–2.10: institución o editorial responsable de la publicación de la revista que contiene el artículo. El título de la revista va en dc.source; no duplicarlo aquí.": "<valor extraído>"
  "Fecha de publicación (date) — fecha (AAAA-MM-DD) | Guía de catalogación: ISO 8601 + RDA: fecha de publicación del artículo o del número de la revista. Usar formato completo AAAA-MM-DD si la revista lo provee (común en online-first); si no, AAAA.": "<valor extraído>"
  "Tipo de documento (type) — opciones: article | Guía de catalogación: SNRD: en este esquema el valor es fijo: article (artículo de revista con referato). No usar para ponencias ni capítulos de libro: tienen esquema propio.": "<valor extraído>"
  "Tipo OpenAIRE / SNRD (type_driver) — opciones: info:eu-repo/semantics/article": "<valor extraído>"
  "Versión de la publicación (type_version) — opciones: draft, acceptedVersion, publishedVersion, submittedVersion": "<valor extraído>"
  "Páginas / Extensión (format_extent) — texto | Guía de catalogación: RDA 3.4: registrar el rango de páginas del artículo dentro de la revista (Ej.: p. 112-129). Si la revista usa números de artículo electrónicos en lugar de paginación, registrar el número (Ej.: e0123).": "<valor extraído>"
  "Identificador del recurso (identifier) — texto | Guía de catalogación: Local: identificador persistente (handle/URI) del ítem en el repositorio. Si el sistema lo asigna al depositar, no editar; si no, cargar el handle/URI asignado por la institución.": "<valor extraído>"
  "ISSN (identifier_issn) — texto | Guía de catalogación: ISO 3297: ISSN de la revista contenedora con guion (Ej.: 1234-5678). Si la revista tiene ISSN impreso y electrónico (e-ISSN), registrar ambos separados por coma o aclarando la versión (Ej.: 1234-5678 (impreso), 2345-6789 (en línea)).": "<valor extraído>"
  "Otro identificador (DOI, URI editorial…) (identifier_other) — texto | Guía de catalogación: Local: registrar el DOI del artículo, enlaces alternativos u otros identificadores normalizados. Indicar siempre el tipo (Ej.: DOI: 10.1234/revista.2024.001). En artículos científicos, el DOI es casi obligatorio de facto.": "<valor extraído>"
  "Fuente / Revista contenedora (source) — texto | Guía de catalogación: RDA (obra contenida): mención completa de la revista contenedora. Formato sugerido: Título de la revista, volumen(número), año, páginas. (Ej.: Revista Argentina de Educación, 12(3), 2024, p. 45-60).": "<valor extraído>"
  "URL oficial / Enlace al artículo o revista (source_uri) — texto | Guía de catalogación: Local: enlace permanente al artículo en el sitio de la revista, o al portal de la publicación. Debe comenzar con http(s)://. Si el enlace es el DOI resuelto, puede usarse aquí. Evitar URLs temporales o de sesión.": "<valor extraído>"
  "Idioma (language) — opciones: pt, ay, arn, es, und, qu, fr, gn, zxx, it, la, en, de | Guía de catalogación: ISO 639-1: idioma principal del texto del artículo en código de dos letras (es, en, pt…). Repetir el campo en artículos bilingües publicados en dos idiomas.": "<valor extraído>"
  "Relación / Dossier o número especial (relation) — texto | Guía de catalogación: Local: nombre del dossier temático, número especial o sección monográfica que agrupa al artículo (Ej.: Dossier: Nuevas perspectivas en educación superior). También para enlaces a datasets o materiales complementarios. No duplicar el título de la revista.": "<valor extraído>"
  "Parte de (URI de la revista o número) (relation_isPartOf) — texto | Guía de catalogación: Local: enlace o identificador persistente (URI, Handle, URL del portal OJS) que identifica a la revista o al número específico como entidad contenedora. No duplicar la URL del artículo (esa va en source.uri).": "<valor extraído>"
  "Cobertura (coverage) — texto | Guía de catalogación: Local: alcance de la investigación descrita en el artículo: espacial, temporal o de la muestra (Ej.: Argentina, 2001-2020; Pacientes con diabetes tipo 2 del Hospital X). No duplicar conceptos temáticos (van en subject).": "<valor extraído>"
  "Derechos (rights) — opciones: Acceso público con protección de datos personales (Ley 25.326)., Acceso restringido por confidencialidad legal o contractual., Acceso público. Obra de acceso abierto; su reproducción debe respetar la integridad del texto y los derechos de autoría. | Guía de catalogación: Local: seleccionar la declaración institucional de derechos que corresponde al ítem. No cargar aquí URIs info:eu-repo (van en "Nivel de accesibilidad").": "<valor extraído>"
  "Nivel de accesibilidad (rights_accessRights) — opciones: info:eu-repo/semantics/restrictedAccess, info:eu-repo/semantics/embargoedAccess, info:eu-repo/semantics/openAccess, info:eu-repo/semantics/closedAccess | Guía de catalogación: OpenAIRE: seleccionar info:eu-repo/semantics/openAccess, embargoedAccess, restrictedAccess o closedAccess. Si se elige embargoedAccess, completar obligatoriamente Fin de embargo (#30).": "<valor extraído>"
  "Licencia (rights_license) — opciones: CC BY-ND, CC BY, CC BY-NC, CC BY-NC-SA, Otra declaración institucional, CC BY-SA, CC0, CC BY-NC-ND, Public Domain Mark, In Copyright | Guía de catalogación: CC BY|CC BY-SA|CC BY-NC|CC BY-NC-SA|CC BY-ND|CC BY-NC-ND|CC0|Public Domain Mark|In Copyright|Otra declaración institucional": "<valor extraído>"
  "Titular de derechos (rights_holder) — texto | Guía de catalogación: Local: persona o institución titular de los derechos patrimoniales del artículo. En artículos suele ser el/los autor/es, salvo cesión de derechos a la editorial o sociedad científica; revisar el contrato o el pie del PDF. Repetir si hay cotitulares.": "<valor extraído>"
  "Fin de embargo (embargoEnd) — fecha (AAAA-MM-DD) | Guía de catalogación: ISO 8601 + OpenAIRE: fecha en que cesa el embargo y el ítem pasa a acceso abierto (AAAA-MM-DD). Obligatoria solo si Nivel de accesibilidad = embargoedAccess; en cualquier otro caso dejar vacía.": "<valor extraído>"
  "Procedencia (description_provenance) — texto | Guía de catalogación: Local: origen del ejemplar digitalizado (Ej.: Hemeroteca, digitalización de revista antigua) o del depósito digital (Ej.: Migración desde OJS 2 / Repositorio legado).": "<valor extraído>"
```

### Libro — Libro / parte de libro

- Campos configurables enviados a la IA: **32** (ocultos excluidos: 0)

```text
  "Notas / Observaciones (description_notes) — texto largo | Guía de catalogación: Local: notas de catalogación: otras ediciones, reimpresiones, material acompañante, restricciones de uso o sensibilidad del contenido. No duplicar información ya registrada en otros campos.": "<valor extraído>"
  "Título (title) — texto | Guía de catalogación: RDA 2.3: transcribir el título propio tal como figura en la portada (fuente preferida del libro); incluir el subtítulo separado por ":". Sin abreviaturas ni GMD.": "<valor extraído>"
  "Título alternativo (title_alternative) — texto | Guía de catalogación: RDA 2.3: registrar variantes del título: título de cubierta, título paralelo o de otra fuente del libro. No reemplaza al título propio de portada (dc.title).": "<valor extraído>"
  "Autor/es (creator) — texto | Guía de catalogación: RDA 9: registrar el nombre personal tal como figura en la portada, en orden directo (Nombre Apellido); una instancia por autor. Sin abreviaturas ni grados académicos. Si la obra es institucional, usar el nombre de la corporación (RDA 11).": "<valor extraído>"
  "Editor / Compilador / Traductor (contributor) — texto | Guía de catalogación: RDA 9 / RDA 11: registrar contribuyentes secundarios con el nombre tal como figura, indicando el rol al final: (ed.), (comp.), (trad.), (pról.). No cargar aquí autores: van en dc.creator.": "<valor extraído>"
  "Materias / Descriptores (subject) — texto | Guía de catalogación: SNRD: conceptos temáticos de la obra; un descriptor por instancia. Preferir vocabulario controlado institucional si existe; si no, términos en lenguaje natural sin abreviaturas.": "<valor extraído>"
  "Descriptores en otro idioma (subject_other) — texto | Guía de catalogación: SNRD: descriptores o palabras clave en otro idioma (inglés u otro). No mezclar con los descriptores en el idioma de la obra, que van en dc.subject.": "<valor extraído>"
  "Resumen en otro idioma (description_abstract) — texto largo | Guía de catalogación: SNRD: traducción del resumen a otro idioma, si existe. No mezclar con el resumen en el idioma de la obra, que va en dc.description.": "<valor extraído>"
  "Filiación institucional (description_fil) — texto | Guía de catalogación: SNRD: sintaxis estricta "Fil: Apellido, Nombre. Institución Mayor. Dependencia. País." En libros, registrar la filiación del/los autor/es al momento de la obra. Repetir por cada filiación distinta.": "<valor extraído>"
  "Editorial / Institución (publisher) — texto | Guía de catalogación: RDA 2.8–2.10 (publicación): transcribir el nombre de la editorial tal como figura en la portada, sin abreviaturas. Si es editorial universitaria, incluir la universidad. Ej.: Editorial Universitaria de la UNC.": "<valor extraído>"
  "Fecha de publicación (date) — fecha (AAAA-MM-DD) | Guía de catalogación: ISO 8601 + RDA: año de publicación de la edición que se describe; si no figura, usar el año de copyright (©). Formato completo AAAA-MM-DD si se conoce; si no, AAAA.": "<valor extraído>"
  "Tipo de documento (type) — opciones: bookPart, book | Guía de catalogación: SNRD: seleccionar book para libro completo y bookPart para capítulo o parte de libro. Este valor condiciona cómo se completan dc.relation.isPartOf y dc.source.": "<valor extraído>"
  "Tipo OpenAIRE / SNRD (type_driver) — opciones: info:eu-repo/semantics/book, info:eu-repo/semantics/bookPart | Guía de catalogación: OpenAIRE: info:eu-repo/semantics/book para libro completo e info:eu-repo/semantics/bookPart para capítulo. Debe ser coherente con dc.type: book↔book, bookPart↔bookPart.": "<valor extraído>"
  "Versión de la publicación (type_version) — opciones: submittedVersion, acceptedVersion, publishedVersion, draft | Guía de catalogación: DRIVER: versión editorial del recurso. En libros y capítulos publicados usar publishedVersion; draft para manuscritos no editados; acceptedVersion para la versión aceptada previa a maquetación.": "<valor extraído>"
  "Formato (format) — opciones: application/xml, application/pdf, image/jpeg, application/zip, text/plain, application/json, image/tiff, image/png | Guía de catalogación: SNRD: seleccionar el MIME del archivo principal. Preferir application/pdf para libros y capítulos. En Libro no se repite: un formato por ítem; otros formatos acompañantes se anotan en dc.description.notes.": "<valor extraído>"
  "Páginas / Extensión (format_extent) — texto | Guía de catalogación: RDA 3.4: registrar la extensión: en libros, la paginación total (Ej.: 254 p.); en capítulos (bookPart), el rango de páginas dentro del libro contenedor (Ej.: p. 45-68).": "<valor extraído>"
  "Identificador del recurso (identifier) — texto | Guía de catalogación: Local: identificador persistente (handle/URI) del ítem en el repositorio. Si el sistema lo asigna al depositar, no editar; si no, cargar el handle/URI asignado por la institución.": "<valor extraído>"
  "ISBN (identifier_isbn) — texto | Guía de catalogación: ISO 2108: ISBN-13 con guiones (prefijo 978/979). Ej.: 978-987-123-456-7. En obras anteriores a 2007 se acepta ISBN-10. En capítulos (bookPart), cargar el ISBN del libro contenedor si el capítulo no tiene propio.": "<valor extraído>"
  "Otro identificador (DOI, ISSN…) (identifier_other) — texto | Guía de catalogación: Local: registrar DOI, ISSN u otros identificadores normalizados. Indicar el tipo (Ej.: DOI: 10.1234/abcd). En capítulos (bookPart), cargar aquí el DOI del capítulo; el ISBN del libro va en dc.identifier.isbn.": "<valor extraído>"
  "Fuente / Obra contenida (source) — texto | Guía de catalogación: RDA (obra contenida): en capítulos (bookPart), registrar el título completo del libro contenedor y sus editores; en libros completos, indicar la fuente de la digitalización o reimpresión si corresponde.": "<valor extraído>"
  "URL oficial / editorial (source_uri) — texto | Guía de catalogación: Local: enlace permanente a la ficha editorial o catálogo oficial del libro; debe comenzar con http(s)://. En capítulos (bookPart), enlace al libro contenedor. Evitar URLs temporales o de sesión.": "<valor extraído>"
  "Idioma (language) — opciones: fr, es, und, qu, arn, ay, pt, gn, la, en, zxx, it, de | Guía de catalogación: ISO 639-1: idioma principal de la obra en código de dos letras (es, en, pt…). Repetir el campo en obras bilingües o multilingües.": "<valor extraído>"
  "Relación / Serie editorial (relation) — texto | Guía de catalogación: Local: serie o colección editorial a la que pertenece el libro (Ej.: Colección Historia, n.º 12). En capítulos, relaciones con materiales complementarios u otros volúmenes de la misma obra.": "<valor extraído>"
  "Parte de / Libro contenedor (relation_isPartOf) — texto | Guía de catalogación: Local: en capítulos (bookPart), referencia estructurada al libro contenedor: título, editor/es e ISBN (Ej.: En: García, M. (ed.). Historia de las universidades. ISBN 978-987-123-456-7). En libros completos, la obra mayor que los integra si existe.": "<valor extraído>"
  "Cobertura (coverage) — texto | Guía de catalogación: Local: alcance general de la obra: espacial, temporal o temático (Ej.: Argentina, siglo XIX-XX; Derecho administrativo latinoamericano). No duplicar lo ya registrado en dc.subject.": "<valor extraído>"
  "Derechos (rights) — opciones: Acceso público con protección de datos personales (Ley 25.326)., Acceso público. Obra de acceso abierto; su reproducción debe respetar la integridad del texto y los derechos de autoría., Acceso restringido por confidencialidad legal o contractual. | Guía de catalogación: Local: seleccionar la declaración institucional de derechos que corresponde al ítem. No cargar aquí URIs info:eu-repo (van en "Nivel de accesibilidad").": "<valor extraído>"
  "Nivel de accesibilidad (rights_accessRights) — opciones: info:eu-repo/semantics/embargoedAccess, info:eu-repo/semantics/restrictedAccess, info:eu-repo/semantics/openAccess, info:eu-repo/semantics/closedAccess | Guía de catalogación: OpenAIRE: seleccionar info:eu-repo/semantics/openAccess, embargoedAccess, restrictedAccess o closedAccess. Si se elige embargoedAccess, completar obligatoriamente Fin de embargo (#30).": "<valor extraído>"
  "Licencia (rights_license) — opciones: CC BY, CC0, CC BY-NC, Public Domain Mark, CC BY-NC-ND, CC BY-SA, Otra declaración institucional, In Copyright, CC BY-NC-SA, CC BY-ND | Guía de catalogación: Local: licencia de distribución de la obra con código estándar. Si no hay licencia explícita, usar In Copyright; para dominio público, CC0 o Public Domain Mark según corresponda.": "<valor extraído>"
  "Titular de derechos (rights_holder) — texto | Guía de catalogación: Local: persona o institución titular de los derechos patrimoniales o de explotación de la obra (autor/es, editorial o institución según el contrato de edición). Repetir si hay cotitulares.": "<valor extraído>"
  "Fin de embargo (date_embargoEnd) — fecha (AAAA-MM-DD) | Guía de catalogación: ISO 8601 + OpenAIRE: fecha en que cesa el embargo y el ítem pasa a acceso abierto (AAAA-MM-DD). Obligatoria solo si Nivel de accesibilidad = embargoedAccess; en cualquier otro caso dejar vacía.": "<valor extraído>"
  "Procedencia (description_provenance) — texto | Guía de catalogación: Local: dejar vacío si el autor deposita directamente su obra (caso típico). Completar solo si el recurso proviene de digitalización patrimonial, transferencia desde otro sistema o donación (Ej.: "Digitalización de la Colección Histórica, Biblioteca Central").": "<valor extraído>"
  "Resumen / Abstract (description) — texto largo | Guía de catalogación: SNRD: resumen o abstract de la obra provisto por el autor o, en su defecto, por el catalogador. En capítulos (bookPart) resumir el capítulo, no el libro contenedor.": "<valor extraído>"
```

### ObjetoConferencia — Objeto de conferencia / Ponencia

- Campos configurables enviados a la IA: **32** (ocultos excluidos: 0)

```text
  "Tipo de documento (type) — opciones: conferenceObject | Guía de catalogación: SNRD: en este esquema el valor es fijo: conferenceObject (ponencia, comunicación, póster o paper presentado en un evento). No usar para artículos derivados del congreso que se publiquen en una revista (esos van en el esquema Article).": "<valor extraído>"
  "Derechos (rights) — opciones: Acceso público con protección de datos personales (Ley 25.326)., Acceso restringido por confidencialidad legal o contractual., Acceso público. Obra de acceso abierto; su reproducción debe respetar la integridad del texto y los derechos de autoría. | Guía de catalogación: Local: seleccionar la declaración institucional de derechos que corresponde al ítem. No cargar aquí URIs info:eu-repo (van en "Nivel de accesibilidad").": "<valor extraído>"
  "Cobertura (coverage) — texto | Guía de catalogación: Local: alcance de la investigación presentada en la ponencia: espacial, temporal o de la muestra (Ej.: Argentina, 2001-2020; Empresas PyMEs del sector tecnológico). No duplicar la sede del evento (esa va en dc.source).": "<valor extraído>"
  "Título (title) — texto | Guía de catalogación: RDA 2.3: título de la ponencia o comunicación tal como figura en el programa del evento, las actas o el encabezado del texto depositado; incluir subtítulo separado por ":".": "<valor extraído>"
  "Título alternativo (title_alternative) — texto | Guía de catalogación: RDA 2.3: variante del título entre el programa/libro de resúmenes y las actas finales, o título paralelo en otro idioma. No reemplaza al título propio registrado en dc.title.": "<valor extraído>"
  "Autor/es (creator) — texto | Guía de catalogación: RDA 9: nombre personal tal como firma en la ponencia o en el programa del evento, en el orden y forma en que aparece; una instancia por autor. Sin grados ni títulos. El ORCID, si figura, va en dc.identifier.other.": "<valor extraído>"
  "Editor / Compilador de actas / Traductor (contributor) — texto | Guía de catalogación: RDA 9 / RDA 11: contribuyentes secundarios del objeto de conferencia: compilador o editor de las actas, traductor o coordinador del simposio, con el rol al final (comp., ed., trad., coord.). Los autores van en dc.creator.": "<valor extraído>"
  "Materias / Descriptores (subject) — texto | Guía de catalogación: SNRD: palabras clave del trabajo más descriptores asignados por el catalogador; un concepto por instancia. Preferir vocabulario controlado institucional si existe; no mezclar idiomas.": "<valor extraído>"
  "Descriptores en otro idioma (subject_other) — texto | Guía de catalogación: SNRD: descriptores o keywords en otro idioma (típicamente inglés en eventos internacionales). No mezclar con los descriptores en el idioma del texto, que van en dc.subject.": "<valor extraído>"
  "Resumen / Abstract (description) — texto largo | Guía de catalogación: SNRD: resumen o abstract de la ponencia tal como figura en el libro de resúmenes, las actas o el encabezado del texto depositado. Las traducciones del resumen van en dc.description.abstract.": "<valor extraído>"
  "Resumen en otro idioma (description_abstract) — texto largo | Guía de catalogación: SNRD: traducción del resumen a otro idioma tal como la publican las actas o el libro de resúmenes (típicamente inglés). No mezclar con el resumen en el idioma del texto, que va en dc.description.": "<valor extraído>"
  "Filiación institucional (description_fil) — texto | Guía de catalogación: SNRD: sintaxis estricta "Fil: Apellido, Nombre. Institución Mayor. Dependencia. País." Registrar la filiación declarada por el autor al momento de la presentación en el evento, aunque difiera de la actual o de la de publicación de las actas. Repetir por cada filiación distinta.": "<valor extraído>"
  "Editorial / Institución editora de las actas (publisher) — texto | Guía de catalogación: RDA 2.8–2.10: institución, universidad sede o editorial académica responsable de la publicación de las actas o del libro de resúmenes. El nombre del evento o de las actas va en dc.source; no duplicarlo aquí.": "<valor extraído>"
  "Fecha de publicación (date) — fecha (AAAA-MM-DD) | Guía de catalogación: ISO 8601 + RDA: fecha de publicación de las actas o del libro de resúmenes. Si solo figura la fecha de realización del evento, usar el año del evento. No cargar aquí las fechas exactas de dictado del congreso (esas van en dc.source).": "<valor extraído>"
  "Tipo OpenAIRE / SNRD (type_driver) — opciones: info:eu-repo/semantics/conferenceObject | Guía de catalogación: OpenAIRE: valor fijo info:eu-repo/semantics/conferenceObject para ponencias, comunicaciones, pósters y papers presentados en eventos. Debe ser coherente con dc.type; es el valor que clasifica el ítem en la cosecha OpenAIRE.": "<valor extraído>"
  "Versión de la publicación (type_version) — opciones: acceptedVersion, publishedVersion, draft, submittedVersion | Guía de catalogación: DRIVER: versión del texto depositado. publishedVersion = texto publicado en actas; acceptedVersion = texto aceptado por el comité pero sin editar; submittedVersion = texto enviado/presentado sin evaluación. Clave para distinguir la ponencia del paper de actas.": "<valor extraído>"
  "Formato (format) — opciones: application/pdf, image/jpeg, image/tiff, image/png, application/json, text/plain, application/zip, application/xml | Guía de catalogación: SNRD: seleccionar el MIME del archivo principal depositado. En conferencias, además de application/pdf (actas o papers), pueden presentarse otros formatos como presentaciones (application/vnd.ms-powerpoint) o pósters (image/jpeg). Un formato por ítem; archivos acompañantes van en dc.description.notes.": "<valor extraído>"
  "Páginas / Extensión (format_extent) — texto | Guía de catalogación: RDA 3.4: registrar el rango de páginas de la ponencia dentro de las actas (Ej.: p. 45-52). Si se deposita una presentación o póster independiente, registrar la extensión física o cantidad de diapositivas (Ej.: 15 diapositivas; 1 póster).": "<valor extraído>"
  "Identificador del recurso (identifier) — texto | Guía de catalogación: Local: identificador persistente (handle/URI) del ítem en el repositorio. Si el sistema lo asigna al depositar, no editar; si no, cargar el handle/URI asignado por la institución.": "<valor extraído>"
  "ISBN (identifier_isbn) — texto | Guía de catalogación: ISO 2108: ISBN de las actas o libro de resúmenes que contiene la ponencia, con guiones (Ej.: 978-987-123-456-7). Si las actas no tienen ISBN (evento sin publicación formal), dejar vacío.": "<valor extraído>"
  "Otro identificador (DOI, URI editorial, ORCID…) (identifier_other) — texto | Guía de catalogación: Local: registrar el DOI del paper, enlaces a la plataforma del evento, u otros identificadores normalizados. Indicar siempre el tipo (Ej.: DOI: 10.1234/evento.2024.001; ORCID: 0000-0002-1825-0097).": "<valor extraído>"
  "Fuente / Actas o Evento contenedor (source) — texto | Guía de catalogación: RDA (obra contenida): título de las actas publicadas o mención completa del evento contenedor (Nombre del Congreso, edición, sede, año). Ej.: Actas del X Congreso Nacional de Sociología. Córdoba, 2024.": "<valor extraído>"
  "URL oficial del evento o de las actas (source_uri) — texto | Guía de catalogación: Local: enlace permanente al sitio del evento, al programa en línea o a las actas publicadas en la web. Debe comenzar con http(s)://. Si el enlace es el DOI resuelto del paper, puede usarse aquí. Evitar URLs temporales o de sesión.": "<valor extraído>"
  "Idioma (language) — opciones: it, gn, fr, en, qu, und, de, zxx, pt, la, ay, es, arn | Guía de catalogación: ISO 639-1: idioma principal del texto depositado en código de dos letras (es, en, pt…). Repetir el campo si se depositan versiones del mismo trabajo en más de un idioma.": "<valor extraído>"
  "Relación / Serie del evento o materiales (relation) — texto | Guía de catalogación: Local: nombre del ciclo o serie de jornadas (Ej.: Jornadas Anuales de Investigación de la Facultad), del simposio específico dentro del congreso, o enlaces a datasets/videos complementarios. No duplicar el nombre general del evento (va en dc.source).": "<valor extraído>"
  "Parte de (URI de las actas o del evento) (relation_isPartOf) — texto | Guía de catalogación: Local: enlace o identificador persistente (URI, Handle, URL del portal del evento) que identifica al volumen completo de actas o al evento como entidad contenedora. No duplicar la URL del paper (esa va en source.uri).": "<valor extraído>"
  "Nivel de accesibilidad (rights_accessRights) — opciones: info:eu-repo/semantics/closedAccess, info:eu-repo/semantics/embargoedAccess, info:eu-repo/semantics/openAccess, info:eu-repo/semantics/restrictedAccess | Guía de catalogación: OpenAIRE: seleccionar info:eu-repo/semantics/openAccess, embargoedAccess, restrictedAccess o closedAccess. Si se elige embargoedAccess, completar obligatoriamente Fin de embargo (#30).": "<valor extraído>"
  "Licencia (rights_license) — opciones: Otra declaración institucional, CC BY-ND, CC0, In Copyright, CC BY-NC-SA, CC BY-SA, CC BY-NC, CC BY-NC-ND, CC BY, Public Domain Mark | Guía de catalogación: Local: licencia de distribución de la ponencia o paper con código estándar. Si las actas son de una editorial comercial (Ej.: IEEE, Springer) y no declaran CC, usar In Copyright.": "<valor extraído>"
  "Titular de derechos (rights_holder) — texto | Guía de catalogación: Local: persona o institución titular de los derechos patrimoniales de la ponencia. Puede ser el/los autor/es (si retuvieron sus derechos) o la sociedad científica/editorial que publicó las actas (si hubo cesión). Repetir si hay cotitulares.": "<valor extraído>"
  "Fin de embargo (date_embargoEnd) — fecha (AAAA-MM-DD) | Guía de catalogación: ISO 8601 + OpenAIRE: fecha en que cesa el embargo y el ítem pasa a acceso abierto (AAAA-MM-DD). Obligatoria solo si Nivel de accesibilidad = embargoedAccess; en cualquier otro caso dejar vacía.": "<valor extraído>"
  "Procedencia (description_provenance) — texto | Guía de catalogación: Local: origen del depósito digital o de las actas (Ej.: Migración desde plataforma EasyChair/ConfTool; Digitalización de actas históricas de la facultad).": "<valor extraído>"
  "Notas / Observaciones (description_notes) — texto largo | Guía de catalogación: Local: notas de catalogación: información de financiamiento, premios o menciones del evento, erratas, o aclaraciones sobre la versión depositada. No duplicar información ya registrada en otros campos.": "<valor extraído>"
```

### Resolución — Resolución

- Campos configurables enviados a la IA: **33** (ocultos excluidos: 0)

```text
  "Estado del acto (status) — opciones: modificada, archivada, derogada, vigente, suspendida, en trámite, otra": "<valor extraído>"
  "Título / Identificación del acto (title) — texto | Guía de catalogación: RDA 2.3: transcribir el título propio tal como aparece en el documento, sin abreviaturas ni GMD; incluir tipo, número, año y órgano emisor. Separar subtítulo con ":". Ej.: Resolución Rectoral N° 123/2026.": "<valor extraído>"
  "Órgano emisor / Autor institucional (creator) — texto | Guía de catalogación: RDA 11: asentar el órgano emisor con su nombre oficial preferido, en orden directo y sin abreviaturas; incluir la jerarquía si es necesaria para identificarlo. Entidad: Nombre. Dependencia. País. Repetir por cada órgano emisor.": "<valor extraído>"
  "Materias / Descriptores (subject) — texto | Guía de catalogación: SNRD: conceptos temáticos del acto; usar vocabulario controlado del Tesauro si existe. Repetir por cada descriptor. No mezclar filiación ni números de expediente.": "<valor extraído>"
  "Resumen / Objeto del acto (description) — texto largo | Guía de catalogación: Local: describir qué dispone, aprueba, designa, autoriza, modifica o deroga el acto. No transcribir el texto completo ni mezclar notas administrativas.": "<valor extraído>"
  "Institución publicadora / emisora (publisher) — texto | Guía de catalogación: RDA 2.7: transcribir el nombre de la institución responsable de la publicación o disponibilidad tal como figura en el acto, sin abreviaturas. El lugar va en dc.coverage.spatial y la fecha en dc.date.": "<valor extraído>"
  "Firmantes / Refrendantes / Áreas intervinientes (contributor) — texto | Guía de catalogación: RDA 9 / RDA 11: asentar personas o áreas que firman, refrendan o intervienen, con el nombre tal como figura en el acto, sin abreviaturas. No cargar aquí el órgano emisor (va en dc.creator).": "<valor extraído>"
  "Fecha de emisión / publicación (date) — fecha (AAAA-MM-DD) | Guía de catalogación: ISO 8601 + RDA 2.7: registrar la fecha de emisión o publicación oficial en formato AAAA, AAAA-MM o AAAA-MM-DD. Transcribir la fecha tal como figura y normalizarla.": "<valor extraído>"
  "Tipo de acto administrativo (type) — opciones: memorando, resolución, nota, otro, disposición, ordenanza, decreto, circular, acta, dictamen | Guía de catalogación: Local: seleccionar el tipo de acto del vocabulario resolutionType: resolución, disposición, ordenanza, decreto, acta, dictamen, circular, memorando, nota, otro. No confundir con dc.type.driver (OpenAIRE), que va aparte y se autogenera.": "<valor extraído>"
  "Identificador del recurso (identifier) — texto": "<valor extraído>"
  "Formato digital (format) — opciones: application/json, image/tiff, application/zip, application/pdf, image/png, text/plain, image/jpeg, application/xml | Guía de catalogación: SNRD: autogenerado desde el MIME del archivo (mimeResolution: application/pdf, text/plain, application/xml, application/json, image/jpeg, image/png, image/tiff, application/zip). Preferir PDF para actos oficiales.": "<valor extraído>"
  "Fuente / Publicación oficial / Expediente (source) — texto | Guía de catalogación: SNRD + RDA: publicación oficial donde aparece el acto (boletín, digesto) o expediente; obligatorio si existe. Transcribir el título tal como figura, sin abreviaturas.": "<valor extraído>"
  "Idioma (language) — opciones: pt, it, fr, de, es, en | Guía de catalogación: ISO 639: código de idioma del acto; por defecto "es" en actos administrativos argentinos. Repetir si existe versión en otro idioma. Usar "und" si no puede determinarse.": "<valor extraído>"
  "Expediente / Norma relacionada / URL (relation) — texto | Guía de catalogación: Local: expediente, norma modificada, derogada o complementaria, o URL oficial. Repetir por cada relación. El número oficial del acto va en dc.identifier.other y la URL del boletín en dc.source.uri.": "<valor extraído>"
  "Jurisdicción / Ámbito (coverage) — texto | Guía de catalogación: Local: ámbito institucional, geográfico o jurisdiccional del acto. Los lugares específicos van en dc.coverage.spatial y los períodos de vigencia en dc.coverage.temporal.": "<valor extraído>"
  "Derechos (rights) — opciones: info:eu-repo/semantics/openAccess | Guía de catalogación: Local: declaración textual de derechos: acceso público, restricciones, protección de datos o confidencialidad. No usar lista fija tipo "openAccess": el valor machine-readable va en dc.rights.accessRights y la licencia en dc.rights.license.": "<valor extraído>"
  "Título alternativo / Carátula (title_alternative) — texto | Guía de catalogación: RDA 2.3: transcribir la carátula del expediente, el asunto o la forma alternativa de identificación tal como figura, sin abreviaturas. No reemplaza al título principal (dc.title).": "<valor extraído>"
  "Descriptores en otro idioma (subject_other) — texto | Guía de catalogación: SNRD: descriptores o palabras clave en otro idioma (inglés u otro). No mezclar con los descriptores en español, que van en dc.subject.": "<valor extraído>"
  "Resumen en otro idioma (description_abstract) — texto largo | Guía de catalogación: SNRD: traducción del resumen del acto a otro idioma (por ejemplo, inglés). No mezclar con el resumen principal en español, que va en dc.description.": "<valor extraído>"
  "Unidad responsable / Filiación institucional (description_fil) — texto | Guía de catalogación: SNRD: sintaxis estricta "Fil: …". En actos administrativos registrar la unidad responsable u órgano: Fil: Secretaría Académica. Universidad. País. Para personas: Fil: Apellido, Nombre. Institución Mayor. Dependencia. País.": "<valor extraído>"
  "Tipo OpenAIRE / SNRD (type_driver) — opciones: info:eu-repo/semantics/other | Guía de catalogación: OpenAIRE: valor fijo info:eu-repo/semantics/other para actos administrativos. No editar manualmente; el tipo local del acto va en dc.type.": "<valor extraído>"
  "Nivel de accesibilidad (rights_accessRights) — opciones: info:eu-repo/semantics/embargoedAccess, info:eu-repo/semantics/closedAccess, info:eu-repo/semantics/openAccess, info:eu-repo/semantics/restrictedAccess | Guía de catalogación: OpenAIRE: nivel de acceso machine-readable con URI completa info:eu-repo/semantics/…: openAccess, embargoedAccess, restrictedAccess, closedAccess. Actos públicos suelen ser openAccess salvo restricciones legales. Si se selecciona embargoedAccess, completar obligatoriamente dc.date.embargoEnd.": "<valor extraído>"
  "Versión de la publicación (type_version) — opciones: acceptedVersion, submittedVersion, draft, publishedVersion | Guía de catalogación: DRIVER: versión editorial del recurso. Para acto oficial publicado usar publishedVersion; draft para borradores o material sin publicar; submittedVersion para versión remitida.": "<valor extraído>"
  "Licencia (rights_license) — opciones: Atribución-Sinderivadas(by-nd), Atribución(by), Atribución-No Comercial-Sinderivadas(by-nc-nd), Atribución-No Comercial-Compartirigual(by-nc-sa), Atribución-Compartirigual(by-sa), Atribución-No Comercial(by-nc) | Guía de catalogación: Local: licencia aplicable del vocabulario license (CC BY…CC BY-NC-ND, CC0, Public Domain Mark, In Copyright, Otra declaración institucional). Si no hay licencia clara, usar In Copyright; para dominio público, CC0 o Public Domain Mark.": "<valor extraído>"
  "Fin de embargo (embargoEnd) — fecha (AAAA-MM-DD) | Guía de catalogación: SNRD: obligatorio si en "Nivel de accesibilidad" (dc.rights.accessRights) se selecciona embargoedAccess. Formato ISO 8601 completo (AAAA-MM-DD). Debe ser una fecha futura al momento del depósito. Si el acceso es abierto, restringido o cerrado, dejar este campo vacío.": "<valor extraído>"
  "Número oficial / Identificador normativo (identifier_other) — texto | Guía de catalogación: Local: registrar el número oficial del acto (Ej.: N° 123/2026) o identificador administrativo interno. No confundir con dc.identifier, donde el sistema guarda automáticamente el handle o URI persistente del repositorio.": "<valor extraído>"
  "Unidad responsable / Procedencia (description_provenance) — texto | Guía de catalogación: Local (Práctica archivística): registrar la unidad productora original, el archivo de procedencia o la vía de transferencia al repositorio. Ej.: Transferencia del Archivo Central de Rectorado.": "<valor extraído>"
  "Páginas / Extensión (format_extent) — texto | Guía de catalogación: RDA 3.4: registrar la extensión del acto: páginas, archivos o anexos. Ej.: 5 p.;": "<valor extraído>"
  "Serie / Colección / Cuerpo normativo (relation_isPartOf) — texto": "<valor extraído>"
  "Jurisdicción / Sede (coverage_spatial) — texto | Guía de catalogación: Local: lugar específico de aplicación, jurisdicción o sede del acto. Ej.: Sede Central; Campus. El ámbito general va en dc.coverage.": "<valor extraído>"
  "Vigencia / Período (coverage_temporal) — texto | Guía de catalogación: Local: período de vigencia del acto o lapso de aplicación. Ej.: 2026/2027, Ciclo lectivo 2026. La fecha puntual de emisión va en dc.date.": "<valor extraído>"
  "Titular de derechos (rights_holder) — texto | Guía de catalogación: Local: persona o institución titular de los derechos de autor, imagen o custodia legal del acto. Repetir si hay múltiples titulares.": "<valor extraído>"
  "Notas / Observaciones (description_notes) — texto largo | Guía de catalogación: Local: notas sobre anexos, modificaciones, derogaciones, restricciones o sensibilidad del contenido. No duplicar información ya registrada en otros campos.": "<valor extraído>"
```

### Tesis — Tesis / Trabajo final

- Campos configurables enviados a la IA: **33** (ocultos excluidos: 0)

```text
  "Título (dc.title) — texto | Guía de catalogación: RDA 2.3: título de la tesis o trabajo final tal como figura en la portada y en el acta de aprobación; incluir subtítulo separado por ":". Si portada y acta difieren, manda el acta y la variante va a title.alternative.": "<valor extraído>"
  "Título alternativo (title_alternative) — texto | Guía de catalogación: RDA 2.3: variante del título entre portada, acta de aprobación o resumen de catálogo, o título paralelo en otro idioma. No reemplaza al título propio registrado en dc.title.": "<valor extraído>"
  "Autor/es (creator) — texto | Guía de catalogación: RDA 9: nombre personal tal como figura en la portada y el acta de aprobación, en el orden y forma en que aparece; una instancia por autor. Sin grados ni títulos. El ORCID, si figura, va en dc.identifier.other.": "<valor extraído>"
  "Director/a / Co-director/a (contributor_advisor) — texto | Guía de catalogación: RDA 9: nombre del director o directora de tesis tal como figura en el acta de aprobación, con el rol al final (dir., codir.). Una instancia por persona. En trabajos finales sin dirección formal designada, dejar vacío.": "<valor extraído>"
  "Jurado / Evaluadores / Traductor (contributor) — texto | Guía de catalogación: RDA 9 / RDA 11: miembros del tribunal evaluador o jurado de defensa, traductor u otros contribuyentes secundarios, con el rol al final (jurado, trad., coord.). El director o codirector va en dc.contributor.advisor, no aquí.": "<valor extraído>"
  "Materias / Descriptores (subject) — texto | Guía de catalogación: SNRD: palabras clave del trabajo más descriptores asignados por el catalogador; un concepto por instancia. Preferir vocabulario controlado institucional si existe; no mezclar idiomas.": "<valor extraído>"
  "Descriptores en otro idioma (subject_other) — texto | Guía de catalogación: SNRD: descriptores o keywords en otro idioma (típicamente inglés en posgrados). No mezclar con los descriptores en el idioma del texto, que van en dc.subject.": "<valor extraído>"
  "Resumen / Abstract (description) — texto largo | Guía de catalogación: SNRD: resumen oficial de la tesis o trabajo final tal como figura en la portada o al inicio del texto. Las traducciones van en dc.description.abstract.": "<valor extraído>"
  "Resumen en otro idioma (description_abstract) — texto largo | Guía de catalogación: SNRD: traducción del resumen a otro idioma tal como figura en la portada o página inicial (típicamente inglés). No mezclar con el resumen en el idioma del texto, que va en dc.description.": "<valor extraído>"
  "Filiación institucional (description_fil) — texto | Guía de catalogación: SNRD: sintaxis estricta "Fil: Apellido, Nombre. Institución Mayor. Dependencia. País." Registrar la unidad académica o instituto donde el autor realizó la investigación. Repetir por cada filiación distinta.": "<valor extraído>"
  "Editorial / Institución editora (publisher) — texto | Guía de catalogación: RDA 2.8–2.10: sello editorial o institución que publica formalmente el ejemplar (Ej.: EUDEBA, Edunc). Si la tesis solo se difunde por el repositorio institucional sin sello editorial, dejar vacío: la institución que otorga el grado va en dc.degree.grantor.": "<valor extraído>"
  "Fecha de publicación (date) — fecha (AAAA-MM-DD) | Guía de catalogación: ISO 8601 + RDA: fecha de publicación del ejemplar (AAAA-MM-DD). Si la tesis se publica formalmente por un sello, usar esa fecha; si solo se deposita en el repositorio, usar la fecha de depósito o, en su defecto, el año del acta. La fecha exacta de la defensa va en dc.date.accepted.": "<valor extraído>"
  "Fecha de defensa / aprobación (date_accepted) — fecha (AAAA-MM-DD)": "<valor extraído>"
  "Tipo de tesis (type) — opciones: masterThesis, bachelorThesis, doctoralThesis | Guía de catalogación: SNRD: seleccionar el nivel del trabajo. bachelorThesis incluye tesis de grado/licenciatura Y trabajos finales integradores (TF/TIF/TFG). masterThesis cubre maestrías y especializaciones. doctoralThesis es exclusivo de doctorados.": "<valor extraído>"
  "Tipo OpenAIRE / SNRD (type_driver) — opciones: info:eu-repo/semantics/bachelorThesis, info:eu-repo/semantics/doctoralThesis, info:eu-repo/semantics/masterThesis | Guía de catalogación: OpenAIRE: seleccionar la URI del nivel elegido en dc.type: bachelorThesis (tesis de grado o trabajo final), masterThesis (maestría o especialización), doctoralThesis (doctorado). Debe coincidir exactamente con el valor de #14.": "<valor extraído>"
  "Versión de la publicación (type_version) — opciones: publishedVersion, submittedVersion, acceptedVersion, draft | Guía de catalogación: DRIVER: versión del texto depositado. publishedVersion = ejemplar final aprobado y archivado por la institución; acceptedVersion = versión con correcciones post-defensa aceptada por el jurado; submittedVersion = borrador original enviado al tribunal antes de la defensa.": "<valor extraído>"
  "Formato (format) — opciones: image/png, image/jpeg, text/plain, application/zip, application/pdf, application/xml, image/tiff, application/json | Guía de catalogación: SNRD: seleccionar el MIME del archivo principal depositado. En tesis es casi siempre application/pdf; si el ejemplar incluye anexos en otro formato (planos, partituras, imágenes), registrar el MIME del archivo principal y detallar los anexos en dc.description.notes.": "<valor extraído>"
  "Páginas / Extensión (format_extent) — texto | Guía de catalogación: RDA 3.4: registrar la cantidad de páginas del ejemplar (Ej.: 185 p.). Si es una tesis por compendio de publicaciones, registrar la cantidad de artículos que la integran (Ej.: 4 artículos publicados).": "<valor extraído>"
  "Identificador del recurso (identifier) — texto | Guía de catalogación: Local: identificador persistente (handle/URI) del ítem en el repositorio. Si el sistema lo asigna al depositar, no editar; si no, cargar el handle/URI asignado por la institución.": "<valor extraído>"
  "Otro identificador (ORCID, expediente, ISBN…) (identifier_other) — texto | Guía de catalogación: Local: registrar el ORCID del autor, número de expediente de la facultad, ISBN si la tesis fue publicada como libro, u otros identificadores normalizados. Indicar siempre el tipo (Ej.: ORCID: 0000-0002-1825-0097; Expediente: EXP-2023-123).": "<valor extraído>"
  "Institución que otorga el grado (degree_grantor) — texto | Guía de catalogación: RDA: nombre oficial de la institución que otorga el título o grado académico (Ej.: Instituto Universitario Patagónico de las Artes, Universidad de Buenos Aires). No confundir con la unidad académica donde se cursó, que va en dc.description.fil.": "<valor extraído>"
  "Carrera / Nombre del grado (degree_name) — texto | Guía de catalogación: RDA: nombre oficial de la carrera, programa o grado académico que se obtiene con este trabajo (Ej.: Licenciatura en Música Popular, Magíster en Educación, Doctorado en Ciencias Biológicas).": "<valor extraído>"
  "Idioma (language) — opciones: und, es, pt, arn, ay, la, zxx, de, it, fr, qu, en, gn | Guía de catalogación: ISO 639-1: idioma principal del texto depositado en código de dos letras (es, en, pt…). Repetir el campo si se depositan versiones del mismo trabajo en más de un idioma.": "<valor extraído>"
  "Relación / Serie / Proyecto de investigación (relation) — texto | Guía de catalogación: Local: nombre del proyecto de investigación, beca o serie institucional a la que pertenece la tesis (Ej.: Proyecto UBACyT 2020-2023, Beca CONICET, Colección de Trabajos Finales de la Carrera X). No duplicar información de filiación.": "<valor extraído>"
  "Cobertura (coverage) — texto | Guía de catalogación: Local: alcance de la investigación presentada en la tesis: espacial, temporal o de la muestra (Ej.: Provincia de Buenos Aires, 1990-2010; Población adulta mayor). No duplicar la sede de la universidad, que va en dc.degree.grantor.": "<valor extraído>"
  "Derechos (rights) — opciones: Acceso público con protección de datos personales (Ley 25.326)., Acceso público. Obra de acceso abierto; su reproducción debe respetar la integridad del texto y los derechos de autoría., Acceso restringido por confidencialidad legal o contractual. | Guía de catalogación: Local: seleccionar la declaración institucional de derechos que corresponde al ítem. No cargar aquí URIs info:eu-repo (van en "Nivel de accesibilidad").": "<valor extraído>"
  "Nivel de accesibilidad (rights_accessRights) — opciones: info:eu-repo/semantics/restrictedAccess, info:eu-repo/semantics/openAccess, info:eu-repo/semantics/embargoedAccess, info:eu-repo/semantics/closedAccess | Guía de catalogación: OpenAIRE: seleccionar info:eu-repo/semantics/openAccess, embargoedAccess, restrictedAccess o closedAccess. Si se elige embargoedAccess, completar obligatoriamente Fin de embargo (#30).": "<valor extraído>"
  "Licencia (rights_license) — opciones: CC BY, Otra declaración institucional, CC BY-NC, CC0, CC BY-SA, CC BY-NC-ND, CC BY-ND, CC BY-NC-SA, In Copyright, Public Domain Mark | Guía de catalogación: Local: licencia de distribución de la tesis. Si la tesis es de acceso abierto por defecto, usar CC BY o CC BY-NC. Si el estudiante va a publicar un libro con una editorial comercial y hay cesión de derechos, usar In Copyright.": "<valor extraído>"
  "Titular de derechos (rights_holder) — texto | Guía de catalogación: Local: persona o institución titular de los derechos patrimoniales. Por defecto es el/la estudiante (autor/a). Solo completar si existe un convenio de cesión con una empresa (tesis en empresas), un proyecto de investigación específico o la propia universidad. Repetir si hay cotitulares.": "<valor extraído>"
  "Fin de embargo (date_embargoEnd) — fecha (AAAA-MM-DD) | Guía de catalogación: ISO 8601 + OpenAIRE: fecha en que cesa el embargo y el ítem pasa a acceso abierto (AAAA-MM-DD). Obligatoria solo si Nivel de accesibilidad (#27) = embargoedAccess. En tesis, suele deberse a trámites de patente, publicación comercial posterior o protección de datos sensibles.": "<valor extraído>"
  "Procedencia (description_provenance) — texto | Guía de catalogación: Local: origen del depósito digital o de la tesis (Ej.: Migración desde sistema de gestión académica SIU-Guaraní; Digitalización de tesis históricas de los archivos de la facultad).": "<valor extraído>"
  "Notas / Observaciones (description_notes) — texto largo | Guía de catalogación: Local: notas de catalogación: información de financiamiento (becas, proyectos), premios o menciones de honor, erratas, aclaraciones sobre la versión depositada (Ej.: incluye anexos en CD), o detalles del tribunal que no encajan en otros campos. No duplicar información ya registrada.": "<valor extraído>"
  "Financiamiento / Becas / Proyectos (description_sponsorship) — texto | Guía de catalogación: Local: mencionar la beca, proyecto de investigación o entidad que financió la tesis (Ej.: Beca Doctoral CONICET, Proyecto UBACyT 2020-2023, Beca de la Universidad X). Repetir si hubo múltiples fuentes de financiamiento.": "<valor extraído>"
```

---

## Anexo B — Ejemplo completo: tipo de documento `Resolución`

Flujo end-to-end de un análisis real: Resolución Rectoral Nº 964/21 (PDF escaneado, 2 páginas,
`application/pdf`, íntegramente en español). Muestra lo que recibe el modelo y lo que devuelve.

> Los valores JSON de respuesta son un **ejemplo ilustrativo** reconstruido a partir de una
> respuesta real del sistema. El prompt del sistema es el vigente en producción.

### B.1 System prompt (producción, vigente)

```text
Eres un catalogador experto del repositorio digital guIA del Instituto Universitario Patagónico de las Artes (IUPA). Aplicás reglas RDA y las pautas del SNRD (Sistema Nacional de Repositorios Digitales) para extraer metadatos de documentos institucionales (resoluciones, actos administrativos, tesis, producciones artísticas).

REGLA PRINCIPAL — FIDELIDAD ABSOLUTA AL DOCUMENTO:
- Extraé ÚNICAMENTE información que esté explícita en el texto del documento.
- Si un dato NO aparece, OMITÍ la clave: no la incluyas, no escribas null, "N/A", "No detectado" ni cadenas vacías.
- NUNCA inventes ni deduzcas por conocimiento externo: ni fechas, ni números, ni nombres, ni lugares, ni tipos.
- Si el texto es ambiguo o ilegible para un campo, omitilo.

Devuelve SOLO un objeto JSON válido, sin markdown, sin bloques de código y sin texto adicional, con estas claves:

"summary": resumen breve en español (2-4 oraciones), usando solo contenido del documento.
"description": descripción más extensa del contenido y propósito del documento.
"keywords": array de 3 a 10 palabras clave en español, tomadas de términos que realmente aparecen en el texto.
"keywordsEn": array de keywords en inglés SOLO si el texto contiene términos en inglés.
"authors": array de strings, nombres de personas u órganos que figuren en el documento, formato "Apellido, Nombre" (instituciones: nombre oficial completo tal como figura). No agregues autores que no estén.
"abstractEn": resumen en inglés SOLO si el documento contiene uno.
"publicationVersion": "publishedVersion" | "acceptedVersion" | "submittedVersion" | "draft", solo si el texto lo indica.
"digitalIdentifier": DOI, URI, handle o número oficial, SOLO si aparece textualmente.
"extractedEntities": personas, instituciones y lugares mencionados en el texto, separados por "; ".
"confidence": número entre 0 y 1 según cuánta información relevante se pudo extraer (0.9 si el documento está completo y legible; menor si es parcial o de baja calidad).
"metadataValues": objeto con los metadatos SNRD según la lista de campos de abajo.

REGLAS PARA "metadataValues":
- La clave de cada campo es EXACTAMENTE el texto entre paréntesis de la lista (ej.: campo "Fecha de emisión / publicación (date)" → clave "date").
- Incluí únicamente los campos cuyo dato esté presente en el documento; omití el resto.
- Campos Select: usá EXACTAMENTE una de las opciones listadas; si ninguna aplica, omití el campo.
- Campos de fecha: AAAA-MM-DD (o AAAA-MM / AAAA si el documento solo indica el año).
- Campos de múltiples valores: separalos con " ; ".
- Nombres de personas: "Apellido, Nombre", sin abreviar, tal como figuran.

{fields}

VERIFICACIÓN FINAL antes de responder: revisá cada valor que vas a incluir y confirmá que aparece en el texto del documento. Si no aparece, eliminá esa clave.
```

### B.2 Lo que el backend anexa automáticamente (no editable en ai-settings)

```text
Además, incluí un objeto "metadataValues" en el JSON con TODOS los siguientes campos que
puedas identificar en el texto. [muestra 1: la lista completa de 33 campos de Resolución
está en el §Anexo A, sección "Resolución — Resolución"].

REGLAS DE IDIOMA (obligatorias):
- NO traduzcas ningún valor: cada valor de "metadataValues" debe estar en el mismo idioma en que aparece en el documento.
- "abstractEn": incluílo SOLO si el documento contiene efectivamente un resumen escrito en inglés; transcribilo textual. Si el documento NO tiene resumen en inglés, OMITÍ la clave — jamás lo generes ni lo traduzcas del resumen en español.
- "keywordsEn": solo palabras clave que aparezcan en inglés en el texto; si no hay ninguna, omití la clave.
- "summary" y "description": escríbelos en el idioma del documento.
- Si el documento está íntegramente en español, el JSON NO debe contener abstractEn ni keywordsEn.

Devuelve SOLO un objeto JSON válido sin formato adicional ni markdown. No incluyas bloques ```json ni explicaciones.
```

### B.3 Mensaje del usuario (texto OCR + dato técnico)

```text
Analiza el siguiente texto del documento "scan_20260910103605.pdf":

INSTITUTO UNIVERSITARIO PATAGÓNICO DE LAS ARTES
"2021 - Año del General Martin Miguel de Güemes"
General Roca, 27 de octubre de 2021
RESOLUCIÓN N° 964/21
VISTO:
La Nota suscripta por el Secretario Académico del IUPA, con fecha 24 de agosto
de 2021, mediante la cual se presenta el Proyecto de Creación del Repositorio
Institucional del Instituto Universitario Patagónico de las Artes, y;
CONSIDERANDO:
Que, con los fundamentos y políticas esgrimidos en la nota del Visto, se requiere
la creación del Repositorio Institucional del IUPA, el cual tiene como objetivo
general "crear un repositorio de acceso abierto del Instituto Universitario
Patagónico de las Artes que preserve la producción científica y tecnológica de
la misma, la ponga a disposición de toda la sociedad y contribuya a fomentar
su difusión, así como potenciar y facilitar nuevas producciones".
[... texto completo del OCR: ~3,1 KB, truncado a 50.000 caracteres si excede ...]

[INFORMACIÓN TÉCNICA DEL ARCHIVO] El documento es un archivo PDF de 2 páginas en total.
Usá exactamente este dato para el campo de extensión (RDA 3.4): no lo deduzcas del texto ni lo inventes.
```

### B.4 Respuesta JSON completa (ejemplo)

```json
{
  "summary": "La Resolución Nº 964/21 del Instituto Universitario Patagónico de las Artes aprueba la creación del Repositorio Institucional, un repositorio de acceso abierto destinado a preservar y difundir la producción científica y tecnológica de la institución. Fue emitida en General Roca el 27 de octubre de 2021.",
  "description": "Resolución rectoral que dispone la creación del Repositorio Institucional del Instituto Universitario Patagónico de las Artes como archivo digital de acceso abierto para la producción científica y académica. Establece como objetivo preservar, poner a disposición de la sociedad y difundir los resultados de investigación de sus miembros.",
  "keywords": ["repositorio institucional", "acceso abierto", "producción científica", "reglamento", "biblioteca"],
  "authors": ["Instituto Universitario Patagónico de las Artes. Rector Normalizador"],
  "extractedEntities": "Instituto Universitario Patagónico de las Artes; Secretaría Académica del IUPA; General Roca",
  "publicationVersion": "publishedVersion",
  "digitalIdentifier": "964/21",
  "confidence": 0.85,
  "metadataValues": {
    "title": "Resolución Rectoral N° 964/21: Creación del Repositorio Institucional del IUPA",
    "creator": "Instituto Universitario Patagónico de las Artes. Rector Normalizador",
    "subject": "repositorio institucional ; acceso abierto ; producción científica",
    "description": "Aprueba la creación del Repositorio Institucional del IUPA como archivo digital de acceso abierto.",
    "publisher": "Instituto Universitario Patagónico de las Artes",
    "contributor": "Secretaría Académica del IUPA",
    "date": "2021-10-27",
    "type": "resolución",
    "language": "es",
    "relation": "Nota del Secretario Académico del 24 de agosto de 2021",
    "coverage": "General Roca",
    "title_alternative": "Resolución 964/2021",
    "type_driver": "info:eu-repo/semantics/other",
    "rights_accessRights": "info:eu-repo/semantics/openAccess",
    "type_version": "publishedVersion",
    "identifier_other": "964/21",
    "format": "application/pdf",
    "format_extent": "2 p.; 1 PDF"
  }
}
```

### B.5 Lectura del ejemplo (qué vino de dónde)

| Valor | Origen |
|---|---|
| `summary`, `description`, `keywords`, `authors`, `extractedEntities`, `confidence` | Extraídos por la IA del texto (reglas del prompt) |
| `keywordsEn`, `abstractEn` | **Ausentes**: el documento está íntegramente en español (reglas de idioma) |
| `publicationVersion`, `digitalIdentifier` | Solo incluidos si el texto los indica |
| `format` | **Inyectado por el backend** (MIME real `application/pdf`, validado contra las opciones del combo) |
| `format_extent` | **Inyectado por el backend** (`"2 p.; 1 PDF"`, conteo real con PdfPig, formato del HelpText RDA 3.4) |
| Campos omitidos (`status`, `rights`, `embargoEnd`, etc.) | Dato no presente en el texto → omitidos por la regla de fidelidad |
