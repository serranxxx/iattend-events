"use client";

import { SideEvent } from "@/types/side_event";
import React, { useEffect, useRef, useState } from "react";
import styles from "./quick-events.module.css";
import Image from "next/image";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/es";
import { Button, Input, message, Tooltip } from "antd";
import { LuCircleCheck, LuCircleX, } from "react-icons/lu";
import { simpleaddress } from "../Invitation/Itinerary/OpenCard/OpenCard";
import WeatherWidget from "../Invitation/Itinerary/WeatherApi/WeatherWidget";
import { FooterLand } from "../LandPage/Footer/Footer";
import { color } from "motion";
import { FaLock } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import { ParticipansType, QuickEventGuest, QuickEventUser, } from "@/types/guests";
import { darker, generateSimpleId } from "@/helpers/functions";
import { ConfirmCard } from "../ConfirmCard/ConfirmCard";
import { profilesMap } from "../ConfirmCard/profiles";
import { ChevronDown, ChevronUp, CircleCheck, MapPin } from "lucide-react";

type invProps = {
  info: SideEvent | null;
  password?: string;
  preview?: boolean
};

export default function QuickEvents({ info, preview }: invProps) {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.locale("es");

  const containerRef = useRef<HTMLDivElement>(null);

  const SIZES = [80, 60, 100, 65, 85, 55, 75, 90, 62];

  const [validated, setValidated] = useState<boolean>(false);
  const [guestCode, setGuestCode] = useState<string>("");
  const supabase = createClient();
  const [messageApi, contextHolder] = message.useMessage();

  const [user, setUser] = useState<QuickEventUser>({
    name: "",
    phone_number: "",
    type: null,
    profile: 0,
    emoji: "A",
    id: null
  })

  const [event, setEvent] = useState<QuickEventGuest>({
    id: null,
    quick_event_id: null,
    quick_event_user_id: "",
    password: "",
    state: "",
    last_action: "",
    anonymous: false
  });
  const [guestInfo, setGuestInfo] = useState<QuickEventGuest | null>(null);
  const [openModal, setOpenModal] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [participants, setParticipants] = useState<ParticipansType[] | null>(null)
  const [visibleParticipants, setVisibleParticipants] = useState<ParticipansType[]>([]);
  const [seAll, setSeAll] = useState(false)
  const [closing, setClosing] = useState(false);

  const participantIdsRef = useRef<Set<string | null>>(new Set());

  // Actualiza el ref cada vez que participants cambie


  interface CSSVars extends React.CSSProperties {
    ["--hover-color"]?: string;
  }

  const btnStyle: CSSVars = {
    ["--hover-color"]: `${color}`,
    height: "56px",
    width: "280px",
    fontSize: "18px",
    fontWeight: 600,
    letterSpacing: "2px",
    boxShadow: "0px 0px 12px rgba(0,0,0,0.2)",
    fontFamily: 'Poppins',
  };

  function overlaps(x: number, y: number, r: number, placed: { x: number, y: number, r: number }[]) {
    return placed.some(p => Math.hypot(x - p.x, y - p.y) < r + p.r + 12);
  }

  const formatDateMexico = (isoString: string | null | undefined): string => {
    if (!isoString) return "";

    return dayjs.utc(isoString).tz("America/Mexico_City").format("ddd D [de] MMMM, HH:mm");
  };

  const renderTextWithStrong = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const onValidateUser = async (code: string) => {

    try {
      const { data, error } = await supabase
        .from("side_events_guests")
        .select("*")
        .eq("password", code)
        .eq("side_events_id", info?.id)
        .maybeSingle();

      if (error) {
        console.log(error, 'not found')
        return
      }

      if (!data) {
        messageApi.error(`Código incorrecto`);
        return
      }

      setValidated(true);
      setGuestInfo(data)


    } catch (error) {

    }
  };


  const confirmAssitance = async (user: QuickEventUser, isAnonymous: boolean) => {
    console.log('Euuuuuuu')
    try {
      const newguest = {
        quick_event_id: info?.id,
        quick_event_user_id: isAnonymous ? process.env.NEXT_PUBLIC_ANONYMOUS_ID : user.id,
        password: generateSimpleId(),
        state: 'confirmado',
        last_action: 'creado',
        anonymous: isAnonymous
      };

      const { data, error } = await supabase
        .from("quick_events_guests")
        .insert([newguest])
        .select()
        .maybeSingle();

      if (error) {
        console.log(error, "error inserting guest");
        messageApi.error("No se pudo agregar el invitado");
        return;
      }

      if (!data) {
        messageApi.error("No se pudo crear el invitado");
        return;
      }

      localStorage.setItem(`quick_event_${info?.id}`, JSON.stringify({
        quick_event_id: data.id,
        guest_id: data.quick_event_user_id,
        anonymous: data.anonymous
      }));

      messageApi.success("Asistencia confirmada");
      setEvent((prev) => (data))
      if (isAnonymous) {
        getUser(process.env.NEXT_PUBLIC_ANONYMOUS_ID ?? "")
      }
      else {
        setUser(user)
      }

    } catch (error) {
      console.log(error);
      messageApi.error("Error inesperado al agregar invitado");
    }

  };

  const insertUSer = async (g: QuickEventUser) => {
    try {
      const newguest = {
        phone_number: `+52${g.phone_number}`,
        name: g.name,
        type: g.type,
        profile: g.profile,
        emoji: g.emoji
      };

      const { data, error } = await supabase
        .from("quick_events_users")
        .insert([newguest])
        .select()
        .maybeSingle();

      if (error) {
        console.log(error, "error inserting guest");
        messageApi.error("No se pudo agregar el invitado");
        return;
      }

      if (!data) {
        messageApi.error("No se pudo crear el invitado");
        return;
      }

      localStorage.setItem("quick_event_user_id", data.id);
      setUser(data);
      confirmAssitance(data, false)
      messageApi.success("Invitado agregado correctamente");

    } catch (error) {
      console.log(error);
      messageApi.error("Error inesperado al agregar invitado");
    }
  };

  const findEvent = async (id: string) => {

    try {
      const { data, error } = await supabase
        .from("quick_events_guests")
        .select("*")
        .eq("id", id)
        .eq("quick_event_id", info?.id)
        .maybeSingle()

      if (error) {
        console.log(error)
        return
      }

      setEvent(data)

      const raw = localStorage.getItem(`quick_event_${info?.id}`);

      if (!raw) {
        localStorage.setItem(`quick_event_${info?.id}`, JSON.stringify({
          quick_event_id: data.id,
          guest_id: data.quick_event_user_id,
          anonymous: data.anonymous
        }));
      }

    } catch (error) {
      console.log(error)
    }
  }

  const getUser = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("quick_events_users")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (error) {
        console.log(error)
        return
      }

      setUser(data)

    } catch (error) {

    }
  }

  const updateAnonymous = async (anon: boolean) => {
    try {
      const { data, error } = await supabase
        .from("quick_events_guests")
        .update({
          anonymous: anon,
        })
        .eq("id", event?.id)
        .select()
        .maybeSingle();

      if (error) {
        console.log(error, "error updating user");
        return;
      }

      if (!data) {
        return;
      }

      localStorage.setItem(`quick_event_${info?.id}`, JSON.stringify({
        quick_event_id: data.id,
        guest_id: data.quick_event_user_id,
        anonymous: data.anonymous
      }));

      messageApi.success('Privacidad editada')
      setEvent(data)



    } catch (error) {
      console.log(error);
    }
  };

  const insertUserAndUpgradeGuest = async (g: QuickEventUser) => {

    console.log('Eoooooo')
    try {
      const newUser = {
        phone_number: `+52${g.phone_number}`,
        name: g.name,
        type: g.type,
        profile: g.profile,
        emoji: g.emoji
      };

      const { data: userData, error: userError } = await supabase
        .from("quick_events_users")
        .insert([newUser])
        .select()
        .maybeSingle();

      if (userError || !userData) {
        console.log(userError, "error inserting user");
        messageApi.error("No se pudo crear el usuario");
        return;
      }

      localStorage.setItem("quick_event_user_id", userData.id);
      setUser(userData);
      console.log('user creado: ', userData)

      console.log('event: ', event)

      const { data: newEvent, error: guestError } = await supabase
        .from("quick_events_guests")
        .update({
          quick_event_user_id: userData.id,
          anonymous: false
        })
        .eq("id", event.id)
        .select()
        .maybeSingle()

      if (guestError) {
        console.log(guestError, "error upgrading guest");
        messageApi.error("No se pudo actualizar la confirmación");
        return;
      }

      console.log('evente updated: ', newEvent)

      localStorage.setItem(`quick_event_${info?.id}`, JSON.stringify({
        quick_event_id: newEvent.id,
        guest_id: userData.id,
        anonymous: false
      }));

      messageApi.success("¡Perfil creado y asistencia confirmada!");

    } catch (error) {
      console.log(error);
      messageApi.error("Error inesperado");
    }
  };

  const getParticipants = async () => {
    const { data, error } = await supabase.rpc("get_quick_event_users_by_event", {
      p_quick_event_id: info?.id,
    });

    if (error) return

    console.log('participants: ', data)
    setParticipants(data)
  }

  const handleToggle = () => {
    if (seAll) {
      // Animar salida primero
      setClosing(true);
      const items = containerRef.current?.querySelectorAll<HTMLElement>('[data-bubble]');
      if (items) {
        Array.from(items).reverse().forEach((el, i) => {
          setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'scale(0.6)';
          }, i * 40);
        });
      }
      // Después de la animación, cerrar
      setTimeout(() => {
        setSeAll(false);
        setClosing(false);
        setVisibleParticipants([]);
      }, (items?.length ?? 0) * 40 + 300);
    } else {
      setSeAll(true);
    }
  };



  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;

      // ajusta estos valores a tu gusto
      const scale = Math.min(1 + scrollY / 1000, 1.8);
      document.documentElement.style.setProperty("--bg-scale", scale.toString());
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {

    if (info?.type === 'open' || preview) {
      setValidated(true)
    }

    const raw = localStorage.getItem(`quick_event_${info?.id}`);
    const eventData = raw ? JSON.parse(raw) : null;

    if (eventData) {
      getUser(eventData.guest_id)
      findEvent(eventData.quick_event_id)
      setAnonymous(eventData.anonymous)
    }

    else {
      const userID = localStorage.getItem(`quick_event_user_id`);
      if (userID) {
        getUser(userID)
      }
    }


    getParticipants()




  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !visibleParticipants.length) return;

    // Solo posiciona el último elemento agregado, no recalcula todos
    const items = container.querySelectorAll<HTMLElement>('[data-bubble]');
    const lastEl = items[items.length - 1];
    if (!lastEl) return;

    const i = items.length - 1;
    const r = SIZES[i % SIZES.length] / 2;
    const W = container.clientWidth;

    // Reconstruye placed desde los elementos ya posicionados
    const placed = Array.from(items).slice(0, -1).map((el) => ({
      x: parseFloat(el.style.left) + parseFloat(el.style.width) / 2,
      y: parseFloat(el.style.top) + parseFloat(el.style.height) / 2,
      r: parseFloat(el.style.width) / 2,
    }));

    lastEl.style.width = `${r * 2}px`;
    lastEl.style.height = `${r * 2}px`;
    lastEl.style.fontSize = `${r * 1}px`;
    lastEl.style.transition = 'all 0.3s ease';

    let bestX = r, bestY = r, found = false;

    for (let testY = r; testY < 4000; testY += 6) {
      for (let testX = r; testX <= W - r; testX += 6) {
        if (!overlaps(testX, testY, r, placed)) {
          bestX = testX + (Math.random() - 0.5) * 10;
          bestY = testY + (Math.random() - 0.5) * 10;
          bestX = Math.max(r + 2, Math.min(W - r - 2, bestX));
          bestY = Math.max(r + 2, bestY);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    lastEl.style.left = `${bestX - r}px`;
    lastEl.style.top = `${bestY - r}px`;

    // Animación de entrada
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lastEl.style.opacity = '1';
        lastEl.style.transform = 'scale(1)';
      });
    });



  }, [visibleParticipants]);


  useEffect(() => {
    if (!seAll || !participants?.length) return;

    setVisibleParticipants([]); // reset al abrir

    participants.forEach((p, i) => {
      setTimeout(() => {
        setVisibleParticipants(prev => [...prev, p]);
      }, i * 80); // 80ms entre cada uno, ajusta a tu gusto
    });

  }, [seAll]);

  useEffect(() => {
    participantIdsRef.current = new Set(participants?.map(p => p.id));
  }, [participants]);


  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`upload_dynamic_participants`)

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quick_events_guests'
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as QuickEventGuest | null;
          if (!row) return;

          if (row.quick_event_id === info?.id) {
            getParticipants()
          }
        }
      )

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quick_events_users' },
        (payload) => {
          const row = (payload.new ?? payload.old) as QuickEventUser | null;
          if (!row) return;

          if (participantIdsRef.current.has(row.id)) {
            getParticipants();
          }
        }
      )
      .subscribe((status) => {
        console.log('sub status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);



  return (
    <>
      {contextHolder}
      <div className={styles.side_event_main_cont}>
        <div className={styles.hero}>
          {info?.body.image && <Image className={styles.hero_bg} fill src={info?.body.image} alt="" style={{ objectFit: "cover" }} />}
          <div className={styles.blur_cover}></div>
          <div className={styles.shadow}></div>
        </div>

        {
          validated &&

          <div
            className={styles.info_cont}
            style={
              {
                "--blur-color": `${info?.body.color ?? "#000000"}`,
                "--blur-color--dark": `${darker(info?.body.color!, 0.8) ?? "#000000"}80`,
                "--blur-color--darker": `${darker(info?.body.color!, 0.2) ?? "#000000"}80`,
              } as React.CSSProperties
            }
          >
            <span
              style={{
                fontFamily: info?.body.title.font,
                fontWeight: info?.body.title.weight,
                fontSize: `${info?.body.title.size}px`,
                lineHeight: info?.body.title.line_height,
                opacity: info?.body.title.opacity,
                textAlign: "center",
                color: "#FFF",
                textShadow: "0px 0px 18px rgba(0, 0, 0, 0.35)",
              }}
            >
              {info?.name}
            </span>

            <div
              className={styles.col}
              style={{
                fontFamily: 'Poppins',
                zIndex: 99,
              }}
            >
              <span>{formatDateMexico(info?.body.hour)}</span>
              <span>
                {info?.body.address.street} {info?.body.address.number},
              </span>
              <span>
                {info?.body.address.state} {info?.body.address.country}
              </span>
            </div>


            {
              event.state !== 'confirmado' &&
              <div style={{
              }} className={styles.buttons_cont}>
                <Button 
                icon={<CircleCheck size={16} />}
                onClick={() => setOpenModal(true)} style={{ height: '56px', textTransform:'uppercase', letterSpacing:'1px' }} type="text" className={styles.side_buttons}>
                  Confirmar asistencia
                </Button>
              </div>
            }




            {info?.body.extras && (
              <div className={styles.mapa_container} style={{ padding: "12px 18px" }}>
                <span
                  style={{
                    color: "#FFFFFF",
                    whiteSpace: "pre-line",
                    textAlign: "center",
                    fontFamily: "Poppins",
                    fontSize: "14px",
                    mixBlendMode: "soft-light",
                  }}
                >
                  {renderTextWithStrong(info.body.extras ?? "")}
                </span>
              </div>
            )}


            {info?.body.address.street &&
              info?.body.address.number &&
              info?.body.address.neighborhood &&
              info?.body.address.zipcode &&
              info?.body.address.city &&
              info?.body.address.state &&
              info?.body.address.country && (
                <div className={styles.mapa_container}>
                  <Button icon={<MapPin size={16} />} className={styles.get_there} type="text">
                    Cómo llegar
                  </Button>
                  <iframe
                    title="Mapa"
                    width="100%"
                    height="100%"
                    // style={{ borderColor: content.inverted ? primary : secondary }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={simpleaddress(
                      info?.body.address.street,
                      info?.body.address.number,
                      info?.body.address.neighborhood,
                      info?.body.address.zipcode,
                      info?.body.address.city,
                      info?.body.address.state,
                      info?.body.address.country
                    )}
                  />
                </div>
              )}





            <div className={styles.col_cont} style={{
              gap: seAll ? '16px' : '12px',
              height: seAll ? '550px' : (participants?.length ?? 0) > 0 ? '150px' : '50px'
            }}>
              <div className={styles.participants_row} >
                <span>{(participants?.length ?? 0) > 0 ?  `${participants?.length} Asistentes` : '¡Se el primero en confirmar!'} </span>
                {
                  (participants?.length ?? 0) > 0 &&
                  <Button icon={seAll || closing ? <ChevronUp size={16} /> : <ChevronDown size={16}/>} className={styles.participants_toggle} type="text" onClick={handleToggle}>
                    {seAll || closing ? 'Ver menos' : 'Ver más'}
                  </Button>
                }

              </div>

              {
                !seAll ?
                  <>
                    <div className={styles.paticipants_cont}>
                      {
                        participants?.slice(0, 8).map((p, index) => (
                          <Tooltip key={index} title={p.anonymous ? 'Anónimo' : p.name} color={profilesMap[p.profile].background}>
                            <div className={styles.participant_item} style={{
                              background: profilesMap[p.profile].light
                            }}>
                              {p.anonymous ? '🥷' : p.emoji}
                            </div>
                          </Tooltip>
                        ))
                      }
                    </div>

                    <div className={styles.paticipants_cont} style={{ gap: '6px' }}>
                      {(() => {
                        const MAX_CHARS = 40;
                        let total = 0;
                        const visible: QuickEventUser[] = [];

                        for (const p of (participants ?? [])) {
                          if (p.anonymous || p.name === 'Anónimo') continue;
                          if (total + p.name.length > MAX_CHARS) break;
                          visible.push(p);
                          total += p.name.length + 2; // +2 por ", "
                        }

                        return (
                          <>
                            {visible.map((p, index) => (
                              <span style={{ fontSize: '12px', opacity: '0.5' }} key={index}>
                                {p.name}{index < visible.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                            {(participants?.filter(p => !p.anonymous && p.name !== 'Anónimo').length ?? 0) > visible.length && (
                              <span style={{ fontSize: '12px', opacity: '0.5' }}>...</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </>
                  :
                  <div
                    ref={containerRef} className={`${styles.paticipants_cont_open} scroll-invitation`} >
                    {visibleParticipants?.map((p, index) => (
                      <Tooltip key={index} title={p.anonymous ? 'Anónimo' : p.name} color={profilesMap[p.profile].background}>
                        <div data-bubble key={index} className={styles.participant_item_open} style={{ background: profilesMap[p.profile].background }}>
                          <span>{p.anonymous ? '🥷' : p.emoji}</span>
                        </div>
                      </Tooltip>
                    ))}


                  </div>

              }
            </div>

            {
              info?.body.address.city &&
              <WeatherWidget item={info?.body} isSide={true} color={`${darker(info?.body.color!, 0.8) ?? "#000000"}80`} />
            }
          </div>
        }
        <div
          className={styles.inv_locked_blured}
          style={{ pointerEvents: validated ? "none" : undefined, opacity: validated ? "0" : "1", backgroundColor: `${color}20` }}
        >
          <div className={styles.locked_icon}>
            <FaLock size={32} style={{ color: "#FFF" }} />
          </div>
          <span style={{ fontFamily: 'Poppins' }} className={styles.locked_title}>
            Invitación Privada
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span style={{ fontFamily: 'Poppins' }} className={styles.locked_text}>
              Nos alegra mucho que seas parte de este evento tan especial.
            </span>
            <span style={{ fontFamily: 'Poppins' }} className={styles.locked_text}>
              Esta invitación es exclusiva para ti. Ingresa tu código de invitado para continuar y disfrutar de esta experiencia única.
            </span>
          </div>
          <Input
            value={guestCode}
            // length={6}
            size="large"
            onChange={(e) => setGuestCode(e.target.value)}
            placeholder="Código de invitado"
            className={styles.locked_input}
            style={{
              backgroundColor: "#FFFFFF20",
              boxShadow: "0px 0px 12px rgba(0,0,0,0.2)",
              borderWidth: "2px",
              color: "#FFF",
              fontSize: "18px",
              textAlign: "center",
              maxWidth: "280px",
              borderRadius: "99px",
              minHeight: "56px",
              fontFamily: 'Poppins',
            }}
          />

          <Button className={styles.locked_btn} style={btnStyle} onClick={() => onValidateUser(guestCode)}>
            ACCEDER
          </Button>
        </div>

        <div className={styles.card_port_view}>
          <div className={styles.port_view}>
            <div className={styles.confirm_card}>
              <ConfirmCard
                getUser={getUser}
                setUser={setUser} setEvent={setEvent}
                setOpenModal={setOpenModal} openModal={openModal}
                confirmAssitance={confirmAssitance} insertUSer={insertUSer}
                updateAnonymous={updateAnonymous} insertUserAndUpgradeGuest={insertUserAndUpgradeGuest}
                event={event} user={user} />
            </div>
          </div>
        </div>



      </div>
      {
        validated &&
        <FooterLand color={info?.body.color}></FooterLand>
      }
    </>
  );
}
