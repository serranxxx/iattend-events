import React from "react";
import Head from "next/head";
import { IoMdReturnLeft } from "react-icons/io";
import BackButton from "@/components/BackButton/BackButton";

export default function TableOrganizationPage() {
    const tableOrganizationSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Organización por Mesas I attend",
        "description":
            "Módulo de organización por mesas para bodas y eventos. Crea un mapa de mesas interactivo, asigna invitados confirmados y organiza tu seating chart de forma visual y sencilla.",
        "applicationCategory": "EventManagementApplication",
        "operatingSystem": "Web",
        "brand": {
            "@type": "Brand",
            "name": "I attend"
        },
        "url": "https://iattend.site/about/features/mapa-de-mesas",
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
            "Mapa de mesas interactivo",
            "Creación de mesas personalizadas",
            "Asignación de invitados confirmados",
            "Capacidad por mesa",
            "Mover mesas con drag & drop",
            "Filtros de invitados por acompañantes",
            "Búsqueda de invitados",
            "Transferencia de invitados entre mesas"
        ]
    };

    return (
        <div className="seo_first_container">
            {/* ================= SEO HEAD ================= */}
            <Head>
                <title>Organización por Mesas para Bodas | Seating Chart Digital | I attend</title>

                <meta
                    name="description"
                    content="Organiza a tus invitados confirmados con un mapa de mesas interactivo. Crea mesas, define capacidades y asigna invitados fácilmente con la organización por mesas de I attend."
                />

                <meta
                    name="keywords"
                    content="organización por mesas, seating chart bodas, mapa de mesas, asignación de invitados, mesas para bodas, organización de invitados"
                />

                <meta name="robots" content="index, follow" />
                <meta name="author" content="I attend" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="Organización por Mesas para Bodas | I attend"
                />
                <meta
                    property="og:description"
                    content="Crea y organiza tu seating chart con un mapa de mesas interactivo. Asigna invitados confirmados y controla capacidades de forma visual."
                />
                <meta
                    property="og:url"
                    content="https://iattend.site/about/features/mapa-de-mesas"
                />
                <meta property="og:site_name" content="I attend" />
                <meta
                    property="og:image"
                    content="https://iattend.site/about/features/mapa-de-mesas.jpg"
                />
                <meta property="og:locale" content="es_MX" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content="Organización por Mesas para Bodas | I attend"
                />
                <meta
                    name="twitter:description"
                    content="Organiza a tus invitados confirmados con un seating chart digital y un mapa de mesas interactivo."
                />
                <meta
                    name="twitter:image"
                    content="https://iattend.site/about/features/mapa-de-mesas.jpg"
                />

                {/* Schema.org */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(tableOrganizationSchema)
                    }}
                />
            </Head>

            {/* ================= CONTENIDO ================= */}
            <div className="seo_second_container">
                <section className="seo_container" id="mapa-mesas">

                    <div className="action_wrap">
                        <BackButton></BackButton>
                    </div>

                    <h2>Organización por mesas: seating chart digital para bodas y eventos</h2>

                    <p>
                        La <strong>organización por mesas de I attend</strong> es un módulo diseñado para facilitar
                        una de las tareas más importantes y delicadas de cualquier evento:
                        la <strong>asignación de <a href="about/guest-management">invitados confirmados</a> a sus mesas</strong>.
                        Todo se realiza de forma visual, ordenada y completamente digital.
                    </p>

                    <p>
                        Una vez que cuentas con tu <strong>lista de <a href="about/guest-management">invitados confirmados</a> </strong>,
                        estos quedan listos para ser organizados dentro del
                        <strong> mapa de mesas</strong>, permitiéndote crear un
                        <strong> seating chart interactivo</strong> adaptado a tu evento.
                    </p>

                    <h3>Mapa de mesas interactivo y personalizable</h3>

                    <p>
                        El <strong>mapa de mesas</strong> es un módulo visual donde puedes ver,
                        en un solo lugar, tus mesas y a tus <a href="about/guest-management">invitados confirmados</a> .
                        Desde aquí puedes <strong>crear tantas mesas como necesites</strong>,
                        asignarles un nombre, definir su <strong>capacidad de invitados </strong>
                        y acomodarlas libremente dentro del mapa.
                    </p>

                    <p>
                        Para reorganizar el espacio, simplemente puedes
                        <strong> arrastrar y soltar las mesas</strong> con el cursor,
                        colocándolas exactamente donde las necesites.
                        Esto te permite simular la distribución real del salón o lugar del evento
                        de manera rápida e intuitiva.
                    </p>

                    <h3>Asignación de invitados confirmados a las mesas</h3>

                    <p>
                        Una vez que tu mapa de mesas está creado, puedes comenzar con la
                        <strong> asignación de invitados</strong>.
                        Es importante destacar que <strong>solo los <a href="about/guest-management">invitados confirmados</a> </strong>
                        pueden ser asignados a una mesa, garantizando que tu organización
                        se base en tu lista final de asistencia.
                    </p>

                    <p>
                        Puedes agregar invitados a las mesas de dos maneras:
                        directamente desde el <strong>módulo de mesas </strong>
                        o desde la <strong><a href="about/guest-management">tabla de invitados confirmados</a> </strong>,
                        lo que te da flexibilidad para trabajar como te resulte más cómodo.
                    </p>

                    <h3>Edición y control total de cada mesa</h3>

                    <p>
                        Para administrar una mesa, solo necesitas seleccionarla y oprimir la opción
                        de <strong> editar</strong>. Desde ahí se habilitan las funciones para:
                        <strong> agregar invitados</strong> desde la lista de confirmados,
                        <strong> transferir invitados</strong> entre mesas o
                        <strong> eliminarlos</strong> de una mesa en caso de ser necesario.
                    </p>

                    <p>
                        Esto te permite hacer ajustes fácilmente, incluso si necesitas reorganizar
                        varias veces, sin perder el control de la capacidad de cada mesa.
                    </p>

                    <h3>Búsqueda y filtros para facilitar la organización</h3>

                    <p>
                        La lista de <a href="about/guest-management">invitados confirmados</a>  incluye una
                        <strong> barra de búsqueda</strong> y
                        <strong> filtros inteligentes</strong> que te ayudan a identificar rápidamente
                        quiénes asisten solos y quiénes vienen acompañados.
                    </p>

                    <p>
                        Estos filtros hacen que la organización por mesas sea mucho más ágil,
                        permitiéndote asignar grupos, parejas o invitados individuales
                        de manera eficiente y sin errores.
                    </p>

                    <h3>Seating chart claro, flexible y sin estrés</h3>

                    <p>
                        Con la <strong>organización por mesas de I attend</strong>,
                        el proceso de acomodar a tus invitados deja de ser complicado.
                        Puedes visualizar toda la distribución, hacer cambios en cualquier momento
                        y asegurarte de que cada invitado tenga su lugar asignado correctamente.
                    </p>

                    <p>
                        Este módulo está pensado para adaptarse a eventos de cualquier tamaño,
                        brindándote una herramienta clara, flexible y confiable
                        para organizar tu evento con tranquilidad y precisión.
                    </p>

                </section>

            </div>

        </div>
    );
}
