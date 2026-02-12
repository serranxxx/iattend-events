import React from "react";
import Head from "next/head";
import { IoMdReturnLeft } from "react-icons/io";
import BackButton from "@/components/BackButton/BackButton";

export default function GuestManagementPage() {
    const privacySchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Privacidad y Control de Acceso I attend",
        "description":
            "Sistema de privacidad para invitaciones digitales. Controla si tu evento es público o privado, protege el acceso con claves únicas y ofrece una experiencia personalizada a cada invitado.",
        "applicationCategory": "EventManagementApplication",
        "operatingSystem": "Web",
        "brand": {
            "@type": "Brand",
            "name": "I attend"
        },
        "url": "https://iattend.site/about/features/privacidad",
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
            "Eventos públicos y privados",
            "Control de acceso por clave única",
            "Links mágicos personalizados",
            "Invitaciones no compartibles",
            "Experiencia personalizada por invitado",
            "Pases digitales individuales",
            "Cambio de privacidad en cualquier momento"
        ]
    };

    return (
        <div className="seo_first_container">
            {/* ================= SEO & METADATA ================= */}
            <Head>
                <title>Privacidad y Control de Acceso en Invitaciones Digitales | I attend</title>

                <meta
                    name="description"
                    content="Decide si tu invitación es pública o privada. Protege tu evento con claves únicas, accesos personalizados y control total de quién puede ver y confirmar asistencia con I attend."
                />

                <meta
                    name="keywords"
                    content="invitaciones privadas, invitaciones públicas, control de acceso eventos, invitaciones con código, eventos privados bodas, privacidad invitaciones digitales"
                />

                <meta name="robots" content="index, follow" />
                <meta name="author" content="I attend" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="Privacidad y Control de Acceso en Invitaciones Digitales | I attend"
                />
                <meta
                    property="og:description"
                    content="Invitaciones públicas o privadas con control de acceso, claves únicas y experiencia personalizada para cada invitado."
                />
                <meta property="og:url" content="https://iattend.site/about/features/privacidad" />
                <meta property="og:site_name" content="I attend" />
                <meta
                    property="og:image"
                    content="https://iattend.site/about/features/privacidad.jpg"
                />
                <meta property="og:locale" content="es_MX" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content="Privacidad y Control de Acceso en Invitaciones Digitales | I attend"
                />
                <meta
                    name="twitter:description"
                    content="Controla quién puede ver tu invitación con eventos públicos o privados, claves únicas y accesos personalizados."
                />
                <meta
                    name="twitter:image"
                    content="https://iattend.site/about/features/privacidad.jpg"
                />

                {/* Schema.org */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(privacySchema)
                    }}
                />
            </Head>

            {/* ================= CONTENIDO ================= */}
            <div className="seo_second_container">
                <section className="seo_container" id="invitacion-privada">

                    <div className="action_wrap">
                        <BackButton></BackButton>
                    </div>

                    <h2>Privacidad y control de acceso en tus invitaciones digitales</h2>

                    <p>
                        Las <strong><a href="/about/invitacion-paperless">invitaciones digitales</a> de I attend</strong> cuentan con un sistema de
                        <strong>privacidad y control de acceso</strong> diseñado para adaptarse a las necesidades
                        de cada evento. Puedes elegir entre <strong>eventos públicos</strong> o
                        <strong>eventos privados</strong>, teniendo siempre el control total sobre
                        quién puede ver y <a href="/about/guest-management">confirmar asistencia</a> a tu invitación.
                    </p>

                    <p>
                        Esta flexibilidad te permite decidir si tu evento será abierto y fácil de compartir,
                        o completamente privado y exclusivo para las <a href="/about/guest-management">personas que tú elijas</a>.
                    </p>

                    <h3>Eventos públicos: invitaciones abiertas y fáciles de compartir</h3>

                    <p>
                        Un <strong>evento público</strong> es una invitación digital abierta,
                        disponible para <strong>cualquier persona que tenga el enlace</strong>.
                        Cualquier usuario puede ver la <a href="/about/invitacion-paperless">invitación</a> y <a href="/about/guest-management">confirmar su asistencia</a>,
                        lo que la convierte en una opción ideal para eventos abiertos,
                        celebraciones grandes o invitaciones sin restricción de acceso.
                    </p>

                    <p>
                        Las invitaciones públicas son <strong>fáciles de compartir</strong>,
                        rápidas de acceder y no requieren códigos ni validaciones adicionales.
                        Simplemente compartes el link y cualquier persona puede visualizar
                        la información del evento de forma inmediata.
                    </p>

                    <h3>Eventos privados: invitaciones seguras y exclusivas</h3>

                    <p>
                        En un <strong>evento privado</strong>, la <a href="/about/invitacion-paperless">invitación</a> está
                        <strong> restringida únicamente a tu <a href="/about/guest-management">lista de invitados</a></strong>.
                        Al abrir la invitación, se solicita una <strong>clave de acceso</strong>,
                        asegurando que solo las personas autorizadas puedan verla.
                    </p>

                    <p>
                        Cada invitado cuenta con una <strong>clave única y personal</strong>,
                        la cual <strong>no puede compartirse ni reutilizarse</strong>.
                        De esta manera, se garantiza que tu evento sea verdaderamente privado,
                        evitando filtraciones y accesos no autorizados.
                    </p>

                    <p>
                        En los eventos privados, la invitación <strong>no puede compartirse libremente </strong>
                        ni reenviarse a otras personas, ya que el acceso está ligado
                        exclusivamente a cada invitado registrado.
                    </p>

                    <h3>Invitaciones personalizadas para cada invitado</h3>

                    <p>
                        La modalidad de <strong>evento privado</strong> permite que la <a href="/about/invitacion-paperless">invitación</a>
                        sea completamente <strong>personalizada</strong>.
                        El sistema identifica quién está viendo la <a href="/about/invitacion-paperless">invitación</a> y puede mostrar
                        información específica para cada invitado.
                    </p>

                    <p>
                        Esto incluye detalles como la <strong>cantidad de <a href="/about/guest-management">pases disponibles</a></strong>,
                        los <strong>acompañantes aprobados</strong>,
                        una <strong>bienvenida personalizada</strong> con su nombre
                        y un <strong><a href="/about/pases-digitales">pase digital individual</a></strong> por cada asistente confirmado.
                    </p>

                    <p>
                        Esta experiencia personalizada eleva el nivel de la invitación,
                        haciendo que cada invitado se sienta tomado en cuenta
                        y reforzando el carácter exclusivo de tu evento.
                    </p>

                    <h3>Cambia la privacidad de tu evento cuando lo necesites</h3>

                    <p>
                        Desde el <strong><a href="/about/guest-management">dashboard de invitados</a></strong>, puedes
                        <strong>cambiar la modalidad del evento</strong>
                        de público a privado, o de privado a público,
                        de forma rápida y sencilla.
                    </p>

                    <p>
                        No existen restricciones ni complicaciones para realizar este cambio,
                        lo que te permite adaptar la privacidad de tu invitación
                        según las necesidades de tu evento en cualquier momento.
                    </p>

                    <h3>Privacidad flexible, segura y pensada para ti</h3>

                    <p>
                        Con el sistema de <strong>privacidad de I attend</strong>,
                        tú decides cómo se comparte tu <a href="/about/invitacion-paperless">invitación</a>.
                        Ya sea un evento abierto o una celebración completamente privada,
                        tienes la seguridad de que el acceso y la experiencia
                        estarán siempre bajo tu control.
                    </p>

                </section>

            </div>



        </div>
    );
}
