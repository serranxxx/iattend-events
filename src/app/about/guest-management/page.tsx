import React from "react";
import Head from "next/head";
import { IoMdReturnLeft } from "react-icons/io";
import BackButton from "@/components/BackButton/BackButton";

export default function GuestManagementPage() {
    const guestManagementSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Guest Management I attend",
        "description":
            "Plataforma de gestión de invitados para bodas y eventos. Controla listas, confirmaciones de asistencia, RSVP digital, pases y notificaciones en tiempo real.",
        "applicationCategory": "EventManagementApplication",
        "operatingSystem": "Web",
        "brand": {
            "@type": "Brand",
            "name": "I attend"
        },
        "url": "https://iattend.site/about/features/guest-management",
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
            "Lista de invitados digital",
            "Confirmación de asistencia (RSVP)",
            "Envío de invitaciones por WhatsApp",
            "Códigos de acceso y links mágicos",
            "Control de pases",
            "Descarga de listas en Excel",
            "Notificaciones en tiempo real"
        ]
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', flexDirection: 'column',
            maxHeight: '100vh', overflow: 'auto', width: '100%'
          }}>
            {/* ================= SEO & METADATA ================= */}
            <Head>
                <title>Guest Management y RSVP Digital para Bodas | I attend</title>

                <meta
                    name="description"
                    content="Gestiona y controla todos tus invitados desde un solo lugar. Guest Management con RSVP digital, listas, confirmaciones, pases y notificaciones en tiempo real con I attend."
                />

                <meta
                    name="keywords"
                    content="guest management, gestión de invitados, rsvp digital, lista de invitados bodas, confirmación de asistencia, control de invitados"
                />

                <meta name="robots" content="index, follow" />
                <meta name="author" content="I attend" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="Guest Management y RSVP Digital para Bodas | I attend"
                />
                <meta
                    property="og:description"
                    content="Controla toda tu lista de invitados, confirmaciones y pases desde una sola plataforma. Gestión de invitados moderna y sin complicaciones."
                />
                <meta
                    property="og:url"
                    content="https://iattend.site/about/features/guest-management"
                />
                <meta property="og:site_name" content="I attend" />
                <meta
                    property="og:image"
                    content="https://iattend.site/about/features/guest-management.jpg"
                />
                <meta property="og:locale" content="es_MX" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content="Guest Management y RSVP Digital para Bodas | I attend"
                />
                <meta
                    name="twitter:description"
                    content="Gestiona invitados, confirmaciones y pases con RSVP digital y notificaciones en tiempo real."
                />
                <meta
                    name="twitter:image"
                    content="https://iattend.site/about/features/guest-management.jpg"
                />

                {/* Schema.org */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(guestManagementSchema)
                    }}
                />
            </Head>

            {/* ================= CONTENIDO ================= */}
            <div className="seo_second_container">
                <section className="seo_container" id="guest-management">

                    <div className="action_wrap">
                        <BackButton></BackButton>
                    </div>

                    <h2>Guest Management: gestión total de invitados para tu evento</h2>

                    <p>
                        El <strong>Guest Management de I attend</strong> es una plataforma completa de
                        <strong>gestión de invitados</strong> diseñada para que tengas el control absoluto
                        de tu lista de invitados desde el inicio hasta el día del evento.
                        Olvídate de listas desordenadas, mensajes perdidos o confirmaciones confusas.
                        Aquí controlas <strong>todo en un solo lugar</strong>.
                    </p>

                    <p>
                        Esta plataforma está pensada especialmente para bodas y eventos sociales,
                        permitiéndote organizar, clasificar y administrar a tus invitados de manera
                        <strong>fácil, clara y eficiente</strong>, incluso cuando tu lista crece.
                    </p>

                    <h3>Crea y organiza tu lista de invitados fácilmente</h3>

                    <p>
                        Desde el panel de guest management puedes <strong>crear tu lista de invitados</strong>
                        de forma rápida y sencilla. Al agregar un invitado puedes incluir información como
                        <strong>nombre, teléfono, categoría y acompañantes</strong>.
                    </p>

                    <p>
                        Las <strong>categorías de invitados</strong> te permiten clasificar a tus invitados
                        según tus propias necesidades: familia, amigos, compañeros de trabajo,
                        padrinos o cualquier categoría personalizada que desees crear.
                        Esto te ayuda a tener un mejor control según la importancia o tipo de invitado.
                    </p>

                    <h3>Lista de espera: invitados aún no enviados</h3>

                    <p>
                        Una vez que agregas invitados, estos aparecen en la <strong>lista de espera</strong>.
                        Esta lista contiene a todas las personas que has registrado, pero que
                        <strong>aún no han sido invitadas oficialmente</strong>.
                    </p>

                    <p>
                        Estar en la lista de espera no significa que el invitado ya tenga acceso a la invitación,
                        sino que está listo para ser invitado cuando tú lo decidas.
                        Esto te permite planear con calma y controlar cuándo y a quién enviar la invitación.
                    </p>

                    <h3>Códigos de acceso y links mágicos personalizados</h3>

                    <p>
                        Cada invitado cuenta con un <strong>código de acceso único</strong>, el cual le permite
                        ingresar a la <a href="/about/invitacion-paperless">invitación digital</a> de forma segura.
                        Además, I attend genera un <strong>link mágico personalizado</strong>,
                        que permite al invitado acceder directamente a la invitación
                        sin necesidad de ingresar manualmente su código.
                    </p>

                    <p>
                        Esto hace que la experiencia del invitado sea más cómoda, rápida y moderna,
                        reduciendo errores y facilitando el acceso a la invitación.
                    </p>

                    <h3>Envío automático de invitaciones por WhatsApp</h3>

                    <p>
                        Cuando decides invitar a alguien, puedes hacerlo con un solo clic usando el botón
                        de <strong><a href="/about/envios-whatsapp">enviar invitación</a></strong> o marcándolo como invitado.
                        Al hacerlo, la plataforma utiliza el <strong><a href="/about/envios-whatsapp">API de WhatsApp</a></strong>
                        para enviar automáticamente la <a href="/about/invitacion-paperless">invitación digital</a> al número registrado del invitado.
                    </p>

                    <p>
                        Una vez enviada la invitación, el invitado pasa automáticamente a la tabla de
                        <strong>esperando respuesta</strong>, donde se agrupan todas las personas
                        que ya recibieron la invitación pero aún no han confirmado su asistencia.
                    </p>

                    <h3>Confirmados, cancelados y control en tiempo real</h3>

                    <p>
                        Cuando un invitado responde a la invitación, el sistema actualiza su estado
                        automáticamente. Si confirma su asistencia, pasa a la tabla de
                        <strong>confirmados</strong>; si cancela, se mueve a la tabla de
                        <strong>cancelados</strong>.
                    </p>

                    <p>
                        La tabla de confirmados se convierte en tu <strong>lista final de asistencia</strong>,
                        donde puedes ver exactamente quiénes asistirán a tu evento,
                        incluyendo a sus acompañantes.
                    </p>

                    <h3>Control de pases y descargas en Excel</h3>

                    <p>
                        El guest management de I attend incluye un <strong>contador de pases</strong>
                        que te permite saber en todo momento cuántos pases has utilizado
                        y cuántos te quedan disponibles.
                        Esto es ideal para mantener el control de capacidad y evitar excedentes.
                    </p>

                    <p>
                        Además, puedes <strong>descargar todas las tablas</strong>
                        (lista de espera, esperando respuesta, confirmados y cancelados)
                        en formato <strong>Excel</strong> siempre que lo necesites,
                        facilitando la organización externa o el trabajo con proveedores.
                    </p>

                    <h3>Notificaciones en tiempo real</h3>

                    <p>
                        Cada vez que un invitado confirma o cancela su asistencia,
                        puedes recibir una <strong>notificación en tiempo real</strong>,
                        manteniéndote siempre informado del estado de tu evento
                        sin necesidad de revisar constantemente la plataforma.
                    </p>

                    <p>
                        Con el <strong>Guest Management de I attend</strong>, la gestión de invitados
                        deja de ser un problema y se convierte en un proceso claro,
                        ordenado y completamente digital, pensado para darte tranquilidad
                        y control total en uno de los aspectos más importantes de tu evento.
                    </p>

                </section>

            </div>


        </div>
    );
}
