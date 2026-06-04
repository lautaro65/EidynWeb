# EIDYN

# EIDYN

## Documento de Producto y Arquitectura Técnica

v1.0 — 2025

## ¿Qué es Eidyn?

Eidyn es una plataforma SaaS de prueba de ropa virtual en 3D. Permite que cualquier tienda online (Shopify, WooCommerce, Tiendanube, etc.) ofrezca a sus clientes finales la posibilidad de probarse prendas digitalmente antes de comprarlas, reduciendo devoluciones y aumentando la conversión.

El sistema tiene tres partes independientes que trabajan juntas:

* Dashboard (eidyn.com): panel de control para los dueños de tienda. Acá suben sus prendas, gestionan modelos 3D y conectan sus tiendas.  
* API pública: el puente entre el sistema de Eidyn y cualquier plataforma de e-commerce. Las tiendas la consumen mediante una API Key propia.  
* Widget embebible: el componente visual que ve el cliente final dentro de la tienda. Se carga mediante un script y permite probarse las prendas en 3D.

## Flujo general del sistema

El recorrido completo de un usuario final en cualquier tienda que use Eidyn:

* Cliente entra a una prenda y toca Probarme esto  
* El widget detecta si tiene sesión activa en Eidyn  
* Si no tiene sesión: login con Google o email verificado  
* Si no tiene modelo 3D: flujo paso a paso con Bodygram  
* Si tiene modelo pero no autorizó esta tienda: pantalla de consentimiento  
* Si tiene todo: try-on directo, sin interrupciones  
* La URL del modelo 3D es firmada y expira en 1 hora (seguridad)

## Seguridad y privacidad

Los modelos 3D son datos biométricos sensibles. El sistema implementa múltiples capas de protección:

* OAuth real de Google: nadie puede hacerse pasar por otro usuario sin acceso real a su cuenta  
* Verificación de email obligatoria para registro con contraseña  
* Bloqueo de dominios de email desechables (tempmail, guerrillamail, etc.)  
* Consentimiento explícito por tienda: autorizar Tienda A no autoriza Tienda B  
* El modelo 3D nunca se descarga completo: solo se sirve una URL firmada con expiración de 1 hora  
* Rate limiting por API Key: si una tienda supera 100 requests por minuto, se bloquea automáticamente  
* Verificación manual de tiendas: modo sandbox primero, producción solo con aprobación  
* El usuario puede revocar el consentimiento de cualquier tienda en cualquier momento

## Dashboard — eidyn.com

*Panel de control para dueños de tienda*

El dashboard es la interfaz privada donde los dueños de tienda gestionan todo lo relacionado con Eidyn. El cliente final nunca lo ve.

### Autenticación y cuenta

* Registro con email y contraseña (con verificación de email)  
* Login con Google (OAuth)  
* Gestión del perfil de la tienda (nombre, logo, plan)  
* Panel de estado de verificación (sandbox / producción)

### Gestión de prendas (Garments)

* Subida de video o imagen de la prenda  
* Asignación de SKU único por prenda  
* Visualización del estado del procesamiento: pendiente / procesando / completado / fallido  
* Visualización del modelo 3D generado con previsualización  
* Edición de parámetros del mesh (largo de manga, ancho de pecho, cuello, etc.)  
* Listado de todas las prendas activas con filtros y búsqueda  
* Eliminación de prendas y sus assets asociados

### Conexión de tiendas (GarmentStoreLink)

* Vinculación de tiendas (Shopify, WooCommerce, Tiendanube)  
* Mapeo de SKU de Eidyn con el ID de producto de la tienda externa  
* Activar / desactivar links por producto  
* Vista del estado de conexión por tienda

### API Keys y seguridad

* Generación de API Keys para cada tienda conectada  
* Visualización de la clave pública (la secreta nunca se muestra de nuevo)  
* Configuración del rate limit por API Key  
* Activar / desactivar API Keys  
* Log de último uso por key

### Analytics

* Cantidad de try-ons por tienda y por producto  
* Usuarios con modelo creado vs sesiones anónimas  
* Tasa de conversión post try-on  
* Estado de los jobs de procesamiento IA (AiJob)

## API pública

*Consumida por Shopify, WooCommerce y cualquier plataforma*

La API es el puente entre el sistema interno de Eidyn y las tiendas externas. Toda request de una tienda debe incluir su API Key en el header x-api-key.

### Módulo de autenticación (/auth)

* POST /api/v1/auth/shop/register — Registra una nueva tienda, devuelve API Key y Secret  
* GET /api/v1/auth/shop/config — Consulta plan, límites y estado de la tienda  
* PATCH /api/v1/auth/shop/settings — Actualiza webhooks y configuraciones  
* POST /api/v1/auth/user/session — Identifica al usuario final (anónimo o logueado), devuelve user\_token

### Módulo de usuarios y modelos 3D (/users)

* POST /api/v1/users/create-model — Inicia el flujo de Bodygram para crear el modelo del usuario  
* GET /api/v1/users/profile — Devuelve estado del modelo, medidas y metadata  
* DELETE /api/v1/users/model — Elimina el modelo biométrico del usuario (cumplimiento GDPR)

### Módulo de prendas (/garments)

* POST /api/v1/garments/process-video — Inicia el pipeline async de extracción de textura y parámetros  
* POST /api/v1/garments/create-from-image — Pipeline IA desde imagen estática  
* GET /api/v1/garments/{garment\_id}/status — Consulta el progreso del procesamiento  
* GET /api/v1/garments/list — Lista prendas activas con metadata y assets

### Módulo de try-on (/tryon)

* POST /api/v1/tryon/render — Quick try-on con caché inteligente, devuelve URL firmada  
* POST /api/v1/tryon/outfit-room — Render avanzado con múltiples capas y colisiones físicas  
* GET /api/v1/tryon/history — Recupera outfits anteriores del usuario

### Analytics e infraestructura (/analytics)

* POST /api/v1/analytics/track-event — Registra eventos para reportes de conversión  
* GET /api/v1/health — Monitoreo de API, workers y GPU

## Widget embebible

*Lo que ve el cliente final dentro de la tienda*

El widget se carga en la tienda del cliente mediante un script de una sola línea. Detecta automáticamente el estado del usuario y muestra la pantalla correcta.

### Estados del widget

* needs\_auth — Login con Google o email  
* needs\_model — Paso a paso para crear el modelo 3D con Bodygram  
* needs\_consent — Autorización del usuario para que esa tienda use su modelo  
* ready — Try-on directo sin interrupciones

### Funcionalidades

* Login con Google OAuth o email verificado  
* Flujo guiado de creación de modelo 3D (Bodygram)  
* Pantalla de consentimiento por tienda con texto claro  
* Visualizador 3D interactivo de la prenda sobre el avatar del usuario  
* Historial de prendas probadas  
* Revocación del consentimiento desde el widget  
* Soporte para modo anónimo (sesión temporal sin guardar modelo)

## Pipeline 3D de prendas

El sistema no genera meshes desde cero. En cambio, usa un modelo base rigged (con UV mapping y huesos) y le aplica parámetros extraídos por IA de la foto o video de la prenda real.

### Pasos del pipeline

* El dueño de la tienda sube una foto o video de la prenda en el dashboard  
* El sistema lanza un AiJob de tipo garment\_texture para extraer el texture map  
* El sistema lanza un AiJob de tipo garment\_params para inferir las medidas (largo de manga, ancho de pecho, cuello, etc.)  
* El backend aplica el JSON de parámetros al modelo base rigged  
* El resultado se guarda como archivo GLB en Cloudflare R2  
* El estado del Garment pasa de processing a completed  
* El modelo queda disponible para todos los usuarios que tengan consentimiento en esa tienda

## Stack tecnológico

| Área | Tecnología | Por qué |
| ----- | ----- | ----- |
| Monorepo | pnpm \+ Turborepo | Una sola base de código, dependencias compartidas, builds coordinados |
| Dashboard \+ Landing | Next.js 15 \+ TypeScript | App Router, Server Components, deploy en Vercel |
| Estilos | TailwindCSS \+ shadcn/ui | Velocidad de desarrollo, componentes accesibles listos |
| API pública | Next.js Route Handlers | Mismo repo que el dashboard, sin fricción de setup |
| Base de datos | PostgreSQL — Neon | Serverless, escala automática, gratis en MVP |
| ORM | Prisma | TypeScript nativo, migraciones simples, type-safe |
| Auth dashboard | Clerk | Login listo en horas, OAuth, verificación de email incluida |
| Auth API | JWT propio | API Keys para las tiendas, sin dependencias externas |
| Storage \+ CDN | Cloudflare R2 | Barato, rápido, CDN global incluido, URLs firmadas |
| Procesamiento async | Inngest | Jobs sin infraestructura de colas, ideal para MVP |
| Widget | Vite \+ React \+ R3F | Bundle pequeño, Three.js para render 3D en el browser |
| Deploy web/api | Vercel | Integración nativa con Next.js, previews automáticas |
| Deploy widget | Cloudflare Pages | CDN global, gratis, latencia mínima |
| Modelos del usuario | Bodygram | Extracción de medidas biométricas desde fotos |
| Workers IA (futuro) | RunPod / Modal | GPU on-demand para procesamiento de prendas, pago por uso |

## Roadmap técnico

### Fase 1 — Monorepo y estructura base

* Setup del monorepo (pnpm \+ Turborepo)  
* Estructura de carpetas: apps/web, apps/api, apps/widget, packages/db  
* Configuración de Neon \+ Prisma \+ schema inicial  
* Autenticación con Clerk en el dashboard  
* Sistema de API Keys propias con JWT para tiendas  
* Dashboard base: registro de tiendas, perfil, configuración  
* Configurar i18n con next-intl: soporte para español e inglés por ruta (\[locale\]/...)  
* Configurar next-themes con ThemeProvider: dark/light mode sin flash, variables CSS en globals.css  
* Crear componente ThemeToggle con useTheme() para cambiar tema desde la UI  
* Verificar compatibilidad de shadcn/ui con los temas definidos

### Fase 2 — Pipeline de assets

* Subida de videos/imágenes a Cloudflare R2  
* Procesamiento async con Inngest (AiJobs)  
* Integración con Bodygram para modelos de usuario  
* Pipeline de extracción de textura y parámetros de prenda  
* Gestión de variantes por color y talle con estado de procesamiento visible

### Fase 3 — Dashboard completo

* Layout principal con sidebar, header y navegación responsive  
* Página de onboarding con stepper de 3 pasos  
* Gestión de prendas: listado, creación, variantes y previsualización 3D  
* Gestión de tiendas: conexión, mapeo SKU → producto externo (GarmentListing)  
* Verificación de dominio Shopify antes de activar API Key (validación con header x-shopify-shop-id)  
* Gestión de API Keys: generación, activación, desactivación y log de uso

### Fase 4 — MVP visual (Widget y API)

* Visualizador 3D con React Three Fiber  
* Widget embebible funcional: 4 estados (needs\_auth, needs\_model, needs\_consent, ready)  
* OrbitControls en modo read-only: solo rotación de cámara, sin manipulación del mesh  
* Widget session token temporal (TTL: 30 min) por cada visita para proteger acceso al GLB  
* Marca de agua “Powered by Eidyn” para tiendas sin plan premium (overlay HTML sobre el canvas)  
* API pública completa: autenticación, consentimiento, modelos, try-on con URL firmada de 1 hora  
* Plugin base para Shopify y WooCommerce  
* Flujo completo de try-on funcional end-to-end

### Fase 5 — Integraciones y analytics

* Plugin oficial para Shopify (app en Shopify Partners)  
* Plugin PHP para WooCommerce (.zip instalable)  
* Snippet universal documentado para Tiendanube, Wix, Squarespace  
* Dashboard de analytics: try-ons por día, tasa de conversión, top prendas  
* Tracking de eventos desde el widget (open, try-on, add-to-cart, purchase)  
* Monitoreo de infraestructura: health checks, alertas por AiJob fallido, log de rate limiting

### Fase 6 — IA y física

* Colisiones y layering de prendas  
* Deformaciones de mesh por talle  
* Mejora del pipeline de parámetros con más categorías de prendas  
* Render avanzado con múltiples capas (outfit-room)

### Fase 7 — Páginas públicas del sitio

* Home: hero con demo visual del widget, sección de features, tabla de planes y social proof  
* Navbar con links a About, Contacto, acceso al dashboard y toggle de idioma/tema  
* About Us: historia, misión, equipo y timeline visual del roadmap público  
* Contacto: formulario integrado con Resend para envío al equipo  
* Footer global con links legales, redes sociales y copyright  
* Páginas /privacy y /terms con texto legal base  
* SEO básico: metadata dinámica con generateMetadata() de Next.js (título, descripción, OG image)  
* Todas las páginas estáticas traducidas con strings en es.json y en.json

### Fase 8 — Escalabilidad

* Caché inteligente de renders (URL firmadas en Redis por combinación avatar+variante)  
* GPU scaling con RunPod o Modal para procesamiento paralelo de prendas  
* Cola de prioridad: tiendas en plan pago primero  
* CDN optimizada para assets 3D (reglas de caché en Cloudflare para GLBs)  
* Analytics avanzados y reportes de conversión  
* Migración de Inngest a BullMQ \+ Redis si el volumen lo requiere

Eidyn — Documento interno — v1.0

# ROAD MAP

**EIDYN**

Roadmap Técnico de Desarrollo

Paso a paso desde cero hasta producción  —  v1.0

Este documento es la guía de construcción de Eidyn. Cada fase está ordenada para que nunca construyas algo sin tener la base lista. Seguilo en orden.

## **Resumen de fases**

| \# | Fase | Qué construís | Resultado |
| ----- | :---- | :---- | :---- |
| **1** | **Monorepo y estructura** | Carpetas, pnpm, Turborepo, configuración base | Proyecto listo para desarrollar |
| **2** | **Base de datos y modelos** | Neon \+ Prisma \+ schema completo \+ migraciones | DB corriendo con todas las tablas |
| **3** | **Auth del dashboard** | Clerk \+ roles \+ API Keys propias para tiendas | Login funcionando end-to-end |
| **4** | **Dashboard — UI base** | Layout, navegación, páginas principales | Panel visual navegable |
| **5** | **Dashboard — Prendas** | Subida de assets, processing, variantes, modelos | Flujo completo de carga de prendas |
| **6** | **Dashboard — Tiendas** | Registro de tiendas, mapeo SKU, GarmentListing | Tiendas conectadas con sus prendas |
| **7** | **API pública — Base** | Autenticación, verificación de API Keys, rate limit | API segura lista para consumir |
| **8** | **API pública — Try-on** | Endpoints de usuario, modelo, try-on, consentimiento | API completa funcionando |
| **9** | **Widget embebible** | Componente React, estados, OAuth, visualizador 3D | Widget listo para instalar |
| **10** | **Integraciones** | Plugin Shopify, WooCommerce, Tiendanube | Tiendas reales usando Eidyn |
| **11** | **Analytics y monitoreo** | Eventos, conversión, health checks, logs | Dashboard con métricas reales |
| **12** | **Escala y optimización** | Caché, CDN, GPU scaling, BullMQ | Sistema listo para crecer |
| **13** | **Páginas públicas del sitio** | Home, About Us, Contacto, Términos y Privacidad | Sitio público listo para mostrar clientes |

| 1 FASE | Monorepo y estructura base Antes de escribir una línea de producto, dejá el proyecto bien parado |
| :---: | :---- |

Todo lo que construyas después depende de esta fase. Hacela bien y no vas a tener que rehacer nada.

**1.1. Instalar prerequisitos**

☐  Tener Node.js v18 o superior instalado

→  node \-v para verificar

☐  Instalar pnpm globalmente

→  npm install \-g pnpm

☐  Verificar pnpm instalado

→  pnpm \-v

**1.2. Crear el repositorio raíz**

☐  Crear carpeta principal del proyecto

→  mkdir eidyn && cd eidyn

☐  Inicializar git

→  git init

☐  Crear .gitignore con node\_modules, .env, .next, dist

**1.3. Configurar pnpm Workspaces**

☐  Inicializar package.json raíz

→  pnpm init

☐  Editar package.json raíz: agregar private: true y scripts de turbo

☐  Crear pnpm-workspace.yaml con apps/\* y packages/\*

☐  Instalar Turborepo como devDependency

→  pnpm add turbo \-D \-w

☐  Crear turbo.json con tasks: build, dev, lint

**1.4. Crear las 3 apps**

cd apps

pnpm create next-app web \--typescript \--tailwind \--eslint \--app \--src-dir

pnpm create next-app api \--typescript \--eslint \--app \--src-dir

pnpm create vite widget \--template react-ts

☐  Configurar puertos distintos en cada app

☐  web → puerto 3000

☐  api → puerto 3001

☐  widget → puerto 3002

**1.5. Crear los packages compartidos**

☐  Crear packages/db con su package.json

☐  Crear packages/types con su package.json

☐  Crear packages/ui con su package.json

☐  Configurar el nombre de cada package como @eidyn/db, @eidyn/types, @eidyn/ui

**1.6. Verificación final**

☐  Correr pnpm install desde la raíz sin errores

☐  Correr pnpm dev y que levanten las 3 apps

☐  Estructura de carpetas correcta (ver árbol en doc anterior)

✅ Resultado esperado: monorepo funcionando, 3 apps levantando en paralelo con un solo comando.

1.7.  Configurar i18n y next-themes en apps/web

☐  Instalar next-intl en apps/web

→  pnpm add next-intl \--filter web

☐  Crear carpeta messages/ con archivos es.json y en.json (strings base de la UI)

☐  Configurar next-intl middleware para detección automática de idioma por ruta (\[locale\]/...)

☐  Instalar next-themes en apps/web

→  pnpm add next-themes \--filter web

☐  Envolver el layout raíz de apps/web con ThemeProvider (atributo: class, defaultTheme: system)

☐  Agregar variables CSS de dark/light mode en globals.css (colores de fondo, texto, primario)

☐  Crear componente ThemeToggle con useTheme() para cambiar entre dark y light desde la UI

☐  Verificar que shadcn/ui respeta el tema aplicado (variables \--background, \--foreground, etc.)

✅ Resultado esperado: la app soporta español e inglés, el tema dark/light cambia sin flash, y los componentes shadcn respetan los colores definidos.

| 2 FASE | Base de datos y modelos Prisma Configurar Neon, conectar Prisma y migrar el schema completo |
| :---: | :---- |

**2.1. Configurar Neon**

☐  Crear cuenta en neon.tech

☐  Crear nuevo proyecto con nombre 'eidyn'

☐  Copiar el DATABASE\_URL de la consola de Neon 

**2.2. Instalar y configurar Prisma en packages/db**

cd packages/db

pnpm add prisma @prisma/client

npx prisma init

☐  Pegar el DATABASE\_URL en el .env de packages/db

☐  Copiar el schema.prisma completo de Eidyn al archivo generado

**2.3. Exportar el cliente de Prisma**

☐  Crear index.ts en packages/db que exporte PrismaClient

☐  Configurar singleton para evitar múltiples conexiones en desarrollo

☐  Agregar @eidyn/db como dependencia en apps/web y apps/api

**2.4. Correr migraciones**

npx prisma migrate dev \--name init

☐  Verificar que todas las tablas se crearon en Neon

☐  Correr npx prisma studio para visualizar la DB en el browser

✅ Resultado esperado: todas las tablas del schema creadas en Neon, Prisma Studio mostrando los modelos.

| 3 FASE | Autenticación del dashboard Clerk para el panel de control \+ API Keys JWT propias para tiendas |
| :---: | :---- |

**3.1. Configurar Clerk en apps/web**

☐  Crear cuenta en clerk.com y nuevo proyecto

☐  Instalar @clerk/nextjs en apps/web

☐  Agregar NEXT\_PUBLIC\_CLERK\_PUBLISHABLE\_KEY y CLERK\_SECRET\_KEY al .env

☐  Envolver el layout raíz con ClerkProvider

☐  Crear middleware.ts de Clerk para proteger rutas /dashboard/\*

**3.2. Sincronizar usuario de Clerk con la DB**

☐  Configurar webhook de Clerk para evento user.created

☐  Crear endpoint POST /api/webhooks/clerk en apps/api

☐  Al recibir user.created: crear registro en tabla User con el clerkId

☐  Al recibir user.updated: sincronizar email e imageUrl

**3.3. Crear el Tenant al registrarse**

☐  Al completar onboarding: crear Tenant en DB vinculado al User

☐  Asignar rol de owner al User en ese Tenant

☐  Crear Store inicial vacía para el Tenant

**3.4. Sistema de API Keys para tiendas**

☐  Crear función generateApiKey() que genere un par public/secret

☐  Guardar solo el hash del secret en DB (nunca en texto plano)

☐  Mostrar el secret UNA SOLA VEZ al dueño de la tienda al generarlo

☐  Verificar que la tienda Shopify es real antes de activar la API Key (validación de dominio Shopify)

→  Al registrar una tienda Shopify, pedir el myshopify.com domain (ej: mitienda.myshopify.com)

→  Hacer GET a https://{shop}.myshopify.com y verificar que responde con header x-shopify-shop-id

→  Guardar el shopId en DB y marcar la Store como shopifyVerified: true solo si la validación pasa

→  API Key no se activa hasta que shopifyVerified sea true (bloquear en el middleware)

☐  Mostrar estado de verificación en el dashboard de la tienda (pendiente / verificada / fallida)

☐  Crear middleware verifyApiKey() para las rutas de apps/api

☐  Verificar header x-api-key en cada request a la API pública

✅ Resultado esperado: login con Google y email funcionando, usuario sincronizado en DB, API Keys generándose correctamente.

| 4 FASE | Dashboard — UI base Layout, navegación y páginas principales del panel de control |
| :---: | :---- |

Instalá shadcn/ui antes de empezar: npx shadcn@latest init. Te da componentes listos (Button, Card, Table, Dialog, etc.) sin diseñarlos desde cero.

**4.1. Layout principal del dashboard**

☐  Crear /dashboard/layout.tsx con sidebar y header

☐  Sidebar con navegación: Prendas, Tiendas, API Keys, Analytics, Configuración

☐  Header con nombre del tenant, plan actual y botón de perfil/logout

☐  Responsive: sidebar colapsable en mobile

**4.2. Página de onboarding**

☐  Crear /onboarding con stepper de 3 pasos

☐  Paso 1: nombre de la tienda y logo

☐  Paso 2: tipo de tienda (Shopify / WooCommerce / Tiendanube / Otra)

☐  Paso 3: confirmación y generación de primera API Key

**4.3. Página de inicio del dashboard**

☐  Crear /dashboard con cards de resumen: prendas activas, tiendas conectadas, try-ons totales

☐  Estado de verificación del tenant (sandbox / producción)

☐  Accesos rápidos a las acciones más comunes

**4.4. Página de configuración**

☐  Editar nombre, logo y datos del tenant

☐  Gestionar plan y límites

☐  Ver estado de verificación y solicitar upgrade a producción

✅ Resultado esperado: dashboard navegable con todas las secciones, onboarding completo, UI limpia con shadcn.

| 5 FASE | Dashboard — Gestión de prendas Subida de assets, pipeline 3D, variantes por color y talle |
| :---: | :---- |

**5.1. Configurar Cloudflare R2**

☐  Crear cuenta en Cloudflare y activar R2

☐  Crear bucket 'eidyn-assets'

☐  Configurar credenciales R2 en .env: R2\_ACCESS\_KEY, R2\_SECRET\_KEY, R2\_BUCKET, R2\_ENDPOINT

☐  Instalar @aws-sdk/client-s3 (compatible con R2)

☐  Crear helper uploadToR2(file, path) en packages/db o packages/utils

**5.2. Página de listado de prendas**

☐  Crear /dashboard/garments con tabla de GarmentTemplates del tenant

☐  Columnas: SKU, nombre, categoría, variantes, estado, fecha

☐  Filtros por estado y categoría

☐  Botón Crear prenda

**5.3. Formulario de creación de prenda**

☐  Crear /dashboard/garments/new

☐  Campos: nombre, SKU (con validación de unicidad), categoría, género, marca, descripción

☐  Toggle isPublic: si está activo, cualquier tienda puede usar el modelo

☐  Guardar GarmentTemplate en DB al confirmar

**5.4. Gestión de variantes (color \+ talle)**

☐  En la página de detalle de cada prenda: sección de variantes

☐  Agregar variante: selector de color (con color picker), talle y sistema de talles

☐  Subida de video o imagen por variante

☐  Estado de procesamiento visible por variante: pendiente / procesando / listo / error

☐  Previsualización del modelo 3D cuando está listo

**5.5. Configurar Inngest para procesamiento async**

☐  Crear cuenta en inngest.com

☐  Instalar inngest en apps/api

☐  Crear función inngest garment/process-variant

☐  Al subir un asset: crear AiJob en DB y disparar el evento de Inngest

☐  El job actualiza el status de GarmentVariant en cada etapa

☐  Al completar: guardar processedModelUrl y marcar status completed

✅ Resultado esperado: flujo completo de carga de prenda con variantes, procesamiento async visible en tiempo real.

| 6 FASE | Dashboard — Gestión de tiendas Registro de tiendas externas y mapeo de prendas con productos |
| :---: | :---- |

**6.1. Página de tiendas conectadas**

☐  Crear /dashboard/stores con listado de tiendas del tenant

☐  Columnas: nombre, plataforma, productos mapeados, estado, API Key asignada

☐  Botón Conectar tienda

**6.2. Conectar una tienda nueva**

☐  Formulario: nombre de la tienda, plataforma (Shopify / WooCommerce / Tiendanube / Otra), URL

☐  Crear Store en DB vinculada al Tenant

☐  Generar o asignar una API Key para esa tienda

☐  Mostrar instrucciones de instalación del plugin según la plataforma

**6.3. Mapeo SKU → Producto externo (GarmentListing)**

☐  En el detalle de cada tienda: sección de prendas mapeadas

☐  Selector de GarmentTemplate disponible (propios \+ públicos)

☐  Campo para el externalProductId (ID del producto en Shopify/WooCommerce)

☐  Campo customName opcional

☐  Toggle isActive por mapping

☐  Crear GarmentListing en DB

**6.4. Gestión de API Keys**

☐  Crear /dashboard/api-keys con listado de keys activas

☐  Ver nombre, último uso, rate limit, fecha de expiración

☐  Generar nueva key (mostrar el secret UNA SOLA VEZ)

☐  Desactivar o eliminar keys

✅ Resultado esperado: tiendas conectadas con sus prendas mapeadas, API Keys gestionadas desde el dashboard.

| 7 FASE | API pública — Autenticación y seguridad Base segura de la API que consumen las tiendas externas |
| :---: | :---- |

Toda la API vive en apps/api. Cada endpoint debe pasar por el middleware de verificación de API Key antes de ejecutarse.

**7.1. Middleware de verificación de API Key**

☐  Leer header x-api-key de cada request

☐  Hashear la key recibida y buscar en DB

☐  Verificar que isActive sea true y que no haya expirado

☐  Actualizar lastUsedAt en cada uso

☐  Retornar 401 si no es válida

**7.2. Rate limiting**

☐  Instalar upstash/ratelimit o implementar con Redis

☐  Limitar por API Key: máximo definido en el campo rateLimit

☐  Retornar 429 con header Retry-After cuando se supera el límite

☐  Registrar en DB cuando una key es bloqueada por rate limit

**7.3. Autenticación de usuario final**

☐  POST /api/v1/auth/user/session: recibe el token de Google OAuth o email/password

☐  Verificar token con Google o validar credenciales propias

☐  Buscar o crear el EndUser (User en DB) por email o googleId

☐  Retornar un user\_token JWT firmado con expiración de 24 horas

**7.4. Endpoint de salud y monitoreo**

☐  GET /api/v1/health: retorna estado de la API, DB y workers

☐  Verificar conexión a Neon

☐  Verificar conexión a R2

✅ Resultado esperado: API con autenticación sólida, rate limiting funcionando, imposible hacer scraping masivo.

| 8 FASE | API pública — Endpoints de negocio Usuarios, modelos, prendas, try-on y consentimiento |
| :---: | :---- |

**8.1. Módulo de usuario y avatar (/users)**

☐  POST /users/create-model: inicia el flujo de Bodygram para el usuario

☐  GET /users/profile: devuelve estado del avatar, medidas y metadata

☐  DELETE /users/model: elimina el avatar y todos sus datos biométricos (GDPR)

**8.2. Módulo de consentimiento**

☐  GET /users/consent/{tenantId}: verifica si el usuario autorizó esta tienda

☐  POST /users/consent/{tenantId}: guarda el consentimiento (crear ShopConsent)

☐  DELETE /users/consent/{tenantId}: revocar consentimiento

**8.3. Módulo de prendas (/garments)**

☐  GET /garments/list: lista prendas activas para la tienda (según GarmentListing)

☐  GET /garments/{garment\_id}/status: progreso del procesamiento de una variante

☐  POST /garments/process-video: subir video e iniciar pipeline async

☐  POST /garments/create-from-image: subir imagen e iniciar pipeline

**8.4. Módulo de try-on (/tryon)**

☐  POST /tryon/render: verificar consentimiento \+ avatar \+ variante → devolver URL firmada del modelo

☐  La URL firmada de R2 debe expirar en 1 hora

☐  Registrar TryOnSession en DB

☐  GET /tryon/history: historial de try-ons del usuario en esa tienda

☐  POST /tryon/outfit-room: render avanzado con múltiples prendas (Fase 4 de producto)

✅ Resultado esperado: API completa y funcional. Una tienda puede autenticar usuarios, verificar consentimiento y servir modelos 3D.

| 9 FASE | Widget embebible El componente que ve el cliente final dentro de la tienda |
| :---: | :---- |

El widget vive en apps/widget. Se compila como un script de una sola línea que las tiendas incluyen en su HTML.

**9.1. Setup del widget**

☐  Configurar Vite para compilar como IIFE (un solo archivo JS)

☐  El script debe auto-inicializarse al cargarse en la página

☐  Leer el atributo data-api-key y data-product-id del tag del script

☐  Inyectar el widget en un div con id eidyn-widget

**9.2. Máquina de estados del widget**

☐  Implementar los 4 estados: needs\_auth, needs\_model, needs\_consent, ready

☐  Al cargar: llamar a la API para determinar el estado actual del usuario

☐  Transiciones entre estados sin recargar la página

**9.3. Pantalla needs\_auth**

☐  Botón Continuar con Google (Google OAuth popup)

☐  Opción de email con verificación

☐  Guardar user\_token en localStorage del browser

**9.4. Pantalla needs\_model**

☐  Integrar el SDK de Bodygram para captura de medidas

☐  Mostrar progreso del procesamiento en tiempo real (polling al endpoint de status)

☐  Confirmación cuando el modelo está listo

**9.5. Pantalla needs\_consent**

☐  Mostrar nombre de la tienda y descripción clara de qué se autoriza

☐  Checkbox de aceptación con link a política de privacidad

☐  Llamar POST /users/consent/{tenantId} al aceptar

**9.6. Pantalla ready — Visualizador 3D**

☐  Instalar React Three Fiber y Three.js en apps/widget

☐  Cargar el GLB del avatar desde la URL firmada

☐  Cargar el GLB de la prenda seleccionada

☐  Combinar avatar \+ prenda en la escena 3D

☐  Controles de cámara (rotar, zoom)

☐  Selector de talle y color con cambio en tiempo real

☐  Deshabilitar el arrastre directo sobre el modelo 3D (solo permitir rotación de cámara, no manipulación del mesh)

→  Usar OrbitControls en modo read-only: enablePan=false, enableRotate=true (solo en cámara), sin acceso directo al mesh

☐  Generar un widget session token temporal por cada visitante que abre el widget

→  Al inicializar el widget, llamar a GET /api/v1/widget/session con la API Key de la tienda

→  El servidor devuelve un JWT de sesión de corta duración (TTL: 30 min) vinculado a esa visita

→  El token expira e invalida el acceso al GLB: si alguien copia el script no tiene un token válido propio

→  Registrar el widget\_session\_token en DB con storeId \+ timestamp para auditoría

☐  Mostrar marca de agua “Powered by Eidyn” superpuesta al visor 3D si la tienda no tiene plan premium activo

→  El campo isPremium de la API Key (o del Tenant) se incluye en el JWT de sesión del widget

→  Si isPremium=false: renderizar overlay semitransparente con logo Eidyn en esquina inferior derecha del canvas

→  La marca de agua no puede removerse desde el cliente (se aplica como capa HTML sobre el canvas, no dentro del GLB)

✅ Resultado esperado: widget funcionando end-to-end en cualquier página HTML con una sola línea de código.

| 10 FASE | Integraciones con plataformas Plugins oficiales para Shopify, WooCommerce y Tiendanube |
| :---: | :---- |

**10.1. Plugin para Shopify**

☐  Crear app en Shopify Partners

☐  El plugin instala el script del widget en todas las páginas de producto

☐  Lee el product ID de Shopify y lo pasa como data-product-id al widget

☐  Panel de configuración dentro de Shopify Admin para pegar la API Key

**10.2. Plugin para WooCommerce**

☐  Crear plugin PHP (.zip instalable)

☐  Hook en single-product para inyectar el script del widget

☐  Página de configuración en el admin de WordPress para la API Key

**10.3. Snippet universal (cualquier plataforma)**

☐  Documentar cómo pegar el script manualmente en cualquier tienda

☐  Ejemplos para Tiendanube, Wix, Squarespace

✅ Resultado esperado: tiendas reales de Shopify y WooCommerce usando Eidyn con instalación en menos de 5 minutos.

| 11 FASE | Analytics y monitoreo Métricas de conversión, health checks y alertas |
| :---: | :---- |

**11.1. Tracking de eventos**

☐  POST /analytics/track-event: registrar eventos desde el widget (open, try-on, add-to-cart, purchase)

☐  Guardar en tabla Event con eventType y eventData

**11.2. Dashboard de analytics**

☐  Página /dashboard/analytics con gráficos de try-ons por día

☐  Tasa de conversión: usuarios que hicieron try-on vs compraron

☐  Top prendas más probadas

☐  Usuarios con modelo vs sesiones anónimas

**11.3. Monitoreo de infraestructura**

☐  GET /api/v1/health con estado detallado de todos los servicios

☐  Alertas por email cuando un AiJob falla más de 3 veces

☐  Log de rate limiting: tiendas que se acercan al límite

✅ Resultado esperado: dashboard de analytics operativo, alertas configuradas, visibilidad total del sistema.

| 12 FASE | Escala y optimización Solo cuando tengas clientes pagando y el sistema bajo carga real |
| :---: | :---- |

No implementes nada de esta fase antes de tener usuarios reales. Optimizar sin datos reales es perder tiempo.

**12.1. Caché inteligente de modelos**

☐  Cachear las URL firmadas de R2 en Redis por combinación avatar+variante

☐  Invalidar caché cuando se actualiza una variante

**12.2. GPU workers dedicados**

☐  Migrar el pipeline de procesamiento de prendas a RunPod o Modal

☐  Workers dedicados con GPU para procesamiento paralelo

☐  Cola de prioridad: tiendas en plan pago primero

**12.3. Migrar colas a BullMQ \+ Redis**

☐  Solo si Inngest se queda corto en volumen

☐  Mantener la misma interfaz para no cambiar el código de negocio

**12.4. CDN para assets 3D**

☐  Configurar reglas de caché en Cloudflare para los GLB de prendas

☐  Servir desde el edge más cercano al usuario

✅ Resultado esperado: sistema aguantando carga real, tiempos de carga de modelos bajo 2 segundos globalmente.

## **Reglas de desarrollo**

* Nunca saltar una fase. Cada fase es prerequisito de la siguiente.

* Primero que funcione, después que quede perfecto. El MVP es el objetivo de las primeras 9 fases.

* Un endpoint que no tiene test de curl no está terminado.

* Nunca guardar secrets en texto plano en la DB. Solo hashes.

* Toda URL de asset en R2 debe ser firmada con expiración. Nunca pública y permanente.

* Documentar cada API Key generada en los logs. Siempre saber quién está llamando la API y cuándo.

* Si encontrás un bug de seguridad, parás todo y lo arreglás antes de continuar.

| 13 | FASE | Páginas públicas del sitio  Solo una vez que las fases 1–12 estén validadas y funcionando |
| :---: | :---- |

Con toda la infraestructura validada, es el momento de construir la cara pública de Eidyn: el sitio de marketing que convierte visitantes en clientes. Usá apps/web con el i18n y next-themes ya configurados.

**13.1.  Home (página principal)**

☐  Crear /\[locale\]/page.tsx con sección hero: headline, subtitulo, CTA primario y demo visual del widget

☐  Sección de features: cards con los 3 beneficios principales (prueba virtual, aumento de conversión, integración en 5 min)

☐  Sección de precios: tabla de planes (free / pro / enterprise) con CTA a /dashboard/onboarding

☐  Sección de logos de plataformas compatibles (Shopify, WooCommerce, Tiendanube) y social proof

☐  Navbar con links a About, Contacto, acceso al Dashboard y toggle de idioma / tema

**13.2.  About Us**

☐  Crear /\[locale\]/about/page.tsx con la historia y misión de Eidyn

☐  Sección de equipo: fotos, nombres, roles y links a LinkedIn de los fundadores

☐  Sección de valores: los principios que guían el producto (privacidad, UX, accesibilidad)

☐  Timeline visual del roadmap público de la empresa (sin detalles técnicos internos)

**13.3.  Contacto**

☐  Crear /\[locale\]/contact/page.tsx con formulario: nombre, email, empresa, mensaje y tipo de consulta

☐  Integrar el formulario con Resend (o similar) para enviar el mensaje al email del equipo

☐  Mostrar datos de contacto directo: email de soporte, enlace a Discord/Slack comunitario si existe

**13.4.  Componentes transversales del sitio**

☐  Footer global con links legales (privacidad, términos), redes sociales y copyright

☐  Crear /\[locale\]/privacy/page.tsx y /\[locale\]/terms/page.tsx con el texto legal base

☐  Configurar SEO básico: metadata dinámica por página con generateMetadata() de Next.js (título, descripción, OG image)

☐  Todas las páginas estáticas deben estar traducidas (strings en es.json y en.json)

✅ Resultado esperado: sitio público de Eidyn completo y listo para mostrar a clientes — Home, About, Contacto, Términos y Privacidad, con dark mode, i18n y SEO configurados.

Eidyn  —  Roadmap Técnico v1.0  —  Documento interno

---

## **Anexo Arquitectónico: Pipeline 3D (Meshy Matrix Editor)**

Este anexo define la lógica de negocio y las decisiones técnicas detrás de la creación de prendas 3D y su visualización interactiva.

### 1. El Flujo de Creación (Matriz Cartesiana)
En lugar de forzar a las tiendas a crear cada modelo individualmente, el sistema utiliza un flujo de producto cartesiano inyectado con IA:
- **Cruce Dinámico**: Se definen texturas/colores y talles. El sistema genera automáticamente todas las variantes (Ej: Diseño 1 - S, Diseño 1 - M, Diseño 2 - L).
- **Modelo Base (Meshy)**: El usuario sube una foto frontal y trasera, y la API de Meshy (Image-to-3D) genera un único archivo `.GLB` base estático.
- **Editor Individual**: El usuario no tiñe el modelo con un color hexadecimal (`#FF0000`). En su lugar, el sistema permite subir un archivo `.png`/`.jpg` (Diffuse Map) independiente por cada variante para texturizar el modelo base. 

### 2. Lógica de Talles (Escalamiento Uniforme)
Dado que los generadores de IA (Meshy/Tripo3D) devuelven una malla estática sin esqueleto (Auto-Rigging no disponible en el MVP), el sistema utiliza **Escalamiento Uniforme Relativo**:
- El comerciante ingresa medidas físicas reales (Hombros, Pecho, Largo) agrupadas por talle en el Paso 4.
- El visor 3D en el front-end toma el `.GLB` base como referencia (ej: Talle M = `1.0`). 
- Basado en las proporciones de las medidas cargadas, calcula matemáticamente el factor de escala de los otros talles (ej: S = `0.9`, L = `1.1`).
- **Ventaja**: Garantiza que el modelo 3D no se deforme geométricamente en los ejes individuales, y al mismo tiempo permite ofrecer una "Guía de Talles" precisa al cliente final.

### 3. Texturas y Materiales
- El modelo base devuelto por Meshy ya contiene la textura de la "Primera Foto".
- En el Editor de Variantes, el comerciante sube nuevos diseños. El visor de Three.js / React Three Fiber tomará estas nuevas imágenes y **sobreescribirá el mapa difuso** del material original, logrando estampados y telas únicas sin necesidad de generar un `.GLB` pesado por cada variante, optimizando drásticamente la transferencia de red.
