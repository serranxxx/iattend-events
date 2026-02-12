import React from "react";
import Head from "next/head";
import { IoMdReturnLeft } from "react-icons/io";
import BackButton from "@/components/BackButton/BackButton";

export default function DigitalPassesPage() {
    const digitalPassSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pases Digitales I attend",
        "description":
            "Pases digitales personalizados para bodas y eventos. Al confirmar asistencia, cada invitado recibe un pase digital con su información y mesa asignada.",
        "applicationCategory": "EventManagementApplication",
        "operatingSystem": "Web",
        "brand": {
            "@type": "Brand",
            "name": "I attend"
        },
        "url": "https://iattend.site/about/features/pases-digitales",
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
            "Pase digital personalizado por invitado",
            "Asignación automática de mesa",
            "Pases digitales por cada asistente confirmado",
            "Acceso digital desde la invitación",
            "Manejo de múltiples pases desde una sola invitación"
        ]
    };

    return (
        <div className="seo_first_container">
            {/* ================= SEO HEAD ================= */}
            <Head>
                <title>Pases Digitales Personalizados para Bodas y Eventos | I attend</title>

                <meta
                    name="description"
                    content="Al confirmar asistencia, cada invitado recibe un pase digital personalizado con su mesa asignada. Controla múltiples pases desde tu invitación con I attend."
                />

                <meta
                    name="keywords"
                    content="pases digitales, pase digital bodas, boleto digital eventos, pases personalizados, acceso digital eventos"
                />

                <meta name="robots" content="index, follow" />
                <meta name="author" content="I attend" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="Pases Digitales Personalizados para Eventos | I attend"
                />
                <meta
                    property="og:description"
                    content="Recibe un pase digital personalizado al confirmar asistencia, con tu mesa asignada y acceso directo desde la invitación."
                />
                <meta
                    property="og:url"
                    content="https://iattend.site/about/features/pases-digitales"
                />
                <meta property="og:site_name" content="I attend" />
                <meta
                    property="og:image"
                    content="https://iattend.site/about/features/pases-digitales.jpg"
                />
                <meta property="og:locale" content="es_MX" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content="Pases Digitales Personalizados para Eventos | I attend"
                />
                <meta
                    name="twitter:description"
                    content="Pases digitales personalizados con mesa asignada para bodas y eventos."
                />
                <meta
                    name="twitter:image"
                    content="https://iattend.site/about/features/pases-digitales.jpg"
                />

                {/* Schema.org */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(digitalPassSchema)
                    }}
                />
            </Head>

            {/* ================= CONTENIDO ================= */}
            <div className="seo_second_container">
                <section className="seo_container" id="pases-digitales">

                    <div className="action_wrap">
                        <BackButton></BackButton>
                    </div>

                    <h2>Pases digitales personalizados para bodas y eventos</h2>

                    <p>
                        Los <strong>pases digitales de I attend</strong> son una forma moderna,
                        práctica y segura de controlar el acceso a tu evento.
                        Al <a href="/about/guest-management">confirmar su asistencia</a>, cada invitado recibe automáticamente
                        un <strong>pase digital personalizado</strong> directamente desde la invitación.
                    </p>

                    <p>
                        Estos pases digitales eliminan la necesidad de boletos físicos
                        y permiten que cada invitado tenga su acceso siempre disponible
                        desde su celular, facilitando la logística del evento.
                    </p>

                    <h3>Pase digital generado automáticamente al confirmar asistencia</h3>

                    <p>
                        Una vez que un invitado <a href="/about/guest-management">confirma su asistencia</a>,
                        el sistema genera de forma automática un <strong>pase digital </strong>
                        con su información personal.
                        Esto garantiza que solo las personas confirmadas
                        cuenten con un acceso válido al evento.
                    </p>

                    <p>
                        Cada pase está vinculado al invitado y a su confirmación,
                        lo que lo convierte en un elemento único y seguro.
                    </p>

                    <h3>Pases digitales con mesa asignada</h3>

                    <p>
                        Cuando utilizas el módulo de <strong><a href="/about/mapa-de-mesas">organización por mesas</a></strong>,
                        el pase digital muestra de forma clara la <strong>mesa asignada </strong>
                        a cada invitado.
                        De esta manera, tus invitados saben exactamente
                        dónde deben sentarse desde el momento en que llegan al evento.
                    </p>

                    <p>
                        Esto ayuda a mejorar la experiencia del invitado
                        y reduce confusiones durante el acceso y la recepción.
                    </p>

                    <h3>Manejo de múltiples pases desde una sola invitación</h3>

                    <p>
                        I attend permite <strong>manejar múltiples pases digitales </strong>
                        desde una sola invitación.
                        Si un invitado cuenta con acompañantes aprobados,
                        se genera un <strong>pase digital por cada asistente confirmado</strong>.
                    </p>

                    <p>
                        Todos los pases están organizados y disponibles
                        dentro de la <a href="/about/invitacion-paperless">invitación</a>, facilitando su visualización
                        y uso el día del evento.
                    </p>

                    <h3>Acceso digital claro y organizado</h3>

                    <p>
                        Los pases digitales están diseñados para ser
                        <strong> claros, fáciles de usar y rápidos de mostrar</strong>.
                        Ya sea para control de acceso o simplemente
                        como referencia para los invitados,
                        el pase digital se convierte en una herramienta
                        práctica y funcional.
                    </p>

                    <p>
                        Con los <strong>pases digitales de I attend</strong>,
                        el acceso a tu evento se vuelve más ordenado,
                        moderno y alineado con una experiencia completamente digital.
                    </p>

                </section>

            </div>

        </div>
    );
}
