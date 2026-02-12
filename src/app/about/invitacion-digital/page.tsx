import BackButton from "@/components/BackButton/BackButton";
import React from "react";
import { IoMdReturnLeft } from "react-icons/io";

export default function Page() {
    const schemaProduct = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Invitaciones Digitales Paperless I attend",
        "description":
            "Invitaciones digitales paperless para bodas y eventos. Totalmente personalizables, editables sin límites y fáciles de compartir.",
        "brand": {
            "@type": "Brand",
            "name": "I attend"
        },
        "category": "Digital Invitations",
        "url": "https://iattend.site/about/features/invitaciones-paperless",
        "image": "https://iattend.site/about/features/invitaciones-paperlessjpg",
        "offers": {
            "@type": "Offer",
            "priceCurrency": "MXN",
            "availability": "https://schema.org/InStock",
            "url": "https://iattend.mx/precios"
        },
        "audience": {
            "@type": "Audience",
            "audienceType": "Parejas que planean bodas y eventos especiales"
        }
    };

    return (
        <div className="seo_first_container">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(schemaProduct),
                }}
            />

            {/* ================= CONTENIDO ================= */}
            <div className="seo_second_container">
                <section className="seo_container" id="invitacion-paperless">

                    <div className="action_wrap">
                        <BackButton />
                    </div>

                    <h2>¿Qué incluye una invitación digital paperless de I attend?</h2>

                    <p>
                        Las <strong>invitaciones digitales paperless de I attend</strong> están diseñadas para
                        bodas y eventos especiales que buscan una experiencia moderna, clara y fácil de usar.
                        Cada invitación incluye las siguientes secciones:
                    </p>

                    <ul className="seo_feature_list">
                        <li>
                            <strong>Portada con cuenta regresiva:</strong> portada visual con cuenta regresiva automática
                            que genera emoción y expectativa antes del evento.
                        </li>

                        <li>
                            <strong>Saludo inicial:</strong> mensaje de bienvenida personalizable para dar contexto
                            y marcar el tono del evento desde el inicio.
                        </li>

                        <li>
                            <strong>Personas importantes:</strong> sección para destacar a padres, padrinos,
                            damas de honor u otras personas clave del evento.
                        </li>

                        <li>
                            <strong>Cita o frase:</strong> espacio para agregar una frase significativa,
                            dedicatoria o mensaje especial.
                        </li>

                        <li>
                            <strong>Itinerario del evento:</strong> organización clara y visual de cada momento
                            del evento con horarios definidos.
                        </li>

                        <li>
                            <strong>Mapas, ubicación y cómo llegar:</strong> mapas interactivos con direcciones
                            para facilitar la llegada de tus invitados.
                        </li>

                        <li>
                            <strong>Clima del lugar:</strong> información del clima del evento para una mejor
                            planeación de vestimenta y logística.
                        </li>

                        <li>
                            <strong>Dress code:</strong> sección visual para comunicar el código de vestimenta
                            de forma clara y sin confusiones.
                        </li>

                        <li>
                            <strong>Imágenes de referencia:</strong> imágenes, paletas de color o enlaces
                            (como Pinterest) para mostrar ejemplos del dress code.
                        </li>

                        <li>
                            <strong>Mesa de regalos:</strong> mesa de regalos digital integrada con hasta
                            tres opciones como enlaces externos, tarjetas de regalo o transferencias.
                        </li>

                        <li>
                            <strong>Actividades y recomendaciones:</strong> módulo ideal para bodas destino,
                            donde puedes recomendar hospedaje, restaurantes o actividades.
                        </li>

                        <li>
                            <strong>Recordatorios y avisos importantes:</strong> sección para comunicar cambios
                            de horario, recomendaciones o información relevante.
                        </li>

                        <li>
                            <strong>Galería de fotos:</strong> galería visual para compartir recuerdos,
                            momentos especiales o imágenes significativas.
                        </li>

                        <li>
                            <strong>Pase digital:</strong> pase digital para facilitar el control de acceso
                            e identificación de invitados.
                        </li>

                        <li>
                            <strong>Privacidad de la invitación:</strong> control total sobre quién puede ver
                            la invitación y cómo se accede a ella.
                        </li>
                    </ul>

                    <h3>Invitaciones digitales 100% personalizables</h3>

                    <p>
                        Todas las <strong>invitaciones digitales de I attend</strong> son completamente
                        <strong> editables y personalizables</strong>. Puedes modificar contenido, diseño
                        y secciones las veces que quieras, incluso después de haber compartido la invitación,
                        sin costos adicionales ni reimpresiones.
                    </p>

                    <a href="/about/invitacion-paperless" style={{textDecoration:'underline'}}>Ver más</a>

                </section>
            </div>
        </div>
    );
}
