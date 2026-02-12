import React from "react";
import Head from "next/head";
import { IoMdReturnLeft } from "react-icons/io";
import BackButton from "@/components/BackButton/BackButton";

export default function WhatsAppDeliveryPage() {
    const idealCustomerSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "I attend",
        "description":
            "Plataforma digital para organizar eventos, ideal para parejas, event planners y hosts que buscan controlar invitados, confirmaciones y logística de forma clara y sin estrés.",
        "applicationCategory": "EventManagementApplication",
        "operatingSystem": "Web",
        "brand": {
            "@type": "Brand",
            "name": "I attend"
        },
        "url": "https://iattend.site/about/cliente-ideal",
        "audience": [
            {
                "@type": "Audience",
                "audienceType": "Parejas que organizan su boda"
            },
            {
                "@type": "Audience",
                "audienceType": "Event planners y organizadores profesionales"
            },
            {
                "@type": "Audience",
                "audienceType": "Hosts y anfitriones de eventos"
            }
        ],
        "offers": {
            "@type": "Offer",
            "priceCurrency": "MXN",
            "availability": "https://schema.org/InStock",
            "url": "https://iattend.mx/precios"
        },
        "featureList": [
            "Gestión de invitados",
            "Confirmación de asistencia (RSVP)",
            "Organización por mesas",
            "Invitaciones públicas y privadas",
            "Pases digitales personalizados",
            "Envío de invitaciones por WhatsApp"
        ]
    };


    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', flexDirection: 'column',
            maxHeight: '100vh', overflow: 'auto', width:'100%'
        }}>
            {/* ================= SEO HEAD ================= */}
            <Head>
                <title>Para Quién es I attend | Plataforma para Organizar Eventos</title>

                <meta
                    name="description"
                    content="I attend es la plataforma ideal para parejas, event planners y hosts que organizan eventos. Controla invitados, confirmaciones y logística de forma clara y sin estrés."
                />

                <meta
                    name="keywords"
                    content="organizar eventos, organizar boda, event planners, gestión de invitados, plataforma eventos, software para bodas"
                />

                <meta name="robots" content="index, follow" />
                <meta name="author" content="I attend" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="Para Quién es I attend | Plataforma para Organizar Eventos"
                />
                <meta
                    property="og:description"
                    content="Una plataforma diseñada para parejas, event planners y hosts que buscan organizar eventos con control total y sin estrés."
                />
                <meta
                    property="og:url"
                    content="https://iattend.site/about/cliente-ideal"
                />
                <meta property="og:site_name" content="I attend" />
                <meta
                    property="og:image"
                    content="https://iattend.site/about/cliente-ideal.jpg"
                />
                <meta property="og:locale" content="es_MX" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content="Para Quién es I attend | Plataforma para Organizar Eventos"
                />
                <meta
                    name="twitter:description"
                    content="Organiza bodas y eventos con una plataforma pensada para quienes cuidan cada detalle."
                />
                <meta
                    name="twitter:image"
                    content="https://iattend.site/about/cliente-ideal.jpg"
                />

                {/* Schema.org */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(idealCustomerSchema)
                    }}
                />
            </Head>

            {/* ================= CONTENIDO ================= */}
            <div className="seo_second_container">
                <section className="seo_container" id="ideal-customer">

                    <div className="action_wrap">
                        <BackButton></BackButton>
                    </div>

                    <h2>I attend: la plataforma ideal para quienes organizan eventos</h2>

                    <p>
                        <strong>I attend</strong> está diseñada para personas que buscan
                        <strong>organizar eventos de forma clara, ordenada y sin estrés</strong>.
                        Ya sea una boda, un evento social o la gestión profesional de múltiples celebraciones,
                        la plataforma se adapta a distintos perfiles que comparten una misma necesidad:
                        <strong>tener <a href="/about/guest-management">control total sobre sus invitados</a> y su evento</strong>.
                    </p>

                    <p>
                        A continuación, te mostramos para quién es ideal I attend
                        y cómo puede ayudarte según tu rol en la organización del evento.
                    </p>

                    <h3>Parejas que organizan su boda</h3>

                    <p>
                        I attend es ideal para <strong>parejas que están planeando su boda</strong>
                        y desean tener el control completo desde el primer invitado hasta el gran día.
                        La plataforma les permite organizar su evento paso a paso,
                        gestionando <a href="/about/invitaciones-paperless">invitaciones</a>, <a href="/about/guest-management">confirmaciones</a>, accesos y <a href="/about/mapa-de-mesas">acomodos</a>
                        de manera clara y sencilla.
                    </p>

                    <p>
                        Con I attend, las parejas pueden <strong>organizar su boda sin estrés innecesario</strong>,
                        evitando confusiones, listas desordenadas o mensajes perdidos.
                        Todo el proceso se centraliza en un solo lugar,
                        brindando tranquilidad, confianza y una mejor experiencia
                        durante cada etapa de la planeación.
                    </p>

                    <h3>Event planners y organizadores profesionales</h3>

                    <p>
                        Para los <strong>event planners</strong>, I attend funciona como una
                        <strong>herramienta profesional de gestión de eventos</strong>.
                        Permite administrar <strong>múltiples eventos</strong>
                        de forma clara, ordenada y eficiente desde una sola plataforma.
                    </p>

                    <p>
                        El control de invitados, accesos, <a href="/about/guest-management">confirmaciones</a> y <a href="about/mapa-de-mesas">mesas</a>
                        facilita el trabajo operativo y mejora la comunicación con los clientes.
                        Esto se traduce en una <strong>mejor experiencia tanto para el organizador
                            como para los asistentes</strong>, elevando el nivel del servicio ofrecido.
                    </p>

                    <h3>Hosts y personas que cuidan cada detalle</h3>

                    <p>
                        I attend también es ideal para <strong>hosts y anfitriones</strong>
                        que se involucran en cada detalle de su evento.
                        Desde la organización de invitados hasta el <a href="about/guest-management">control de asistencia,</a>
                        la plataforma ofrece una <strong>gestión clara y estructurada</strong>
                        para que todo fluya sin contratiempos.
                    </p>

                    <p>
                        Esto permite que el anfitrión se enfoque en disfrutar su evento,
                        sabiendo que la logística está organizada y bajo control
                        desde el primer invitado hasta el último momento.
                    </p>

                    <h3>Una solución flexible para distintos tipos de eventos</h3>

                    <p>
                        I attend se adapta tanto a eventos pequeños como a celebraciones de gran escala.
                        Su enfoque flexible permite que cada usuario utilice solo las herramientas
                        que necesita, sin procesos complejos ni configuraciones innecesarias.
                    </p>

                    <p>
                        Si buscas una <strong>plataforma digital para organizar eventos</strong>,
                        <a href="about/guest-management">gestionar invitados</a> y confirmar asistencia con claridad,
                        I attend es una solución pensada para ti.
                    </p>

                </section>
            </div>

            {/* <Footer></Footer> */}

        </div>
    );
}
