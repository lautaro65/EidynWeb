import { getLocale } from "next-intl/server";
import { LegalPageShell, type LegalSection } from "@/components/legal-page-shell";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === "es" ? "Términos - Eidyn" : "Terms - Eidyn",
    description: locale === "es" ? "Términos y condiciones de uso de Eidyn." : "Eidyn terms and conditions of use.",
  };
}

export default async function TermsPage() {
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
        eyebrow: "Términos",
        title: "Condiciones para usar Eidyn como tienda, marca o equipo operador",
        intro:
          "Estos términos regulan el acceso y uso del dashboard, la API, el widget embebible y cualquier funcionalidad relacionada con la infraestructura 3D de Eidyn. Al usar el servicio, aceptás estas condiciones en nombre propio o de la organización que representás.",
        lastUpdatedLabel: "Última actualización",
        lastUpdated: "3 de junio de 2026",
        backLabel: "Volver al inicio",
        contactTitle: "¿Necesitás una aclaración legal?",
        contactText:
          "Si tu equipo necesita revisar un acuerdo comercial, condiciones enterprise o cuestiones de cumplimiento antes de integrar Eidyn, escribinos y coordinamos una respuesta formal.",
        contactCta: "Hablar con nosotros",
        sections: [
          {
            title: "1. Alcance del servicio",
            paragraphs: [
              "Eidyn ofrece software y servicios para digitalizar prendas, administrar activos 3D, conectar tiendas y habilitar experiencias de virtual try-on. Algunas funciones pueden estar en beta, limitadas por plan o sujetas a disponibilidad técnica.",
            ],
          },
          {
            title: "2. Cuentas y acceso",
            bullets: [
              "Cada cuenta debe mantener datos de acceso correctos y actualizados.",
              "La organización titular es responsable por la actividad realizada desde sus usuarios, claves API y entornos conectados.",
              "Podemos suspender acceso si detectamos abuso, fraude, uso no autorizado o riesgo para la plataforma.",
            ],
          },
          {
            title: "3. Uso aceptable",
            bullets: [
              "No podés usar Eidyn para infringir leyes, derechos de terceros o políticas de privacidad aplicables.",
              "No podés intentar extraer activos protegidos, eludir límites de seguridad o automatizar abuso de la API.",
              "No podés cargar contenido que no tengas derecho a usar, incluyendo texturas, fotos, logos o materiales protegidos sin autorización.",
            ],
          },
          {
            title: "4. Datos de tienda, prendas y usuarios finales",
            paragraphs: [
              "Sos responsable de contar con las autorizaciones necesarias para subir contenido, conectar catálogos y procesar datos de usuarios finales dentro de tu jurisdicción. Eidyn actúa como plataforma tecnológica y espera que cada tienda configure su operación de forma legal y transparente.",
            ],
            bullets: [
              "Las tiendas deben informar adecuadamente a sus usuarios finales sobre el uso del probador virtual.",
              "Los consentimientos para datos sensibles o biométricos deben respetarse según el flujo del producto y la normativa aplicable.",
              "Podemos limitar o retirar contenido si existe un reclamo razonable de infracción, fraude o riesgo de seguridad.",
            ],
          },
          {
            title: "5. Planes, pagos y límites",
            paragraphs: [
              "Algunas funcionalidades pueden estar sujetas a planes pagos, límites de generación, uso de API, almacenamiento o cantidad de prendas. Si contratás un plan comercial, aceptás los precios y condiciones vigentes al momento de la compra o del acuerdo firmado.",
            ],
          },
          {
            title: "6. Propiedad intelectual",
            paragraphs: [
              "Eidyn conserva todos los derechos sobre la plataforma, interfaces, software, marcas y componentes técnicos. Tu organización conserva sus derechos sobre el contenido propio que sube, siempre que tenga autoridad para usarlo.",
            ],
            bullets: [
              "No se otorga una cesión del software ni del código fuente.",
              "El uso del servicio implica una licencia limitada, revocable y no exclusiva para operar dentro del producto.",
              "Podemos usar feedback o sugerencias de producto para mejorar la plataforma sin obligación de compensación adicional.",
            ],
          },
          {
            title: "7. Garantías, disponibilidad y responsabilidad",
            paragraphs: [
              "Eidyn busca ofrecer un servicio estable, pero no garantiza ausencia total de errores, interrupciones o incompatibilidades con sistemas de terceros. En la máxima medida permitida por ley, la plataforma se ofrece tal como está y según disponibilidad.",
              "Salvo que un contrato específico diga lo contrario, Eidyn no será responsable por daños indirectos, pérdida de ganancias, pérdida de datos o interrupciones derivadas del uso de la plataforma, integraciones externas o decisiones comerciales de la tienda.",
            ],
          },
          {
            title: "8. Terminación",
            paragraphs: [
              "Podés dejar de usar el servicio en cualquier momento. También podemos suspender o terminar cuentas que incumplan estos términos, generen riesgo operativo o mantengan pagos pendientes relevantes.",
            ],
          },
        ],
      }
    : {
        eyebrow: "Terms",
        title: "Conditions for using Eidyn as a store, brand or operating team",
        intro:
          "These terms govern access to and use of the dashboard, API, embeddable widget and any feature related to Eidyn's 3D infrastructure. By using the service, you accept these conditions on your own behalf or on behalf of the organization you represent.",
        lastUpdatedLabel: "Last update",
        lastUpdated: "June 3, 2026",
        backLabel: "Back to home",
        contactTitle: "Need a legal clarification?",
        contactText:
          "If your team needs to review a commercial agreement, enterprise terms or compliance questions before integrating Eidyn, contact us and we will coordinate a formal response.",
        contactCta: "Talk to us",
        sections: [
          {
            title: "1. Scope of the service",
            paragraphs: [
              "Eidyn provides software and services to digitize garments, manage 3D assets, connect stores and enable virtual try-on experiences. Some features may be beta, plan-limited or subject to technical availability.",
            ],
          },
          {
            title: "2. Accounts and access",
            bullets: [
              "Each account must keep access credentials accurate and up to date.",
              "The organization owning the account is responsible for activity performed through its users, API keys and connected environments.",
              "We may suspend access if we detect abuse, fraud, unauthorized use or risk to the platform.",
            ],
          },
          {
            title: "3. Acceptable use",
            bullets: [
              "You may not use Eidyn to violate laws, third-party rights or applicable privacy obligations.",
              "You may not attempt to extract protected assets, bypass security limits or automate abusive API behavior.",
              "You may not upload content you do not have the right to use, including textures, photos, logos or protected materials without authorization.",
            ],
          },
          {
            title: "4. Store, garment and end-user data",
            paragraphs: [
              "You are responsible for having the necessary permissions to upload content, connect catalogs and process end-user data within your jurisdiction. Eidyn acts as a technology platform and expects every store to configure its operations in a lawful and transparent way.",
            ],
            bullets: [
              "Stores must properly inform end users about the use of the virtual try-on experience.",
              "Sensitive or biometric consents must be respected according to the product flow and applicable law.",
              "We may restrict or remove content if there is a reasonable claim of infringement, fraud or security risk.",
            ],
          },
          {
            title: "5. Plans, payments and limits",
            paragraphs: [
              "Some features may be subject to paid plans, generation limits, API usage limits, storage caps or garment quotas. If you purchase a commercial plan, you accept the pricing and terms in effect at the moment of purchase or in the signed agreement.",
            ],
          },
          {
            title: "6. Intellectual property",
            paragraphs: [
              "Eidyn retains all rights over the platform, interfaces, software, trademarks and technical components. Your organization retains rights over its own uploaded content, provided you have authority to use it.",
            ],
            bullets: [
              "No transfer of the software or source code is granted.",
              "Use of the service grants only a limited, revocable and non-exclusive license to operate within the product.",
              "We may use feedback and product suggestions to improve the platform without an obligation of additional compensation.",
            ],
          },
          {
            title: "7. Warranties, availability and liability",
            paragraphs: [
              "Eidyn aims to provide a stable service, but does not guarantee total absence of errors, interruptions or incompatibilities with third-party systems. To the maximum extent permitted by law, the platform is provided as is and as available.",
              "Unless a specific contract says otherwise, Eidyn will not be liable for indirect damages, loss of profit, data loss or service interruptions arising from platform use, external integrations or store-side business decisions.",
            ],
          },
          {
            title: "8. Termination",
            paragraphs: [
              "You may stop using the service at any time. We may also suspend or terminate accounts that breach these terms, create operational risk or maintain materially overdue payments.",
            ],
          },
        ],
      };

  return <LegalPageShell {...content} />;
}
