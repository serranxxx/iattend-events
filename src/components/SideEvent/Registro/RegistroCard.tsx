"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, Lock, AlertCircle } from "lucide-react";
import { AvatarAsistente } from "../Asistentes/Asistentes";
import { inicialesDe } from "../Asistentes/datosAsistentes";
import CampoRegistro from "./CampoRegistro";
import {
  chipResumen, errorDe, formVisible, lineaResumen, prellenado,
  type FormRegistro, type Miembro, type Respuestas,
} from "./datosRegistro";
import styles from "./registro.module.css";

/*
  Tarjeta "Registro" de un Flash (handoff "Pop Event — Registro de asistentes,
  paso a paso", opción 2a). Una pregunta por pantalla con barra por bloques;
  con "Por persona" el titular registra también a sus acompañantes (puede
  copiarles la dirección o dejarles un link para que lo hagan después).
  Todo pasa por el backend (iattend--backend router/sideEventForm.js) con el
  código del invitado o el token del link. Solo la ven los confirmados.
  En la vista previa del organizador ("Ver en vivo") se recorre con un
  ejemplo y no se guarda nada.
*/

const API = process.env.NEXT_PUBLIC_IATTEND_API_URL;
type Fase = "cargando" | "intro" | "q" | "between" | "done";

const MIEMBRO_EJEMPLO: Miembro = { id: "ejemplo", nombre: "Tú", nombreCompleto: "", emoji: "🎉", perfil: 1, telefono: null, estado: "sin", folio: null, token: null };

const unir = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}` : n[0] ?? "");

type Props = {
  form: FormRegistro;
  eventoId: number | string;
  codigo?: string | null;
  token?: string | null;
  preview?: boolean;
};

export default function RegistroCard({ form: formCompleto, eventoId, codigo, token, preview }: Props) {
  const form = useMemo(() => formVisible(formCompleto), [formCompleto]);
  const borradorKey = `iattend_registro_${eventoId}_${token ?? codigo ?? "preview"}`;
  const [fase, setFase] = useState<Fase>("cargando");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [member, setMember] = useState(0);
  // Pantalla entre personas: quién sigue (el siguiente que falte).
  const [proximo, setProximo] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [copiar, setCopiar] = useState(true);
  const [answers, setAnswers] = useState<Respuestas[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [hayBorrador, setHayBorrador] = useState(false);
  const [anim, setAnim] = useState({ x: 0, op: 1, tr: true });
  const [copiado, setCopiado] = useState<{ id: string; texto: string } | null>(null);

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["x-token-registro"] = token;
    else if (codigo) h["x-codigo-invitado"] = codigo;
    return h;
  }, [token, codigo]);

  // Carga: quiénes se registran y qué ya está hecho.
  const cargar = useCallback(async () => {
    if (preview) {
      setMiembros([MIEMBRO_EJEMPLO]);
      setAnswers([{}]);
      setFase("intro");
      return;
    }
    try {
      const res = await fetch(`${API}/side-events/${eventoId}/registro`, { headers, cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) { setFase("intro"); setMiembros([]); return; }
      const ms: Miembro[] = data.miembros;
      const base = ms.map((m) => ({ ...prellenado(form, m), ...(data.respuestas?.[m.id] ?? {}) }));
      setMiembros(ms);
      // Borrador para retomar.
      let inicial = base;
      try {
        const raw = localStorage.getItem(borradorKey);
        if (raw) {
          const d = JSON.parse(raw);
          if (Array.isArray(d.answers) && d.answers.length === ms.length) {
            inicial = d.answers.map((a: Respuestas, i: number) => ({ ...base[i], ...a }));
            setHayBorrador(true);
          }
        }
      } catch { /* borrador dañado: se ignora */ }
      setAnswers(inicial);
      const primero = ms.findIndex((m) => m.estado === "sin");
      // El titular ya quedó y falta alguien: se retoma en "ahora sigue…" (copiar dirección / link después).
      if (primero > 0 && ms[0].estado === "completo") {
        setMember(Math.max(0, ms.findLastIndex((m, i) => i < primero && m.estado === "completo")));
        setProximo(primero);
        setFase("between");
        return;
      }
      setMember(primero < 0 ? 0 : primero);
      setFase(ms.length && primero < 0 && ms[0].estado === "completo" ? "done" : "intro");
    } catch {
      setFase("intro");
    }
  }, [preview, eventoId, headers, form, borradorKey]);

  useEffect(() => { cargar(); }, [cargar]);

  const flat = useMemo(() => form.sections.flatMap((s, si) => s.fields.map((f) => ({ f, si }))), [form]);
  const steps = (m: number) => flat.filter((o) => !(m > 0 && copiar && form.allowCopyAddress !== false && o.f.address));
  const st = steps(member);
  const cur = st[Math.min(step, Math.max(0, st.length - 1))];

  // Borrador en cada paso.
  useEffect(() => {
    if (fase === "q" && !preview) localStorage.setItem(borradorKey, JSON.stringify({ answers, member, step, copiar }));
  }, [answers, member, step, copiar, fase, preview, borradorKey]);

  const ir = (dir: 1 | -1, cambio: () => void) => {
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAnim({ x: reducir ? 0 : -24 * dir, op: 0, tr: true });
    window.setTimeout(() => {
      cambio();
      setErrores({});
      setErrorServidor(null);
      setAnim({ x: reducir ? 0 : 24 * dir, op: 0, tr: false });
      requestAnimationFrame(() => requestAnimationFrame(() => setAnim({ x: 0, op: 1, tr: true })));
    }, 170);
  };

  const conDireccion = (a: Respuestas[]) => a.map((x, i) => (i > 0 && copiar && form.allowCopyAddress !== false
    ? { ...x, ...Object.fromEntries(flat.filter((o) => o.f.address).map((o) => [o.f.id, a[0]?.[o.f.id]])) }
    : x));

  const setValor = (v: unknown) => {
    if (!cur) return;
    setAnswers((a) => a.map((x, i) => (i === member ? { ...x, [cur.f.id]: v } : x)));
    setErrores((e) => { const n = { ...e }; delete n[cur.f.id]; return n; });
  };

  // Siguiente: el paso que sigue o, al final de la persona, su envío.
  const siguiente = async () => {
    if (!cur || enviando) return;
    const e = errorDe(cur.f, answers[member]?.[cur.f.id]);
    if (e) { setErrores({ [cur.f.id]: e }); return; }
    if (step < st.length - 1) { ir(1, () => setStep((s) => s + 1)); return; }
    const completas = conDireccion(answers);
    let folio = "PREVIA";
    if (!preview) {
      setEnviando(true);
      try {
        const res = await fetch(`${API}/side-events/${eventoId}/registro/${miembros[member].id}`, {
          method: "POST", headers, body: JSON.stringify({ answers: completas[member] }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          const primero = data?.errores ? Object.values(data.errores)[0] : null;
          setErrorServidor(String(primero || data?.msg || "No se pudo enviar"));
          return;
        }
        folio = data.folio;
      } catch {
        setErrorServidor("No se pudo enviar. Revisa tu conexión.");
        return;
      } finally {
        setEnviando(false);
      }
    }
    setAnswers(completas);
    setMiembros((ms) => ms.map((m, i) => (i === member ? { ...m, estado: "completo", folio } : m)));
    const resto = miembros.findIndex((m, i) => i > member && m.estado !== "completo" && m.estado !== "pendiente");
    if (resto >= 0) ir(1, () => { setProximo(resto); setFase("between"); });
    else { localStorage.removeItem(borradorKey); ir(1, () => setFase("done")); }
  };

  const atras = () => {
    if (step > 0) { ir(-1, () => setStep((s) => s - 1)); return; }
    // Desde el primer paso de un acompañante: de vuelta a la pantalla entre personas.
    if (member > 0) { ir(-1, () => { setProximo(member); setMember(Math.max(0, miembros.findLastIndex((m, i) => i < member && m.estado === "completo"))); setFase("between"); }); return; }
    ir(-1, () => setFase("intro"));
  };
  const omitir = () => {
    if (!cur) return;
    setValor(cur.f.type === "multi" ? [] : undefined);
    if (step < st.length - 1) ir(1, () => setStep((s) => s + 1));
    else siguiente();
  };
  const registrar = (m: number) => ir(1, () => { setAnswers(conDireccion); setMember(m); setStep(0); setFase("q"); });

  // "Se registra después": queda pendiente con su link; se sigue con el resto.
  const despues = async () => {
    if (proximo === null) return;
    const m = proximo;
    let tk: string | null = "ejemplo";
    if (!preview) {
      try {
        const res = await fetch(`${API}/side-events/${eventoId}/registro/${miembros[m].id}/despues`, { method: "POST", headers });
        const data = await res.json();
        if (!res.ok || !data.ok) { setErrorServidor(data?.msg || "No se pudo crear el link"); return; }
        tk = data.token;
      } catch {
        setErrorServidor("No se pudo crear el link. Revisa tu conexión.");
        return;
      }
    }
    setMiembros((ms) => ms.map((x, i) => (i === m ? { ...x, estado: "pendiente", token: tk } : x)));
    const resto = miembros.findIndex((x, i) => i > m && x.estado !== "completo" && x.estado !== "pendiente");
    if (resto >= 0) ir(1, () => setProximo(resto));
    else { localStorage.removeItem(borradorKey); ir(1, () => setFase("done")); }
  };

  const copiarLink = async (m: Miembro) => {
    if (!m.token) return;
    const url = `${window.location.origin}/side-event/${eventoId}?registro=${m.token}`;
    try {
      const compartir = Boolean(navigator.share);
      if (compartir) await navigator.share({ title: form.title, text: `${m.nombre}, registra tus datos aquí:`, url });
      else await navigator.clipboard.writeText(url);
      setCopiado({ id: m.id, texto: compartir ? "¡Listo!" : "¡Copiado!" });
      window.setTimeout(() => setCopiado(null), 2000);
    } catch { /* cancelado */ }
  };

  const hostIniciales = form.hostInitials || (form.hostLabel ? inicialesDe(form.hostLabel) : "") || "✓";
  const asAvatar = (m: Miembro) => ({ id: m.id, nombre: m.nombre, iniciales: inicialesDe(m.nombreCompleto || m.nombre), emoji: m.emoji, perfil: m.perfil });
  const porHacer = miembros.filter((m) => m.estado !== "completo");
  const ultimoDeLaPersona = step === st.length - 1;
  const quedanOtros = miembros.some((m, i) => i > member && m.estado !== "completo" && m.estado !== "pendiente");
  const etiquetaSiguiente = !ultimoDeLaPersona ? "Siguiente" : quedanOtros ? "Terminar" : "Enviar registro";
  const barras = form.sections.map((_, si) => {
    const enSeccion = st.filter((o) => o.si === si).length;
    const hechas = st.slice(0, step).filter((o) => o.si === si).length;
    return enSeccion ? (hechas / enSeccion) * 100 : 100;
  });
  const siguienteMiembro = proximo !== null ? miembros[proximo] : undefined;
  const dir0 = answers[0] ?? {};
  const animStyle = { transform: `translateX(${anim.x}px)`, opacity: anim.op, transition: anim.tr ? undefined : "none" } as React.CSSProperties;

  const encabezado = (
    <div className={styles.header}>
      <span className={styles.host_av}>{hostIniciales}</span>
      <span className={styles.header_col}>
        <span className={styles.title}>{form.title}</span>
        {form.hostLabel && <span className={styles.sub}>{form.hostLabel}</span>}
      </span>
    </div>
  );

  if (fase === "cargando") return <div className={styles.card}>{encabezado}<div className={styles.cargando}>Cargando…</div></div>;
  if (!miembros.length) return null;

  return (
    <div className={styles.card}>
      {encabezado}

      {fase === "intro" && (
        <>
          <p className={styles.intro}>{form.intro}</p>
          <div className={styles.intro_chips}>{form.sections.map((s) => <span key={s.title}>{s.title}</span>)}</div>
          <div className={styles.who}>
            <span className={styles.who_stack}>
              {porHacer.map((m) => <span key={m.id}><AvatarAsistente a={asAvatar(m)} size={24} /></span>)}
            </span>
            <span>{preview ? "Así se registrarán tus invitados" : <>Vas a registrar a <b>{unir(porHacer.map((m) => m.nombre))}</b></>}</span>
          </div>
          <button type="button" className={styles.primary_lg} onClick={() => ir(1, () => { setStep(0); setFase("q"); })}>
            {hayBorrador ? "Continuar registro" : "Empezar registro"}
          </button>
          <div className={styles.privacy}>
            <Lock size={13} />
            <span>Solo lo ve el equipo organizador{form.privacyUrl ? " ·" : ""}</span>
            {form.privacyUrl && <a href={form.privacyUrl} target="_blank" rel="noreferrer">Aviso de privacidad</a>}
          </div>
        </>
      )}

      {fase === "q" && cur && (
        <>
          <div className={styles.top_row}>
            <span className={styles.member_pill}>
              <span><AvatarAsistente a={asAvatar(miembros[member])} size={22} /></span>
              Registrando a {miembros[member].nombre}
            </span>
            <span className={styles.step_label}>{step + 1} de {st.length}</span>
          </div>
          <div className={styles.bars}>{barras.map((w, i) => <span key={i}><span style={{ width: `${w}%` }} /></span>)}</div>
          <div className={styles.anim} style={animStyle}>
            <span className={styles.section_label}>{form.sections[cur.si].title}</span>
            <CampoRegistro
              key={`${member}-${cur.f.id}`}
              field={cur.f}
              value={answers[member]?.[cur.f.id]}
              error={errores[cur.f.id]}
              onChange={setValor}
              onEnter={siguiente}
              privacyUrl={form.privacyUrl}
            />
          </div>
          {errorServidor && (
            <span className={styles.server_error}><AlertCircle size={14} />{errorServidor}<button type="button" onClick={siguiente}>Reintentar</button></span>
          )}
          <div className={styles.nav}>
            <button type="button" className={styles.back} onClick={atras} aria-label="Atrás"><ArrowLeft size={18} strokeWidth={2.2} /></button>
            <span style={{ flex: 1 }} />
            {!cur.f.required && <button type="button" className={styles.skip} onClick={omitir}>Omitir</button>}
            <button type="button" className={styles.primary} onClick={siguiente} disabled={enviando}>{enviando ? "Enviando…" : etiquetaSiguiente}</button>
          </div>
        </>
      )}

      {fase === "between" && siguienteMiembro && (
        <div className={styles.anim} style={animStyle}>
          <div className={styles.between_head}>
            <span className={styles.ok_circle}><Check size={18} strokeWidth={3} /></span>
            <span className={styles.header_col}>
              <span className={styles.between_title}>Listo, {miembros[member].nombre} ya tiene su registro</span>
              <span className={styles.between_sub}>Ahora sigue {siguienteMiembro.nombre}. Necesita su propio registro y autorización.</span>
            </span>
          </div>
          {form.allowCopyAddress !== false && flat.some((o) => o.f.address) && (
            <div role="checkbox" aria-checked={copiar} tabIndex={0} className={styles.check} onClick={() => setCopiar((c) => !c)}
              onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setCopiar((c) => !c); } }}>
              <span className={`${styles.box} ${copiar ? styles.box_on : ""}`}><Check size={14} strokeWidth={3.2} /></span>
              <span className={styles.check_col}>
                <span className={styles.check_label}>Usar la misma dirección de {miembros[0].nombre}</span>
                <span className={styles.check_help}>{lineaResumen(form, dir0)}</span>
              </span>
            </div>
          )}
          {errorServidor && <span className={styles.server_error}><AlertCircle size={14} />{errorServidor}</span>}
          <button type="button" className={styles.primary_lg} onClick={() => registrar(proximo!)}>Registrar a {siguienteMiembro.nombre}</button>
          {form.allowLater !== false && (
            <button type="button" className={styles.later} onClick={despues}>{siguienteMiembro.nombre} se registra después con su propio link</button>
          )}
        </div>
      )}

      {fase === "done" && (
        <>
          <div className={styles.success}>
            <span className={styles.ok_sm}><Check size={16} strokeWidth={3} /></span>
            <span><b>Registro enviado.</b> {preview ? "En la vista previa no se guarda nada." : "Guarda tu folio."}</span>
          </div>
          <div className={styles.summary}>
            {miembros.map((m, i) => {
              const a = answers[i] ?? {};
              const pendiente = m.estado === "pendiente";
              const nombreCompleto = String(a.nombre ?? "") || m.nombreCompleto || m.nombre;
              const chip = pendiente ? null : chipResumen(form, a);
              return (
                <div key={m.id} className={styles.sum_row}>
                  <span className={styles.sum_av}><AvatarAsistente a={asAvatar(m)} size={36} /></span>
                  <span className={styles.sum_col}>
                    <span className={styles.sum_name}>{pendiente ? m.nombre : nombreCompleto}</span>
                    <span className={styles.sum_line}>{pendiente ? "Registro pendiente · mándale su link" : lineaResumen(form, a)}</span>
                    {chip && <span className={styles.sum_chip}>{chip}</span>}
                  </span>
                  {pendiente ? (
                    m.token && m.token !== "ejemplo"
                      ? <button type="button" className={styles.copiar_link} onClick={() => copiarLink(m)}>{copiado?.id === m.id ? copiado.texto : "Mandar link"}</button>
                      : <Clock size={16} className={styles.sum_clock} />
                  ) : m.estado === "completo" ? <span className={styles.folio}>{m.folio}</span> : null}
                </div>
              );
            })}
          </div>
          {preview && <span className={styles.preview_nota}>Vista previa: así lo verán tus invitados confirmados.</span>}
        </>
      )}
    </div>
  );
}
