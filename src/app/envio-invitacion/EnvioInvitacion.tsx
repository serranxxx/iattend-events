"use client";

import { useEffect, useState } from "react";
import { Button, DatePicker, Progress, Timeline, Typography } from "antd";
import type { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { AddToCalendarButton } from "add-to-calendar-button-react";
import styles from "./envio-invitacion.module.css";

const { Title, Paragraph, Text } = Typography;

type Tipo = "local" | "destino";
type Viajeros = "ninguno" | "algunos" | "mayoria";
type Alta = "si" | "no";

const TOTAL_STEPS = 4;
const PAGE_BG = "#eeeadf";

function fmt(date: Dayjs) {
  return date.locale("es").format("D [de] MMMM [de] YYYY");
}

interface Milestone {
  label: string;
  date: Dayjs;
  detail?: string;
  muted?: boolean;
  calendarName?: string;
}

export default function EnvioInvitacion() {
  const [step, setStep] = useState(1);
  const [fechaEvento, setFechaEvento] = useState<Dayjs | null>(null);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [viajeros, setViajeros] = useState<Viajeros | null>(null);
  const [alta, setAlta] = useState<Alta | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Force body background (Safari margin fix)
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = PAGE_BG;
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, []);

  const progressPercent = showResult ? 100 : ((step - 1) / TOTAL_STEPS) * 100;

  function restart() {
    setStep(1);
    setFechaEvento(null);
    setTipo(null);
    setViajeros(null);
    setAlta(null);
    setShowResult(false);
  }

  function calcular() {
    if (!fechaEvento || !tipo || !viajeros || !alta) return;
    setShowResult(true);
  }

  let saveTheDate: Dayjs | null = null;
  let saveTheDateLabel = "";
  let invitacion: Dayjs | null = null;
  let rsvp: Dayjs | null = null;
  let headline = "";

  if (showResult && fechaEvento && tipo && viajeros && alta) {
    const esAlta = alta === "si";

    if (tipo === "destino") {
      const meses = esAlta ? 12 : 10;
      saveTheDate = fechaEvento.subtract(meses, "month");
      saveTheDateLabel = "Save the date (obligatorio en boda destino)";
      invitacion = fechaEvento.subtract(5, "month");
      rsvp = fechaEvento.subtract(8, "week");
      headline =
        "Tus invitados necesitan tiempo para planear el viaje — no lo dejes para después.";
    } else if (viajeros === "mayoria") {
      const meses = esAlta ? 10 : 8;
      saveTheDate = fechaEvento.subtract(meses, "month");
      saveTheDateLabel = "Save the date (la mayoría de tus invitados viaja)";
      invitacion = fechaEvento.subtract(4, "month");
      rsvp = fechaEvento.subtract(6, "week");
      headline =
        "Aunque tu boda es local, la mayoría viaja — te conviene tratarla casi como destino.";
    } else if (viajeros === "algunos") {
      const meses = esAlta ? 7 : 6;
      saveTheDate = fechaEvento.subtract(meses, "month");
      saveTheDateLabel = "Save the date (algunos invitados viajan)";
      invitacion = fechaEvento.subtract(10, "week");
      rsvp = fechaEvento.subtract(3, "week");
      headline =
        "Con algunos invitados foráneos, un aviso previo les ayuda a organizarse.";
    } else {
      if (esAlta) {
        saveTheDate = fechaEvento.subtract(5, "month");
        saveTheDateLabel = "Save the date (recomendado por la temporada)";
      }
      invitacion = fechaEvento.subtract(10, "week");
      rsvp = fechaEvento.subtract(3, "week");
      headline =
        "Boda local y sin foráneos: puedes ir con tiempos más cortos, sin perder el control.";
    }
  }

  const milestones: Milestone[] = [];
  if (showResult && fechaEvento && invitacion && rsvp) {
    if (saveTheDate) {
      milestones.push({
        label: saveTheDateLabel,
        date: saveTheDate,
        detail: "Un mensaje simple con la fecha, para que la aparten desde ya.",
        calendarName: "Enviar save the date",
      });
    }
    milestones.push({
      label: "Envía tu invitación formal",
      date: invitacion,
      detail:
        "Con toda la información: itinerario, dress code, mesa de regalos y RSVP.",
      calendarName: "Enviar invitación formal",
    });
    milestones.push({
      label: "Cierra confirmaciones (fecha límite RSVP)",
      date: rsvp,
      detail:
        "Para tener tiempo de armar mesas y avisar números finales a proveedores.",
      muted: true,
      calendarName: "Cerrar confirmaciones (RSVP)",
    });
    milestones.push({
      label: "Tu evento",
      date: fechaEvento,
      muted: true,
    });
  }

  return (
    <div className={styles.page_bg} style={{backgroundColor:'#eeeadf'}}>
      <div className={styles.wrap} >
        <Text className={styles.eyebrow}>I attend · Herramienta gratuita</Text>
        <Title level={1} className={styles.heading}>
          ¿Cuándo enviar tu invitación?
        </Title>
        <Paragraph className={styles.sub}>
          Responde 4 preguntas rápidas y te decimos exactamente cuándo mandar
          el save the date, la invitación formal y cuándo cerrar
          confirmaciones.
        </Paragraph>

        <Progress
          percent={progressPercent}
          steps={TOTAL_STEPS}
          showInfo={false}
          size={[76, 4]}
          strokeColor="var(--navy)"
          trailColor="rgba(28,50,73,0.15)"
          className={styles.progress}
        />

        {!showResult && (
          <div className={styles.card}>
            {step === 1 && (
              <div className={styles.step}>
                <Text className={styles.q_num}>Pregunta 1 de 4</Text>
                <Title level={2} className={styles.q_text}>
                  ¿Cuándo es tu evento?
                </Title>
                <DatePicker
                  className={styles.date_picker}
                  value={fechaEvento}
                  onChange={(date) => setFechaEvento(date)}
                  format="DD/MM/YYYY"
                  placeholder="Selecciona una fecha"
                  size="large"
                />
                <div className={styles.nav}>
                  <span />
                  <Button
                    type="primary"
                    className={styles.btn_primary}
                    disabled={!fechaEvento}
                    onClick={() => setStep(2)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.step}>
                <Text className={styles.q_num}>Pregunta 2 de 4</Text>
                <Title level={2} className={styles.q_text}>
                  ¿Tu boda es local o destino?
                </Title>
                <div className={styles.options}>
                  <Button
                    className={`${styles.opt} ${tipo === "local" ? styles.selected : ""}`}
                    onClick={() => setTipo("local")}
                  >
                    Local — la mayoría de mis invitados ya vive cerca
                  </Button>
                  <Button
                    className={`${styles.opt} ${tipo === "destino" ? styles.selected : ""}`}
                    onClick={() => setTipo("destino")}
                  >
                    Destino — mis invitados tienen que viajar para llegar
                  </Button>
                </div>
                <div className={styles.nav}>
                  <Button
                    type="text"
                    className={styles.btn_ghost}
                    onClick={() => setStep(1)}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="primary"
                    className={styles.btn_primary}
                    disabled={!tipo}
                    onClick={() => setStep(3)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={styles.step}>
                <Text className={styles.q_num}>Pregunta 3 de 4</Text>
                <Title level={2} className={styles.q_text}>
                  ¿Cuántos de tus invitados tendrían que viajar para llegar?
                </Title>
                <div className={styles.options}>
                  <Button
                    className={`${styles.opt} ${viajeros === "ninguno" ? styles.selected : ""}`}
                    onClick={() => setViajeros("ninguno")}
                  >
                    Casi ninguno
                  </Button>
                  <Button
                    className={`${styles.opt} ${viajeros === "algunos" ? styles.selected : ""}`}
                    onClick={() => setViajeros("algunos")}
                  >
                    Algunos
                  </Button>
                  <Button
                    className={`${styles.opt} ${viajeros === "mayoria" ? styles.selected : ""}`}
                    onClick={() => setViajeros("mayoria")}
                  >
                    La mayoría
                  </Button>
                </div>
                <div className={styles.nav}>
                  <Button
                    type="text"
                    className={styles.btn_ghost}
                    onClick={() => setStep(2)}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="primary"
                    className={styles.btn_primary}
                    disabled={!viajeros}
                    onClick={() => setStep(4)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className={styles.step}>
                <Text className={styles.q_num}>Pregunta 4 de 4</Text>
                <Title level={2} className={styles.q_text}>
                  ¿Tu fecha cae en puente, temporada alta o fin de año?
                </Title>
                <div className={styles.options}>
                  <Button
                    className={`${styles.opt} ${alta === "si" ? styles.selected : ""}`}
                    onClick={() => setAlta("si")}
                  >
                    Sí
                  </Button>
                  <Button
                    className={`${styles.opt} ${alta === "no" ? styles.selected : ""}`}
                    onClick={() => setAlta("no")}
                  >
                    No
                  </Button>
                </div>
                <div className={styles.nav}>
                  <Button
                    type="text"
                    className={styles.btn_ghost}
                    onClick={() => setStep(3)}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="primary"
                    className={styles.btn_primary}
                    disabled={!alta}
                    onClick={calcular}
                  >
                    Ver mi línea de tiempo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {showResult && (
          <>
            <div className={styles.result_card}>
              <Text className={styles.kicker}>Tu línea de tiempo</Text>
              <Title level={2} className={styles.headline}>
                {headline}
              </Title>
              <Timeline
                className={styles.timeline}
                items={milestones.map((m) => ({
                  color: m.muted ? "rgba(255,255,255,0.35)" : "var(--lilac)",
                  children: (
                    <div className={styles.milestone_txt}>
                      <div className={styles.m_label}>{m.label}</div>
                      <div className={styles.m_date}>{fmt(m.date)}</div>
                      {m.detail && (
                        <div className={styles.m_detail}>{m.detail}</div>
                      )}
                      {m.calendarName && (
                        <div className={styles.m_calendar}>
                          <AddToCalendarButton
                            name={m.calendarName}
                            options={["Google", "Apple", "Outlook.com"]}
                            startDate={m.date.format("YYYY-MM-DD")}
                            timeZone="America/Los_Angeles"
                          ></AddToCalendarButton>
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            </div>
            <Button className={styles.restart} type="text" onClick={restart}>
              Volver a empezar
            </Button>
          </>
        )}

        <Paragraph className={styles.footnote}>
          Esta calculadora te da una recomendación general basada en buenas
          prácticas de planeación de bodas — no sustituye tu criterio ni el de
          tu wedding planner. Ajusta las fechas según tu caso particular.
        </Paragraph>

        <div className={styles.cta}>
          <Text className={styles.cta_text}>Tu evento bajo control</Text>
          <Button
            type="primary"
            href="https://iattend.mx"
            target="_blank"
            rel="noreferrer"
            className={styles.cta_btn}
          >
            Descubre cómo funciona
          </Button>
        </div>
      </div>
    </div>
  );
}
