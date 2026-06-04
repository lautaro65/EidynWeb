import { getLocale } from "next-intl/server";
import { LegalPageShell, type LegalSection } from "@/components/legal-page-shell";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const isEs = locale === "es";

  const content: {
    eyebrow: string;
    title: string;
    intro: string;
    lastUpdatedLabel: string;
    lastUpdated: string;
    backLabel: string;
    contactTitle: string;
    contactText: string;
    contactCta: string;
    sections: LegalSection[];
  } = isEs
    ? {
        eyebrow: "Privacidad",
        title: "Cómo protegemos los datos de tu tienda y de tus usuarios",
        intro:
          "En Eidyn tratamos la información personal y biométrica con un estándar alto de seguridad. Esta política explica qué datos recolectamos, para qué los usamos y qué controles tienen las personas usuarias y las tiendas sobre esa información.",
        lastUpdatedLabel: "Última actualización",
        lastUpdated: "3 de junio de 2026",
        backLabel: "Volver al inicio",
        contactTitle: "Consultas sobre privacidad",
        contactText:
          "Si necesitás ejercer derechos de acceso, corrección o eliminación, o querés reportar una incidencia relacionada con datos personales o modelos 3D, podés escribirnos y te ayudamos a resolverlo.",
        contactCta: "Contactar al equipo",
        sections: [
          {
            title: "1. Qué información recolectamos",
            paragraphs: [
              "Recolectamos información de cuenta de las tiendas, como nombre, email, datos de autenticación y configuración del negocio. También almacenamos metadatos operativos como logs de acceso, estado de integraciones y uso de la API.",
              "Cuando un usuario final utiliza el probador virtual, podemos procesar datos necesarios para crear o servir un avatar 3D, medidas corporales derivadas y preferencias de sesión, siempre dentro del flujo autorizado por la tienda y por la propia persona usuaria.",
            ],
            bullets: [
              "Datos de cuenta: nombre, email, identificadores de login y datos básicos del tenant.",
              "Datos de tienda: configuración, dominios, claves API, eventos técnicos y uso del panel.",
              "Datos de usuarios finales: identidad de sesión, consentimiento por tienda, avatar activo y medidas derivadas cuando el servicio de modelado se usa.",
            ],
          },
          {
            title: "2. Cómo usamos los datos",
            paragraphs: [
              "Usamos los datos para operar el dashboard, autenticar a los usuarios, vincular tiendas, servir renders 3D y mejorar la estabilidad del producto. No usamos modelos biométricos para publicidad ni para reventa de datos.",
            ],
            bullets: [
              "Proveer autenticación, panel de administración y funcionalidades contratadas.",
              "Generar, almacenar y entregar activos 3D de forma segura y temporal cuando corresponde.",
              "Prevenir abuso, fraude, accesos no autorizados y usos fuera de los límites del servicio.",
            ],
          },
          {
            title: "3. Datos biométricos y modelos 3D",
            paragraphs: [
              "Los modelos 3D y las medidas derivadas se consideran información sensible. Eidyn aplica controles reforzados sobre esos datos y limita su acceso al mínimo necesario para operar el probador virtual.",
            ],
            bullets: [
              "Cada tienda requiere consentimiento explícito para usar el avatar o el modelo del usuario final.",
              "Los activos 3D pueden servirse mediante URLs firmadas con expiración para reducir exposición.",
              "El usuario final puede revocar consentimiento o solicitar eliminación cuando el flujo del producto lo permita.",
            ],
          },
          {
            title: "4. Compartición con terceros",
            paragraphs: [
              "Trabajamos con proveedores de infraestructura y procesamiento para alojar base de datos, autenticación, assets y automatizaciones. Solo compartimos la información necesaria para que esas prestaciones funcionen bajo acuerdos de confidencialidad y seguridad.",
            ],
            bullets: [
              "Hosting, base de datos, almacenamiento de archivos y CDN.",
              "Servicios de autenticación y envío de comunicaciones transaccionales.",
              "Proveedores técnicos involucrados en el pipeline de generación o entrega de modelos 3D.",
            ],
          },
          {
            title: "5. Retención y eliminación",
            paragraphs: [
              "Conservamos la información durante el tiempo necesario para prestar el servicio, cumplir obligaciones legales y resolver disputas. Cuando una cuenta se cierra o se solicita una eliminación válida, iniciamos el proceso para borrar o anonimizar los datos aplicables.",
            ],
          },
          {
            title: "6. Derechos y controles",
            bullets: [
              "Solicitar acceso a la información asociada a una cuenta o tenant.",
              "Corregir datos inexactos o desactualizados.",
              "Solicitar eliminación cuando no exista obligación legal de conservar la información.",
              "Revocar consentimientos otorgados por usuario final para tiendas específicas.",
            ],
          },
        ],
      }
    : {
        eyebrow: "Privacy",
        title: "How we protect store data and end-user information",
        intro:
          "At Eidyn, we treat personal and biometric information with a high security standard. This policy explains what we collect, why we use it, and what controls stores and end users have over that data.",
        lastUpdatedLabel: "Last update",
        lastUpdated: "June 3, 2026",
        backLabel: "Back to home",
        contactTitle: "Privacy questions",
        contactText:
          "If you need to exercise access, correction or deletion rights, or if you want to report a privacy-related incident involving personal data or 3D models, contact us and our team will help you.",
        contactCta: "Contact the team",
        sections: [
          {
            title: "1. Information we collect",
            paragraphs: [
              "We collect store account information such as name, email, authentication data and business configuration. We also store operational metadata like access logs, integration status and API usage.",
              "When an end user uses the virtual try-on flow, we may process the information needed to create or deliver a 3D avatar, derived body measurements and session preferences, always within the scope authorized by the store and the user.",
            ],
            bullets: [
              "Account data: name, email, login identifiers and tenant basics.",
              "Store data: configuration, domains, API keys, technical events and dashboard usage.",
              "End-user data: session identity, store-specific consent, active avatar and derived measurements when modeling is used.",
            ],
          },
          {
            title: "2. How we use data",
            paragraphs: [
              "We use data to run the dashboard, authenticate users, connect stores, serve 3D renders and improve platform reliability. We do not use biometric models for advertising or data resale.",
            ],
            bullets: [
              "Provide authentication, administration tools and contracted product features.",
              "Generate, store and securely deliver 3D assets when required.",
              "Prevent abuse, fraud, unauthorized access and misuse of the service.",
            ],
          },
          {
            title: "3. Biometric data and 3D models",
            paragraphs: [
              "3D models and derived body measurements are treated as sensitive information. Eidyn applies additional controls to that data and limits access to what is strictly necessary to operate the try-on experience.",
            ],
            bullets: [
              "Each store requires explicit consent before using an end user's avatar or model.",
              "3D assets may be delivered through signed, expiring URLs to reduce exposure.",
              "End users may revoke consent or request deletion when supported by the product flow and applicable law.",
            ],
          },
          {
            title: "4. Sharing with third parties",
            paragraphs: [
              "We work with infrastructure and processing providers to host databases, authentication, assets and automation. We only share the minimum information required to operate these services under confidentiality and security obligations.",
            ],
            bullets: [
              "Hosting, database, file storage and CDN providers.",
              "Authentication and transactional communication services.",
              "Technical vendors involved in the generation or delivery pipeline for 3D models.",
            ],
          },
          {
            title: "5. Retention and deletion",
            paragraphs: [
              "We retain information for as long as needed to provide the service, comply with legal obligations and resolve disputes. When an account is closed or a valid deletion request is received, we start the process to delete or anonymize applicable data.",
            ],
          },
          {
            title: "6. Rights and controls",
            bullets: [
              "Request access to the information associated with an account or tenant.",
              "Correct inaccurate or outdated data.",
              "Request deletion when there is no legal obligation to retain the information.",
              "Revoke end-user consents granted to specific stores.",
            ],
          },
        ],
      };

  return <LegalPageShell {...content} />;
}
