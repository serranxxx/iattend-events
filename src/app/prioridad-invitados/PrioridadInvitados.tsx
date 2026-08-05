"use client";

import { useEffect, useMemo, useState } from "react";
import { Meh, Smile, Heart, Flame } from "lucide-react";
import styles from "./prioridad-invitados.module.css";

const PAGE_BG = "#16323d";

const STEP_Q1 = 0;
const STEP_Q2 = 1;
const STEP_Q3 = 2;
const STEP_Q4 = 3;
const STEP_RESULT = 4;
const TOTAL_STEPS = 5;

const LEVEL_VALUES = [1, 2, 3, 4] as const;
const LEVEL_ICONS = [Meh, Smile, Heart, Flame];
const LIGHT_GREEN = "#A8E6B0";
const LIGHT_PURPLE = "#D1BEDD";
const SLIDER_COLORS = [LIGHT_GREEN, LIGHT_PURPLE];
const TIER_COLORS: Record<Category, string> = {
  A: "#43B75D",
  B: "#0095FF",
  C: "#787878",
  D: "#D32F2F",
};

type AnswerKey = "necesity" | "probability" | "you" | "partner" | "obligation";
type Answers = Record<AnswerKey, number | null>;
type Category = "A" | "B" | "C" | "D";

interface ResultData {
  score: number;
  category: Category;
}

interface Level {
  value: number;
  label: string;
  desc: string | null;
}

const INITIAL_ANSWERS: Answers = {
  necesity: null,
  probability: null,
  you: null,
  partner: null,
  obligation: null,
};

const DOME_CX = 100;
const DOME_CY = 95;
const DOME_R = 78;
const DOME_START = 140;
const DOME_SWEEP = 260;

const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const domePath = (frac: number) => {
  const sweep = Math.max(frac, 0.001) * DOME_SWEEP;
  const start = polar(DOME_CX, DOME_CY, DOME_R, DOME_START);
  const end = polar(DOME_CX, DOME_CY, DOME_R, DOME_START + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${DOME_R} ${DOME_R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

const DOME_BG_PATH = domePath(1);

const COPY: Record<string, string> = {
  title: "Conoce la prioridad del invitado",
  subtitle: "3 preguntas rápidas, sin adivinar",
  btn_back: "Atrás",
  btn_next: "Siguiente",
  result_title: "Prioridad {{tier}}",
  q1_title: "¿Quieren que esté sí o sí?",
  q1_desc: "Esa persona que no puede faltar",
  q2_title: "¿Qué tan cercanos son hoy en día?",
  q2_desc: "No solo historia, también presente",
  q3_title: "¿Están de acuerdo los dos?",
  q3_desc:
    "A veces uno lo quiere ahí sí o sí, y el otro no tanto — cuéntanos por separado",
  q4_title: "¿Hay compromiso o presión externa por invitarlo?",
  q4_desc: "A veces se invita por obligación, no solo por cercanía",
  level_1: "Nice to have",
  level_2: "Me daría gusto",
  level_3: "Lo quiero ahí",
  level_4: "No puede faltar",
  level_1_desc: "Estaría bien, pero no es prioridad",
  level_2_desc: "Sumaría al evento, aunque no es esencial",
  level_3_desc: "Quiero que esté presente si se puede",
  level_4_desc: "No puede faltar bajo ninguna circunstancia",
  q2_level_1: "Ya casi no hablamos",
  q2_level_2: "Nos vemos de vez en cuando",
  q2_level_3: "Seguimos cercanos",
  q2_level_4: "Es parte de mi día a día",
  q2_level_1_desc: "La relación quedó más en el recuerdo que en el presente",
  q2_level_2_desc: "Hay contacto, pero no es frecuente",
  q2_level_3_desc: "Nos vemos o hablamos con regularidad",
  q2_level_4_desc: "Hablamos o convivimos todo el tiempo",
  q3_level_1: "No es indispensable para mí",
  q3_level_2: "A mí me daría igual",
  q3_level_3: "A mí sí me importa que esté",
  q3_level_4: "Para mí, sí o sí tiene que estar",
  q4_level_1: "Ninguna, es 100% nuestra decisión",
  q4_level_2: "Algo se esperaría, pero no sería grave si no va",
  q4_level_3: "Habría comentarios si no lo invitamos",
  q4_level_4:
    "Es una obligación real (familia directa, compromiso ya hecho, etc.)",
  q4_level_1_desc: "Nadie fuera de ustedes tiene voz en esta decisión",
  q4_level_2_desc: "Alguien lo esperaría, pero no pasaría nada grave",
  q4_level_3_desc: "Podría haber comentarios o incomodidad si falta",
  q4_level_4_desc: "Hay un compromiso o vínculo que lo hace indispensable",
  cat_a_name: "Imprescindible",
  cat_a_tagline: "De los que si faltan, se nota.",
  cat_a_desc:
    "No es solo cariño — es cercanía real, hoy. Ambos coinciden: sí o sí tiene que estar. Si el número de pases aprieta, esta persona ni entra en esa conversación.",
  cat_a_note:
    "Dale un lugar especial — probablemente también es parte del núcleo el día del evento.",
  cat_b_name: "Importante, no imprescindible",
  cat_b_tagline: "Lo quieres ahí, pero el mundo no se acaba si no puede.",
  cat_b_desc:
    "Hay ganas reales de que esté. Pero también hay margen: tal vez la cercanía bajó un poco, o uno lo siente más que el otro.",
  cat_b_note:
    "Si hay que ajustar la lista, aquí vale la pena mirar dos veces antes de decidir.",
  cat_c_name: "Puede quedar fuera",
  cat_c_tagline: "Bonito tenerlo, pero el evento no depende de eso.",
  cat_c_desc:
    "Quizás es otra etapa, o la relación quedó más en el recuerdo que en el presente. No hay nada malo en eso.",
  cat_c_note:
    "Si el espacio aprieta, aquí se puede recortar sin que se sienta como una falta.",
  cat_d_name: "Prioridad baja",
  cat_d_tagline: "No todo el mundo necesita un lugar en la lista, y está bien.",
  cat_d_desc:
    "Poca cercanía hoy, ninguna obligación real, cero comentarios si no va.",
  cat_d_note: "El recorte con menos costo emocional empieza aquí.",
  side_you: "Tú",
  side_partner: "Tu pareja",
  result_header_title: "¡Listo!",
  result_header_sub: "Aquí está el resultado",
  restart_btn: "Calificar a otro invitado",
};

const tt = (key: string, vars?: Record<string, string | number>) => {
  let str = COPY[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{{${k}}}`, String(v));
    });
  }
  return str;
};

export default function PrioridadInvitados() {
  const [step, setStep] = useState(STEP_Q1);
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [result, setResult] = useState<ResultData | null>(null);

  // Force body background (Safari margin fix)
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = PAGE_BG;
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, []);

  const buildLevels = (prefix: string, withDesc = true): Level[] =>
    LEVEL_VALUES.map((value) => ({
      value,
      label: tt(`${prefix}_${value}`),
      desc: withDesc ? tt(`${prefix}_${value}_desc`) : null,
    }));

  const Q1_LEVELS = useMemo(() => buildLevels("level"), []);
  const Q2_LEVELS = useMemo(() => buildLevels("q2_level"), []);
  const Q3_LEVELS = useMemo(() => buildLevels("q3_level", false), []);
  const Q4_LEVELS = useMemo(() => buildLevels("q4_level"), []);

  const CHIP_QUESTIONS: Record<
    number,
    { key: AnswerKey; title: string; desc: string; levels: Level[] }
  > = useMemo(
    () => ({
      [STEP_Q1]: {
        key: "necesity",
        title: tt("q1_title"),
        desc: tt("q1_desc"),
        levels: Q1_LEVELS,
      },
      [STEP_Q2]: {
        key: "probability",
        title: tt("q2_title"),
        desc: tt("q2_desc"),
        levels: Q2_LEVELS,
      },
      [STEP_Q4]: {
        key: "obligation",
        title: tt("q4_title"),
        desc: tt("q4_desc"),
        levels: Q4_LEVELS,
      },
    }),
    [Q1_LEVELS, Q2_LEVELS, Q4_LEVELS]
  );

  const OWNERS = useMemo(
    () => [
      { key: "you" as AnswerKey, label: tt("side_you"), color: SLIDER_COLORS[0] },
      {
        key: "partner" as AnswerKey,
        label: tt("side_partner"),
        color: SLIDER_COLORS[1],
      },
    ],
    []
  );

  const updateAnswer = (key: AnswerKey, value: number) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const isStepAnswered = () => {
    if (step === STEP_Q1) return answers.necesity !== null;
    if (step === STEP_Q2) return answers.probability !== null;
    if (step === STEP_Q3) return answers.you !== null && answers.partner !== null;
    if (step === STEP_Q4) return answers.obligation !== null;
    return true;
  };

  const computeResult = (): ResultData => {
    const necesity = Number(answers.necesity) || 0;
    const probability = Number(answers.probability) || 0;
    const perception = (Number(answers.you) + Number(answers.partner)) / 2;
    const obligation = Number(answers.obligation) || 0;
    const score =
      necesity * 0.35 + probability * 0.2 + perception * 0.2 + obligation * 0.25;

    let category: Category = "D";
    if (score >= 3.25) category = "A";
    else if (score >= 2.5) category = "B";
    else if (score >= 1.75) category = "C";

    return { score: Number(score.toFixed(2)), category };
  };

  const goNext = () => {
    if (!isStepAnswered()) return;
    if (step === STEP_Q4) {
      setResult(computeResult());
      setStep(STEP_RESULT);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const goBack = () => setStep((prev) => Math.max(STEP_Q1, prev - 1));

  const restart = () => {
    setAnswers(INITIAL_ANSWERS);
    setResult(null);
    setStep(STEP_Q1);
  };

  const isQuestion = step < STEP_RESULT;
  const chipQuestion = CHIP_QUESTIONS[step];
  const tierColor = result ? TIER_COLORS[result.category] : null;

  const categoryContent = useMemo(() => {
    if (!result) return null;
    const map = {
      A: {
        name: tt("cat_a_name"),
        tagline: tt("cat_a_tagline"),
        desc: tt("cat_a_desc"),
        note: tt("cat_a_note"),
      },
      B: {
        name: tt("cat_b_name"),
        tagline: tt("cat_b_tagline"),
        desc: tt("cat_b_desc"),
        note: tt("cat_b_note"),
      },
      C: {
        name: tt("cat_c_name"),
        tagline: tt("cat_c_tagline"),
        desc: tt("cat_c_desc"),
        note: tt("cat_c_note"),
      },
      D: {
        name: tt("cat_d_name"),
        tagline: tt("cat_d_tagline"),
        desc: tt("cat_d_desc"),
        note: tt("cat_d_note"),
      },
    };
    return map[result.category] ?? null;
  }, [result]);

  return (
    <div className={styles.page_wrap}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>I attend · Herramienta gratuita</p>
          <p className={styles.header_title}>
            {isQuestion ? tt("title") : tt("result_header_title")}
          </p>
          <p className={styles.header_sub}>
            {isQuestion ? tt("subtitle") : tt("result_header_sub")}
          </p>
          <div className={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <div
                key={index}
                className={`${styles.dot} ${index <= step ? styles.dot_filled : ""}`}
              />
            ))}
          </div>
        </div>

        <div className={styles.body}>
          {chipQuestion ? (
            <>
              <p className={styles.question_title}>{chipQuestion.title}</p>
              <p className={styles.question_desc}>{chipQuestion.desc}</p>
              <div className={styles.chip_list}>
                {chipQuestion.levels.map((level) => {
                  const selected = answers[chipQuestion.key] === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      className={`${styles.chip_row} ${selected ? styles.chip_row_selected : ""}`}
                      onClick={() => updateAnswer(chipQuestion.key, level.value)}
                    >
                      <span className={styles.chip_text}>
                        <span className={styles.chip_label}>{level.label}</span>
                        {level.desc && (
                          <span className={styles.chip_desc}>{level.desc}</span>
                        )}
                      </span>
                      <span className={styles.chip_radio} />
                    </button>
                  );
                })}
              </div>
            </>
          ) : step === STEP_Q3 ? (
            <>
              <p className={styles.question_title}>{tt("q3_title")}</p>
              <p className={styles.question_desc}>{tt("q3_desc")}</p>
              <div className={styles.gauge_list}>
                {OWNERS.map((owner) => {
                  const value = answers[owner.key];
                  const displayVal = value || 1;
                  const LevelIcon = LEVEL_ICONS[displayVal - 1];
                  const activeColor = value ? owner.color : "#4a6b7a";
                  return (
                    <div key={owner.key} className={styles.gauge_card}>
                      <div className={styles.gauge_head}>
                        <span className={styles.gauge_side}>{owner.label}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={4}
                        step={1}
                        value={displayVal}
                        onChange={(e) =>
                          updateAnswer(owner.key, parseInt(e.target.value, 10))
                        }
                        className={styles.gauge_slider}
                        style={{ accentColor: owner.color }}
                      />
                      <div className={styles.gauge_visual}>
                        <svg viewBox="0 0 200 168" className={styles.gauge_svg}>
                          <path
                            d={DOME_BG_PATH}
                            stroke="#345670"
                            strokeWidth={16}
                            fill="none"
                            strokeLinecap="round"
                          />
                          <path
                            d={domePath(displayVal / 4)}
                            stroke={owner.color}
                            strokeWidth={16}
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className={styles.gauge_center}>
                          <LevelIcon size={44} strokeWidth={2} style={{ color: activeColor }} />
                          <span
                            className={styles.gauge_center_label}
                            style={{ color: activeColor }}
                          >
                            {Q3_LEVELS[displayVal - 1].label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            result &&
            categoryContent && (
              <>
                <div className={styles.result}>
                  <div
                    className={styles.result_badge}
                    style={{ background: `${tierColor}22`, color: tierColor ?? undefined }}
                  >
                    {result.category}
                  </div>
                  <p className={styles.result_title}>
                    {tt("result_title", { tier: result.category })}
                  </p>
                  <span
                    className={styles.result_category_tag}
                    style={{ background: `${tierColor}1a`, color: tierColor ?? undefined }}
                  >
                    {categoryContent.name}
                  </span>
                </div>

                <div className={styles.result_story}>
                  <p className={styles.result_tagline} style={{ color: tierColor ?? undefined }}>
                    {categoryContent.tagline}
                  </p>
                  <p className={styles.result_desc}>{categoryContent.desc}</p>
                  <div className={styles.result_note} style={{ borderColor: tierColor ?? undefined }}>
                    <p>{categoryContent.note}</p>
                  </div>
                </div>

                <button type="button" className={styles.restart_btn} onClick={restart}>
                  {tt("restart_btn")}
                </button>
              </>
            )
          )}
        </div>

        {isQuestion ? (
          <div className={styles.footer}>
            {step > STEP_Q1 && (
              <button type="button" className={styles.back_btn} onClick={goBack}>
                {tt("btn_back")}
              </button>
            )}
            <button
              type="button"
              className={styles.next_btn}
              disabled={!isStepAnswered()}
              onClick={goNext}
            >
              {tt("btn_next")}
            </button>
          </div>
        ) : (
          <div className={styles.cta_footer}>
            <p className={styles.footnote}>
              Esta calculadora te da una recomendación general basada en
              buenas prácticas de planeación de invitados — no sustituye tu
              criterio ni el de tu pareja. Ajusta la prioridad según tu caso
              particular.
            </p>

            <div className={styles.cta}>
              <p className={styles.cta_text}>Tu evento bajo control</p>
              <a
                href="https://iattend.mx"
                target="_blank"
                rel="noreferrer"
                className={styles.cta_btn}
              >
                Descubre cómo funciona
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
