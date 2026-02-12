import React from "react";
import Head from "next/head";
import { IoMdReturnLeft } from "react-icons/io";
import BackButton from "@/components/BackButton/BackButton";

export default function WhatsAppDeliveryPage() {
    const whatsappDeliverySchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Envíos por WhatsApp I attend",
        "description":
            "Sistema de envío de invitaciones por WhatsApp utilizando el API oficial de Meta. Envíos seguros, automatizados y gestionados por créditos para bodas y eventos.",
        "applicationCategory": "EventManagementApplication",
        "operatingSystem": "Web",
        "brand": {
            "@type": "Brand",
            "name": "I attend"
        },
        "url": "https://iattend.mx/envios-whatsapp",
        "offers": {
            "@type": "Offer",
            "priceCurrency": "MXN",
            "availability": "https://schema.org/InStock",
            "url": "https://iattend.mx/precios"
        },
        "audience": {
            "@type": "Audience",
            "audienceType": "Personas que organizan bodas y eventos sociales"
        },
        "featureList": [
            "Envío de invitaciones por WhatsApp",
            "Uso del API oficial de WhatsApp (Meta)",
            "Envíos múltiples sin riesgo de bloqueo",
            "Sistema de créditos por envío",
            "300 créditos incluidos en I attend PRO",
            "Compra de créditos adicionales"
        ]
    };

    return (
        <div className="seo_first_container">
            {/* ================= SEO HEAD ================= */}
            <Head>
                <title>Envíos de Invitaciones por WhatsApp | I attend</title>

                <meta
                    name="description"
                    content="Envía invitaciones digitales por WhatsApp de forma segura usando el API oficial de Meta. Sistema de créditos, envíos múltiples y control total con I attend."
                />

                <meta
                    name="keywords"
                    content="envíos por whatsapp, invitaciones por whatsapp, whatsapp api eventos, envío masivo invitaciones, whatsapp bodas"
                />

                <meta name="robots" content="index, follow" />
                <meta name="author" content="I attend" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="Envíos de Invitaciones por WhatsApp | I attend"
                />
                <meta
                    property="og:description"
                    content="Envía invitaciones por WhatsApp de forma segura y automatizada usando el API oficial de Meta, sin riesgo de bloqueos."
                />
                <meta
                    property="og:url"
                    content="https://iattend.mx/envios-whatsapp"
                />
                <meta property="og:site_name" content="I attend" />
                <meta
                    property="og:image"
                    content="https://iattend.mx/og/envios-whatsapp.jpg"
                />
                <meta property="og:locale" content="es_MX" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content="Envíos de Invitaciones por WhatsApp | I attend"
                />
                <meta
                    name="twitter:description"
                    content="Invitaciones digitales enviadas por WhatsApp de forma segura con créditos y API oficial."
                />
                <meta
                    name="twitter:image"
                    content="https://iattend.mx/og/envios-whatsapp.jpg"
                />

                {/* Schema.org */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(whatsappDeliverySchema)
                    }}
                />
            </Head>

            {/* ================= CONTENIDO ================= */}
            <div className="seo_second_container">
                <section className="seo_container" id="envios-whatsapp">

                    <div className="action_wrap">
                        <BackButton></BackButton>
                    </div>

                    <h2>Envíos de invitaciones por WhatsApp de forma segura y automatizada</h2>

                    <p>
                        Los <strong>envíos por WhatsApp de I attend</strong> están diseñados para que puedas
                        compartir tus <a href="/about/invitacion-paperless">invitaciones digitales</a> de manera
                        <strong>rápida, automatizada y segura</strong>,
                        sin poner en riesgo tu cuenta personal de WhatsApp.
                    </p>

                    <p>
                        Para lograrlo, I attend utiliza el <strong>API oficial de WhatsApp de Meta (Facebook)</strong>,
                        lo que permite realizar <strong>envíos múltiples</strong>
                        de forma controlada y profesional,
                        cumpliendo con las políticas de la plataforma.
                    </p>

                    <h3>Envíos seguros con el API oficial de WhatsApp</h3>

                    <p>
                        A diferencia de los envíos manuales o herramientas no oficiales,
                        el uso del <strong>API de WhatsApp</strong> evita bloqueos,
                        restricciones o sanciones en tu cuenta.
                        Esto garantiza que tus invitaciones lleguen correctamente
                        a tus <a href="/about/guest-management">invitados</a> sin afectar tu número personal.
                    </p>

                    <p>
                        Gracias a esta integración, puedes enviar <a href="/about/invitacion-paperless">invitaciones</a>
                        de forma masiva y ordenada,
                        manteniendo una experiencia confiable tanto para ti
                        como para tus invitados.
                    </p>

                    <h3>Sistema de créditos para envíos</h3>

                    <p>
                        Los envíos por WhatsApp en I attend se gestionan mediante un
                        <strong>sistema de créditos</strong>.
                        Cada vez que envías una invitación por WhatsApp,
                        se utiliza <strong>1 crédito por envío</strong>.
                    </p>

                    <p>
                        Este sistema te permite tener un control claro
                        sobre cuántos mensajes has enviado
                        y cuántos envíos te quedan disponibles.
                    </p>

                    <h3>Paquete I attend PRO con créditos incluidos</h3>

                    <p>
                        El <strong>paquete <a>I attend <b>PRO</b></a></strong> incluye
                        <strong> 300 créditos de envío por WhatsApp</strong>,
                        ideales para cubrir la mayoría de los eventos
                        sin necesidad de compras adicionales.
                    </p>

                    <p>
                        Estos créditos pueden utilizarse para enviar invitaciones
                        a tus invitados directamente desde la plataforma,
                        de forma automática y sin pasos adicionales.
                    </p>

                    <h3>Compra de créditos adicionales cuando lo necesites</h3>

                    <p>
                        Si tu evento requiere más envíos,
                        puedes <strong>adquirir créditos adicionales </strong>
                        de forma independiente.
                        Esto te da flexibilidad total para adaptarte
                        al tamaño y necesidades de tu lista de invitados.
                    </p>

                    <p>
                        De esta manera, solo pagas por los envíos que realmente utilizas,
                        manteniendo un sistema transparente y escalable.
                    </p>

                    <h3>Comunicación directa, ordenada y confiable</h3>

                    <p>
                        Con los <strong>envíos por WhatsApp de I attend</strong>,
                        la comunicación con tus invitados es directa,
                        profesional y organizada.
                        Cada invitación llega de forma clara,
                        segura y en el momento adecuado,
                        mejorando la experiencia general de tu evento.
                    </p>

                </section>
            </div>

        </div>
    );
}
