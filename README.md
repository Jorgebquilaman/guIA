# GuIA Documental

Sistema de gestión documental inteligente para el repositorio institucional del **Instituto Universitario Patagónico de las Artes (IUPA)**.

Permite la carga, procesamiento con IA, almacenamiento, búsqueda y difusión de la producción académica, científica y cultural de la institución.

---

## Arquitectura

El sistema sigue los principios de **Clean Architecture** con **Domain-Driven Design** en el backend y una arquitectura moderna basada en componentes en el frontend.

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│           React + Vite + Tailwind v4             │
│              TypeScript + Zustand                │
├─────────────────────────────────────────────────┤
│                    API (C#)                      │
│      ASP.NET Core 9 + MediatR + JWT Auth        │
├─────────────────────────────────────────────────┤
│                Application Layer                 │
│    Use Cases (Commands/Queries) + Validators     │
│      Ports (IEmailPort, IFileStoragePort, ...)   │
├─────────────────────────────────────────────────┤
│                Infrastructure Layer              │
│    PostgreSQL + EF Core + SMTP + LLM + FTS      │
├─────────────────────────────────────────────────┤
│                Domain Layer                      │
│    Entities + Value Objects + Enums + Events     │
└─────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **.NET 9** (ASP.NET Core Web API)
- **Entity Framework Core 9** (PostgreSQL)
- **MediatR** (CQRS with commands and queries)
- **FluentValidation** (request validation)
- **JWT Bearer** authentication (access + refresh tokens)
- **Serilog** (structured logging)
- **Swagger / OpenAPI** (dev only)

### Frontend
- **React 19** + **TypeScript 6**
- **Vite 8** (build tool)
- **Tailwind CSS v4** (utility-first CSS)
- **React Router v7** (client-side routing)
- **TanStack React Query v5** (server state management)
- **Zustand** (client state management)
- **Axios** (HTTP client)
- **Lucide React** (icons)

### Database
- **PostgreSQL 16** (relational database)
- Full-text search with Spanish configuration

### AI Integration
- **DeepSeek API** (chat model, default)
- **Anthropic Claude API** (configurable)
- Análisis automatizado de documentos con reglas AACR2

---

## Roles de Usuario y Permisos

El sistema define tres roles con niveles crecientes de acceso:

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
- **Publicar / Rechazar / Despublicar** documentos
- **CRUD de usuarios** y aprobar solicitudes de registro
- **CRUD de colecciones** (árbol jerárquico)
- **CRUD de departamentos** y programas ("Redes de Conocimiento")
- **CRUD de tipos documentales**
- **CRUD de esquemas de metadatos Dublin Core SNRD**
- **CRUD de términos del tesauro**
- **Configuración**: proveedores IA, sitio, SMTP, tipos documentales

### Usuario por defecto (seed)
| Campo | Valor |
|---|---|
| Email | `admin@guia.app` |
| Contraseña | `Admin123!` |
| Nombre | Administrador |
| Rol | Admin |

---

## Funcionalidades

### Públicas (sin autenticación)
- Landing page con estadísticas en tiempo real, departamentos y documentos recientes
- Búsqueda full-text con filtros por tipo, colección, autor, departamento, carrera, año y palabras clave
- Vista de detalle de documentos con metadatos Dublin Core
- Mapa de conocimiento (grafo force-directed de documentos, autores y palabras clave)
- Estadísticas públicas de documentos y descargas
- Página de perfil de autor con métricas individuales
- Tesauro público navegable (términos jerárquicos TG/TE)
- Vista optimizada para crawlers (Google Scholar, meta tags, JSON-LD, sitemap.xml)
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
- Enlaces multimedia (YouTube, Vimeo, Google Drive, audio embebido)
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

## Estructura del Proyecto

```
GuIA/
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── api/                 # Hooks y cliente HTTP (React Query)
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── documents/       # MetadataEditor, DynamicMetadataForm, upload
│   │   │   ├── layout/          # AppLayout, Sidebar, Header, AdminGuard
│   │   │   ├── public/          # Navbar, Footer, Hero, SearchFilters
│   │   │   └── ui/              # Button, Input, Card, Modal, MediaLinkPlayer
│   │   ├── pages/               # Páginas de la aplicación
│   │   │   ├── admin/           # Dashboard, Documents, Users, Collections, etc.
│   │   │   ├── auth/            # Login, ForgotPassword, ResetPassword
│   │   │   └── public/          # Landing, búsqueda, About, Thesaurus
│   │   ├── store/               # Estado global (Zustand)
│   │   └── types/               # Tipos TypeScript
│   ├── package.json
│   └── vite.config.ts
│
├── src/
│   ├── API/                     # Web API (ASP.NET Core)
│   │   ├── Controllers/         # REST endpoints
│   │   ├── Middleware/          # ExceptionHandling, RequestLogging
│   │   └── Program.cs           # Entry point
│   │
│   ├── Application/             # Application layer (CQRS)
│   │   ├── Common/              # Interfaces, PasswordHelper
│   │   ├── DTOs/                # Data Transfer Objects
│   │   ├── Ports/               # IEmailPort, IFileStoragePort, ILlmPort, etc.
│   │   └── UseCases/            # Commands, Queries, Handlers
│   │       ├── Auth/            # Login, Register, ResetPassword
│   │       ├── Documents/       # Upload, Publish, AISuggestions, Metadata
│   │       ├── Collections/
│   │       ├── Search/          # Full-text search
│   │       └── SiteConfig/
│   │
│   ├── Domain/                  # Domain layer
│   │   ├── Entities/            # Document, User, Collection, MetadataSchema, etc.
│   │   ├── Enums/               # UserRole, DocumentStatus, DocumentType, FieldType, etc.
│   │   ├── ValueObjects/        # Email, MediaLink, LlmAnalysisResult
│   │   └── Events/
│   │
│   └── Infrastructure/          # Infrastructure layer
│       ├── Adapters/            # LocalFileStorage, SmtpEmail, DeepSeekLlm, etc.
│       ├── Persistence/         # EF Core DbContext, configs, migrations, seed
│       └── DependencyInjection.cs
│
├── GuIA.sln                     # .NET solution
└── README.md
```

---

## Modelo de Datos (Entidades Principales)

| Entidad | Descripción |
|---|---|
| **User** | Usuarios del sistema con email, password hash, rol (Admin/Editor/Viewer) |
| **Document** | Documento principal con tipo, estado, metadatos Dublin Core, archivos asociados |
| **Collection** | Árbol jerárquico de colecciones |
| **Department** | Departamentos académicos con programas/secciones temáticas |
| **DocumentTypeDef** | Definiciones de tipos documentales |
| **MetadataSchema** | Esquemas de metadatos SNRD por tipo documental |
| **MetadataField** | Campos dentro de un esquema (con tipo: Text, Select, Date, MultiText, etc.) |
| **MetadataFieldOption** | Opciones para campos tipo Select |
| **MetadataValue** | Valores de metadatos por documento y campo |
| **ThesaurusTerm** | Términos jerárquicos del tesauro (TG/TE) con tipo (Concept, Subject, Genre, etc.) |
| **AiAnalysisResult** | Resultados de análisis de IA por documento |
| **RefreshToken** | Tokens de refresco JWT |
| **DownloadLog** | Registro de descargas con geo-IP |

---

## Instalación y Ejecución

### Requisitos
- .NET 9 SDK
- Node.js 20+
- PostgreSQL (puerto 5433 por defecto)
- Docker (opcional, para PostgreSQL)

### 1. Base de datos (PostgreSQL)

```bash
# Opción A: Con Docker
docker run -d --name guia-db -e POSTGRES_USER=guia -e POSTGRES_PASSWORD=guia123 -e POSTGRES_DB=guia -p 5433:5432 postgres:16

# Opción B: Usar una instancia existente (ajustar connection string)
```

### 2. Backend

```bash
cd src/API
dotnet restore
dotnet run
# API en http://localhost:5050
# Swagger en http://localhost:5050/swagger
# Admin default: admin@guia.app / Admin123!
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App en http://localhost:5173
# Proxy Vite redirige /api → http://localhost:5050
```

---

## Paleta de Colores IUPA

| Color | Uso | Código |
|---|---|---|
| Verde principal | Branding, botones primary | `#1B4D3E` |
| Verde secundario | Hovers, accentos | `#2D7A6B` |
| Verde claro | Fondos suaves | `#E8F4F1` |
| Naranja acento | CTAs, highlights | `#E87100` |
| Dark | Texto principal | `#2D2D2D` |
| Medium | Texto secundario | `#666666` |
| Light | Fondos, bordes | `#F5F5F5` |

---

## Licencia

Desarrollado para el **Instituto Universitario Patagónico de las Artes (IUPA)**.
