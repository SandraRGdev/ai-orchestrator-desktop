# AI Orchestrator Desktop

Aplicación de escritorio (Tauri + React + TypeScript) para orquestar conversaciones con LLMs, comparar modelos y ejecutar flujos multi-agente.

## Qué puedes hacer

- Gestionar proveedores de IA (API keys y modelos).
- Crear conversaciones y cambiar título/eliminar chats.
- Comparar respuestas entre múltiples modelos.
- Crear, editar y eliminar workflows multi-agente.
- Ejecutar workflows con salida final y registro de ejecución.
- Configurar preferencias de onboarding y tema.

## Stack técnico

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Jotai.
- Desktop shell: Tauri v2.
- Backend app: Rust + Tokio.
- Base de datos local: SQLite (vía `sqlx`).

## Requisitos

- Node.js 18+
- npm 9+
- Rust (toolchain estable)
- Tauri prerequisites para tu sistema operativo

Referencia oficial de prerequisitos Tauri:
- https://tauri.app/start/prerequisites/

## Instalación

```bash
cd apps/ai-orchestrator-desktop
npm install
```

## Desarrollo local

```bash
cd apps/ai-orchestrator-desktop
npm run tauri:dev
```

Esto levanta frontend + backend de Tauri en modo desarrollo.

## Build de producción

```bash
cd apps/ai-orchestrator-desktop
npm run tauri:build
```

Artefactos generados:

- App/Binary: `src-tauri/target/release/`
- Bundles (ej. macOS `.app`/`.dmg`): `src-tauri/target/release/bundle/`

## Estructura principal

```text
apps/ai-orchestrator-desktop
├── src/                     # UI React
│   ├── components/          # Pantallas y componentes
│   ├── services/            # Invokes Tauri + lógica cliente
│   ├── stores/              # Estado global (Jotai)
│   └── types/               # Tipos compartidos/generados
├── src-tauri/
│   ├── src/
│   │   ├── commands/        # Comandos expuestos a frontend
│   │   ├── database/        # Migraciones + repositorios
│   │   ├── providers/       # Integraciones con proveedores LLM
│   │   ├── agents/          # Motor de agentes/workflows
│   │   └── services/        # Servicios de app (settings, etc.)
│   └── tauri.conf.json      # Configuración de Tauri/bundle
└── package.json
```

## Flujo de datos (resumen)

1. UI llama `invoke(...)` desde `src/services/*`.
2. Tauri enruta a comandos Rust (`src-tauri/src/commands/*`).
3. Los comandos usan repositorios/servicios.
4. Persistencia en SQLite local.
5. Respuesta vuelve al frontend para actualizar estado UI.

## Base de datos y migraciones

- Las migraciones están en `src-tauri/src/database/migrations/`.
- Se aplican al arrancar la app.
- Archivo de base de datos: directorio `app_data_dir` de Tauri.

## Solución de problemas

### 1) No aparecen cambios de una build

- Asegúrate de abrir la build recién generada.
- Si instalaste una app anterior, reemplázala.

### 2) Error al generar DMG en macOS (`hdiutil`)

- Puede ocurrir por permisos/sandbox.
- Reintenta build fuera de restricciones de sandbox.

### 3) Errores de modelos/proveedores

- Verifica API key y modelo seleccionado.
- Confirma que el modelo existe en el proveedor elegido.

## Recomendaciones para contribuir

1. Crea rama de feature/fix.
2. Implementa cambios pequeños y verificables.
3. Ejecuta build local antes de abrir PR.
4. Describe impacto funcional en el PR.

## Scripts útiles

```bash
npm run dev           # frontend Vite
npm run build         # build frontend
npm run tauri:dev     # app desktop en dev
npm run tauri:build   # bundle de producción
```

## Estado actual

El proyecto está orientado a uso local con proveedores LLM configurables y workflows multi-agente persistidos en SQLite.
