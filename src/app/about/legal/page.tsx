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
                <section className="seo_container">

                <div className="action_wrap">
                        <BackButton></BackButton>
                    </div>
                    
                    <h2>AVISO DE PRIVACIDAD</h2>

                   

                        <h2 >Responsable del Tratamiento de los Datos Personales</h2>
                        <p>
                            <strong>LUIS ALBERTO SERRANO GARCÍA</strong>, titular del sitio web
                            <a href="https://www.iattend.mx" target="_blank" rel="noopener noreferrer">
                                www.iattend.mx
                            </a>
                            (en lo sucesivo, <strong>“I attend”</strong>), con domicilio en Chihuahua,
                            Chih C.P. 31130, en cumplimiento con la Ley Federal de Protección de Datos
                            Personales en Posesión de los Particulares (en adelante la “Ley”),
                            se presenta como responsable del tratamiento de los datos personales que
                            usted proporciona.
                        </p>

                        <h2>1. ¿Para qué fines utilizaremos sus datos personales?</h2>
                        <p>
                            Los datos personales que recabamos de usted serán utilizados para las
                            siguientes finalidades necesarias para el servicio que solicita:
                        </p>
                        <ul>
                            <li>Procesar y gestionar pedidos de invitaciones digitales personalizadas.</li>
                            <li>Proveer acceso y administrar usuarios en nuestra plataforma de organización de eventos.</li>
                            <li>Facilitar la gestión de confirmaciones de asistencia y datos relacionados con sus invitados.</li>
                            <li>Dar seguimiento a solicitudes de diseño y aclaraciones relacionadas con su pedido.</li>
                            <li>Emitir comprobantes de pago o facturación.</li>
                            <li>Notificarle sobre cambios en las condiciones del servicio y/o actualizaciones en la plataforma y servicios adquiridos.</li>
                            <li>Informarle sobre el estado que guarda su orden de compra.</li>
                            <li>Agendar reuniones.</li>
                            <li>Para efectuar seguimientos puntuales.</li>
                        </ul>



                        <h2>2. ¿Qué datos personales utilizaremos para estos fines?</h2>
                        <p>Para llevar a cabo las finalidades descritas, utilizaremos los siguientes datos personales:</p>
                        <ul>
                            <li>Nombre completo.</li>
                            <li>Teléfono celular.</li>
                            <li>Correo electrónico.</li>
                            <li>Datos de identificación (como CURP o RFC, si es necesario para facturación).</li>
                            <li>Datos de contacto.</li>
                            <li>Información sobre transacciones (monto, fecha y comprobante de transferencia).</li>
                            <li>Información de eventos, como listas de invitados, fechas y detalles logísticos proporcionados por el usuario.</li>
                        </ul>

                        <h2>3. Transferencia de información personal con terceros</h2>
                        <p>
                            Nos comprometemos a no transferir su información personal a terceros sin su
                            consentimiento, salvo en los casos previstos en el Artículo 37 de la Ley y
                            para las siguientes finalidades:
                        </p>
                        <ul>
                            <li>Con proveedores tecnológicos que apoyen el funcionamiento de la plataforma de invitaciones.</li>
                            <li>Para cumplir obligaciones legales o a solicitud de autoridades competentes.</li>
                        </ul>
                        <p>
                            Si usted no manifiesta su oposición para que sus datos personales sean
                            transferidos, se entenderá que existe su consentimiento para ello.
                        </p>

                        <h2>4. ¿Cómo puede acceder, rectificar, cancelar sus datos personales y/u oponerse a su uso?</h2>
                        <p>Usted tiene derecho a:</p>
                        <ul>
                            <li>Acceder a sus datos personales y conocer el uso que les damos (ACCESO).</li>
                            <li>Rectificar sus datos cuando sean inexactos o incompletos (RECTIFICACIÓN).</li>
                            <li>Cancelar sus datos cuando no sean necesarios para las finalidades indicadas (CANCELACIÓN).</li>
                            <li>Oponerse al uso de sus datos para finalidades específicas (OPOSICIÓN).</li>
                        </ul>
                        <p>
                            Para ejercer cualquiera de estos derechos ARCO, envíe su solicitud al correo
                            electrónico:
                            <a href="mailto:contacto.iattend@gmail.com">contacto.iattend@gmail.com</a>.
                        </p>
                        <p>La solicitud deberá incluir:</p>
                        <ul>
                            <li>Su nombre completo y datos de contacto.</li>
                            <li>Una descripción clara de los datos que desea rectificar, cancelar u oponerse a su uso.</li>
                            <li>Documentación que acredite su identidad.</li>
                        </ul>

                        <h2>5. ¿Cómo puede limitar el uso o divulgación de su información personal?</h2>
                        <p>
                            Para limitar el uso o divulgación de su información personal, puede enviar un
                            correo a
                            <a href="mailto:contacto.iattend@gmail.com">contacto.iattend@gmail.com</a>,
                            indicando de manera específica su solicitud.
                        </p>

                        <h2>6. ¿Cómo puede conocer los cambios en este aviso de privacidad?</h2>
                        <p>
                            Este aviso de privacidad puede ser modificado para cumplir con cambios
                            legales, prácticas internas o por ajustes en nuestro modelo de negocio.
                            Le notificaremos sobre cambios del presente aviso de privacidad a través de:
                            nuestro sitio web <strong>www.iattend.mx</strong>, por medio de nuestras
                            redes sociales o por correo electrónico.
                        </p>


                    <p className="privacy-update">
                        <strong>Última actualización:</strong> 04 de junio de 2025.
                    </p>
                </section>


            </div>

        </div>
    );
}
