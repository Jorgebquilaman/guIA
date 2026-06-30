# Perfiles de Usuario y Alcance del Sistema

## Roles de Usuario

| Rol | Acceso público | Subir y editar documentos propios | Publicar / Rechazar / Despublicar | Admin de usuarios | Admin de colecciones | Admin de esquemas metadatos | Admin de tesauro | Configuración del sitio |
|---|---|---|---|---|---|---|---|---|
| **Viewer** | ✓ | ✓ | | | | | | |
| **Editor** | ✓ | ✓ | | | | | | |
| **Admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Viewer
- Buscar y visualizar documentos públicos y privados
- Subir documentos (borrador), editar metadatos propios
- Solicitar acceso a la plataforma
- Acceder al dashboard personal

### Editor
- Todo lo que puede hacer Viewer
- Editar cualquier documento (sin publicar)

### Admin
- Todo lo que pueden hacer Viewer y Editor
- Publicar / Rechazar / Despublicar documentos
- CRUD de usuarios y aprobar solicitudes de registro
- CRUD de colecciones (árbol jerárquico)
- CRUD de departamentos y programas ("Redes de Conocimiento")
- CRUD de tipos documentales
- CRUD de esquemas de metadatos Dublin Core SNRD
- CRUD de términos del tesauro
- Configuración: proveedores IA, sitio, SMTP, tipos documentales

### Usuario por defecto (seed)
| Campo | Valor |
|---|---|
| Email | `admin@guia.app` |
| Contraseña | `Admin123!` |
| Nombre | Administrador |
| Rol | Admin |

---

## Funcionalidades por Nivel de Acceso

### Públicas (sin autenticación)
- Landing page con estadísticas en tiempo real, departamentos y documentos recientes
- Búsqueda full-text con filtros por tipo, colección, autor, departamento, carrera, año y palabras clave
- Vista de detalle de documentos con metadatos Dublin Core, citas APA y BibTeX
- Mapa de conocimiento (grafo force-directed de documentos, autores y palabras clave)
- Estadísticas públicas de documentos y descargas
- Página de perfil de autor con métricas individuales
- Tesauro público navegable (términos jerárquicos TG/TE)
- Vista optimizada para crawlers (Google Scholar, meta tags Dublin Core, JSON-LD, sitemap.xml)
- Página "Acerca del Repositorio"
- Solicitud de acceso a la plataforma
- Restablecimiento de contraseña por email

### Requieren autenticación (Viewer / Editor / Admin)
- Dashboard con estadísticas del sistema
- Subida de documentos con drag & drop (archivos y enlaces multimedia)
- Procesamiento automático con IA: resumen, palabras clave, clasificación AACR2
- Editor de metadatos completo: título, autores, palabras clave, fecha, licencia, departamento
- Metadatos SNRD por tipo documental (Article, ConferenceDocument, Book, Thesis) con campos Dublin Core
- Gestión de colecciones (árbol jerárquico ordenado alfabéticamente)
- Exploración por colecciones
- Vista previa de documentos (PDF, imágenes)
- Enlaces multimedia (YouTube, Vimeo, Google Drive, audio)
- Vista de documento con citas APA y BibTeX

### Solo Administración (Admin)
- Panel de administración con métricas del sistema
- CRUD de usuarios + aprobación de solicitudes de registro
- Listado y filtro de documentos por estado (Draft, Processing, Published, Rejected)
- Aprobar, rechazar (con motivo) y despublicar documentos
- Gestión de tipos documentales (DocumentTypeDef)
- Gestión de departamentos académicos y secciones temáticas
- Editor visual de esquemas de metadatos SNRD (fields, options, obligatoriness)
- Gestión completa del tesauro (CRUD de términos jerárquicos por tipo)
- Configuración del sitio (mensaje informativo, base URL, tamaño máximo de archivos)
- Configuración de proveedores de IA (DeepSeek / Claude, prompts editables)
- Configuración SMTP para envío de emails

---

## Flujo de Publicación

```
1. Viewer/Editor sube documento → Estado: Draft
2. Completa metadatos (manual o con IA)
3. Admin recibe documento en panel de administración
4. Admin puede:
   - Publicar → Estado: Published (visible al público)
   - Rechazar → Estado: Rejected (con motivo)
5. Admin puede despublicar en cualquier momento
```

---

## Modelo de Datos (Entidades Principales)

| Entidad | Descripción |
|---|---|
| **User** | Usuarios con email, password hash, rol (Admin/Editor/Viewer) |
| **Document** | Documento con tipo, estado, metadatos Dublin Core, archivos |
| **Collection** | Árbol jerárquico de colecciones |
| **Department** | Departamentos académicos con secciones temáticas |
| **DocumentTypeDef** | Definiciones de tipos documentales |
| **MetadataSchema** | Esquemas de metadatos SNRD por tipo documental |
| **MetadataField** | Campos dentro de un esquema (Text, Select, Date, MultiText, etc.) |
| **MetadataValue** | Valores de metadatos por documento y campo |
| **ThesaurusTerm** | Términos jerárquicos del tesauro (TG/TE) |
| **RefreshToken** | Tokens de refresco JWT |
| **DownloadLog** | Registro de descargas con geo-IP |

---

## Tech Stack

| Capa | Tecnología |
|---|---|
| Backend | .NET 9, ASP.NET Core, MediatR (CQRS), EF Core, FluentValidation |
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind v4, TanStack Query, Zustand |
| Base de datos | PostgreSQL 16 con full-text search en español |
| IA | DeepSeek API / Anthropic Claude (configurable), reglas AACR2 |
| Autenticación | JWT (access + refresh tokens), PBKDF2-SHA256 |
| Almacenamiento | Local filesystem (`storage/files/`) |
| Email | SMTP |
