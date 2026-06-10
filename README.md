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
- **Swagger / OpenAPI** (API documentation)

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
- **PostgreSQL** (relational database)
- Full-text search (Spanish configuration)

### AI Integration
- **DeepSeek API** (chat model)
- **Anthropic Claude API** (configurable)

---

## Funcionalidades

### Públicas
- Landing page con estadísticas en tiempo real, departamentos y documentos recientes
- Búsqueda con filtros por tipo, departamento, autor, carrera, año y palabras clave
- Vista de documentos Dublin Core
- Página "Acerca del Repositorio"
- Solicitud de acceso a la plataforma
- Restablecimiento de contraseña por email

### Privadas (requieren autenticación)
- Dashboard con estadísticas del sistema
- Subida de documentos con drag & drop
- Procesamiento automático con IA (resumen, palabras clave, clasificación)
- Gestión de colecciones (árbol jerárquico)
- Gestión de usuarios y roles (Admin / User)
- Aprobación de documentos con workflow de revisión
- Editor de metadatos Dublin Core
- Vista previa de documentos (PDF, imágenes)
- Exploración por colecciones

### Administración
- Panel de administración con métricas
- Configuración del sitio (mensaje informativo)
- Configuración SMTP para envío de emails
- Configuración de proveedores de IA
- Gestión de tipos documentales
- Gestión de departamentos académicos
- Aprobación de solicitudes de registro

---

## Estructura del Proyecto

```
GuIA/
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── api/                 # Hooks y cliente HTTP
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── documents/       # Documentos, cards, upload
│   │   │   ├── layout/          # AppLayout, Sidebar, Header
│   │   │   ├── public/          # Navbar, Footer, Hero
│   │   │   ├── search/          # SearchResults, Pagination
│   │   │   └── ui/              # Button, Input, Card, Modal, etc.
│   │   ├── pages/               # Páginas de la aplicación
│   │   │   ├── admin/           # Panel de administración
│   │   │   ├── auth/            # Login
│   │   │   └── public/          # Landing, búsqueda pública
│   │   ├── store/               # Estado global (Zustand)
│   │   └── types/               # Tipos TypeScript
│   ├── package.json
│   └── vite.config.ts
│
├── src/
│   ├── API/                     # Web API (ASP.NET Core)
│   │   ├── Controllers/         # Endpoints REST
│   │   ├── Middleware/          # Exception handling, logging
│   │   ├── Services/            # CurrentUserService
│   │   └── Program.cs           # Punto de entrada
│   │
│   ├── Application/             # Capa de aplicación
│   │   ├── Common/              # Interfaces y utilidades
│   │   ├── DTOs/                # Data Transfer Objects
│   │   ├── Ports/               # Puertos (interfaces externas)
│   │   └── UseCases/            # Commands, Queries, Handlers
│   │       ├── Auth/            # Login, registro, reset password
│   │       ├── Documents/       # Upload, AI, publicación
│   │       ├── Collections/     # CRUD de colecciones
│   │       ├── Search/          # Búsqueda full-text
│   │       └── SiteConfig/      # Configuración del sitio
│   │
│   ├── Domain/                  # Capa de dominio
│   │   ├── Entities/            # Document, User, Collection, etc.
│   │   ├── Enums/               # UserRole, DocumentStatus, etc.
│   │   ├── Events/              # Eventos de dominio
│   │   ├── Exceptions/          # Excepciones de dominio
│   │   └── ValueObjects/        # Email, LlmAnalysisResult
│   │
│   └── Infrastructure/          # Capa de infraestructura
│       ├── Adapters/            # SmtpEmailAdapter, ClaudeLlmAdapter, etc.
│       ├── Persistence/         # EF Core DbContext, configs, migrations
│       └── DependencyInjection.cs
│
├── GuIA.sln                     # Solución .NET
└── README.md
```

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

# Opción B: Usar una instancia existente (ajustar connection string en appsettings.json)
```

### 2. Backend

```bash
cd src/API
dotnet restore
dotnet run
# API disponible en http://localhost:5050
# Swagger en http://localhost:5050/swagger
# Admin por defecto: admin@guia.app / Admin123!
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App disponible en http://localhost:5173
# El proxy de Vite redirige /api → http://localhost:5050
```

---

## Rutas

### Públicas
| Ruta | Página |
|---|---|
| `/` | Landing page |
| `/buscar` | Búsqueda pública |
| `/documentos/:id` | Vista de documento |
| `/login` | Inicio de sesión |
| `/olvide-mi-contrasena` | Recuperar contraseña |
| `/reset-password` | Restablecer contraseña |
| `/solicitar-acceso` | Solicitar registro |
| `/acerca-del-repositorio` | Información institucional |

### App (autenticadas)
| Ruta | Página |
|---|---|
| `/app` | Dashboard |
| `/app/upload` | Subir documentos |
| `/app/search` | Buscar documentos |
| `/app/browse` | Explorar colecciones |
| `/app/documents/:id` | Vista de documento (solo lectura) |
| `/app/admin/*` | Panel de administración |

---

## API Endpoints

### Autenticación
- `POST /api/auth/login` — Iniciar sesión
- `POST /api/auth/refresh` — Refrescar token
- `POST /api/auth/forgot-password` — Solicitar restablecimiento
- `POST /api/auth/reset-password` — Restablecer contraseña
- `POST /api/auth/request-access` — Solicitar acceso

### Documentos
- `GET /api/search` — Búsqueda full-text con filtros
- `GET /api/documents/{id}` — Obtener documento
- `POST /api/documents/upload` — Subir documento (multipart)
- `PUT /api/documents/{id}/metadata` — Actualizar metadatos
- `POST /api/documents/{id}/publish` — Publicar
- `POST /api/documents/{id}/reject` — Rechazar
- `DELETE /api/documents/{id}` — Eliminar
- `GET /api/documents/{id}/preview/{fileId}` — Vista previa
- `GET /api/documents/{id}/download/{fileId}` — Descargar archivo
- `GET /api/documents/{id}/ai-suggestions` — Sugerencias IA

### Estadísticas
- `GET /api/stats/overview` — Estadísticas generales
- `GET /api/stats/departments` — Documentos por departamento

### Colecciones
- `GET /api/collections` — Árbol de colecciones
- `GET /api/collections/{id}` — Colección con documentos
- `POST /api/collections` — Crear colección
- `PUT /api/collections/{id}` — Actualizar colección
- `DELETE /api/collections/{id}` — Eliminar colección

### Administración
- `GET /api/admin/users` — Listar usuarios
- `GET /api/admin/users/pending` — Solicitudes pendientes
- `POST /api/admin/users/{id}/approve` — Aprobar usuario
- `GET /api/admin/stats` — Estadísticas del sistema
- `GET/PUT /api/admin/site-config` — Configuración del sitio
- `GET/PUT /api/admin/smtp-config` — Configuración SMTP
- `GET/PUT /api/admin/ai-settings` — Configuración IA
- `GET/PUT /api/admin/departments` — Departamentos
- `GET/PUT /api/admin/document-types` — Tipos documentales

### Configuración pública
- `GET /api/site-config` — Configuración del sitio (público)

---

## Variables de Entorno / Configuración

Archivo `src/API/appsettings.json`:

| Sección | Descripción |
|---|---|
| `ConnectionStrings:DefaultConnection` | Conexión a PostgreSQL |
| `Jwt:Secret` | Clave secreta para JWT (32+ caracteres) |
| `Jwt:AccessTokenExpirationMinutes` | Expiración del token de acceso |
| `Jwt:RefreshTokenExpiryDays` | Expiración del refresh token |
| `DeepSeek:ApiKey` | API Key de DeepSeek (para IA) |
| `Anthropic:ApiKey` | API Key de Anthropic/Claude (para IA) |
| `FileStorage:BasePath` | Ruta de almacenamiento de archivos |
| `Cors:Origins` | Orígenes permitidos para CORS |

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

Desarrollado para el Instituto Universitario Patagónico de las Artes (IUPA).
