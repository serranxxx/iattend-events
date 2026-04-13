import React, { useEffect, useRef, useState } from 'react'
import styles from './confirmcard.module.css'
import { Button, Input, Select, Space } from 'antd'
import { LuArrowLeft, LuCheck, LuPalette, LuType, LuX } from 'react-icons/lu'
import { profiles, profilesMap } from './profiles'
import { QuickEventGuest, QuickEventUser, SideGuestSubabasePayload } from '@/types/guests'
import { BackgroundGaffette } from './BackgroundGaffette'
import { createClient } from '@/lib/supabase/client'
import { HatGlasses, ScanFace, UserRoundPen } from 'lucide-react'

interface ConfirmCardProps {
    setOpenModal: React.Dispatch<React.SetStateAction<boolean>>
    openModal: boolean
    confirmAssitance: (g: QuickEventUser, isAnonymous: boolean) => void;
    user: QuickEventUser
    insertUSer: (g: QuickEventUser) => void;
    event: QuickEventGuest | null
    getUser: (g: string) => void;
    setUser: React.Dispatch<React.SetStateAction<QuickEventUser>>
    setEvent: React.Dispatch<React.SetStateAction<QuickEventGuest>>
    updateAnonymous: (anon: boolean) => void;
    insertUserAndUpgradeGuest: (g: QuickEventUser) => void;
}

const CATEGORY_OPTIONS = [
    { label: 'Mujer', value: 'female' },
    { label: 'Hombre', value: 'male' },
    { label: 'Otro', value: 'undefined' },
]

const EMOJIS = ['😆', '🤪', '🥸', '😈', '🤡', '👽', '💩', '🤖', '🐵', '🐸', '🐹', '🐙', '😸', '👻', '🤠']

const HIDE_FULL_CARD = -1000
const HIDE_NOT_CONFIRMED = -485
const HIDE_CONFIRMED = -426

const ON_EDIT_HEIGHT = 610
const USER_NOT_CONFIRMED_HEIGHT = 520
const CONFIRMED_HEIGHT = 464
const NOT_USER_NOT_CONFIRMED_HEIGHT = 564

export const ConfirmCard: React.FC<ConfirmCardProps> = ({
    setOpenModal,
    openModal,
    confirmAssitance,
    user,
    insertUSer,
    event,
    setUser,
    getUser,
    updateAnonymous,
    setEvent,
    insertUserAndUpgradeGuest
}) => {

    const supabase = createClient();


    const sliderRef = useRef<HTMLDivElement | null>(null)

    const [onEdit, setOnEdit] = useState(false)
    const [onEditCont, setOnEditCont] = useState(false)
    const [flipped, setFlipped] = useState(false);
    const [displayCard, setDisplayCard] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [onBackground, setOnBackground] = useState(false)
    const [onEmoji, setOnEmoji] = useState(false)
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [onIssue, setOnIssue] = useState(false)
    const [onUpdate, setOnUpdate] = useState(false)
    const [customEmoji, setCustomEmoji] = useState<string>("")

    const [onBackToPublic, setOnBackToPublic] = useState(false)

    const [customData, setCustomData] = useState<{ profile: number, emoji: string }>({
        profile: 0,
        emoji: "A"
    })

    const totalSteps = 3

    const goToStep = (step: number, behavior: ScrollBehavior = 'smooth') => {
        const slider = sliderRef.current
        if (!slider) return

        const safeStep = Math.max(0, Math.min(step, totalSteps - 1))
        const slideWidth = slider.clientWidth

        slider.scrollTo({
            left: slideWidth * safeStep,
            behavior
        })

        setCurrentStep(safeStep)
    }

    const validateStep = (step: number) => {
        switch (step) {
            case 0:
                if (user.name && user.name !== "") {
                    return true
                }

            case 1:
                if (user.phone_number && user.phone_number !== "" && user.phone_number.length === 10) {
                    return true
                }

            case 2:
                if (user.type) {
                    return true
                }


            default:
                break;
        }
    }

    const nextStep = () => {
        if (validateStep(currentStep)) {

            if (currentStep < totalSteps - 1) {
                goToStep(currentStep + 1)
            }

            else {

                if (!isAnonymous) {
                    insertUSer(user)
                }

                else {
                    onBackToPublic ? insertUserAndUpgradeGuest(user) : confirmAssitance(user, true)

                }

            }

        } else
            setOnIssue(true)

    }

    const prevStep = () => {
        if (currentStep > 0) {
            goToStep(currentStep - 1)
        }
    }

    const saveChanges = () => {

        if (user.id) {
            updateProfile()
        }

        setUser((prev) => ({
            ...prev,
            emoji: customData.emoji,
            profile: customData.profile
        }))

        setOnEdit(false)
    }

    const updateProfile = async () => {
        try {
            const { data, error } = await supabase
                .from("quick_events_users")
                .update({
                    profile: customData.profile,
                    emoji: customData.emoji,
                })
                .eq("id", user?.id)
                .select()
                .maybeSingle();

            if (error) {
                console.log(error, "error updating user");
                return;
            }

            if (!data) {
                return;
            }

            setUser((prev) => ({
                ...prev,
                emoji: customData.emoji,
                profile: customData.profile
            }))

        } catch (error) {
            console.log(error);
        }
    };

    const handleReset = () => {

        setUser((prev) => ({
            ...prev,
            name: "",
            phone_number: "",
            type: null,
            emoji: EMOJIS[7],
            profile: profilesMap[0].id
        }))
        goToStep(0)
    }

    const handleCard = () => {
        if (user.id && event) {
            return (
                <div onClick={(e) => e.stopPropagation()} style={{
                    opacity: onEdit ? 0 : 1, pointerEvents: onEdit ? 'none' : undefined,

                }} className={styles.guest_name_cont}>

                    <span className={styles.guest_name}>{event?.anonymous ? 'Anónimo' : user?.name}</span>
                    {
                        event.state === 'confirmado' ?
                            <div className={styles.status_col}>
                                {/* <Button onClick={() => setOnUpdate(true)} className={styles.edit_button} icon={<UserRoundPen size={14} />}></Button> */}
                                <span className={styles.assitence_label}>{event.state === 'confirmado' ? 'Asistencia confirmada' : 'Asistencia declinada'}</span>

                            </div>
                            :
                            <>
                                <Button onClick={(e) => { e.stopPropagation(); confirmAssitance(user, isAnonymous) }} className={styles.button_card}>
                                    Confirmar
                                </Button>

                                <Button onClick={(e) => { e.stopPropagation(); setIsAnonymous(!isAnonymous) }} className={styles.anon_button_card} type="text">
                                    {
                                        isAnonymous ? 'Identificarse' : 'Confirmar anónimo'
                                    }
                                </Button>
                            </>
                    }






                </div>
            )

        }

        else {
            return (
                <div style={{
                    opacity: onEdit ? 0 : 1, pointerEvents: onEdit ? 'none' : undefined
                }} className={styles.card_inputs_col}>
                    <div className={styles.inputs_viewport}>
                        <div
                            ref={sliderRef}
                            className={styles.inputs_slider}
                            onWheel={(e) => e.preventDefault()}
                        >
                            <div className={`${styles.input_slide} ${onIssue ? styles.shake : ''}`}>
                                <Input value={user.name} onChange={(e) => setUser((prev) => ({ ...prev, name: e.target.value }))} className={styles.input_card} placeholder="Nombre" />
                            </div>

                            <div className={`${styles.input_slide} ${onIssue ? styles.shake : ''}`}>

                                <Space.Compact style={{ width: '100%' }}>
                                    <Input
                                        disabled
                                        className={styles.input_card}
                                        value={'+52'}
                                        style={{
                                            minWidth: '76px'
                                        }}
                                    />
                                    <Input
                                        type="tel"
                                        placeholder="Número de teléfono"
                                        className={styles.input_card}
                                        value={user.phone_number ?? ""}
                                        onChange={(e) => setUser((prev) => ({ ...prev, phone_number: e.target.value }))}
                                        style={{
                                            minWidth: 'calc(100% - 76px)',
                                            borderLeft: 'none', textAlign: 'left'
                                        }}
                                        maxLength={10}
                                    />
                                </Space.Compact>
                            </div>

                            <div className={`${styles.input_slide} ${onIssue ? styles.shake : ''}`}>
                                <Select value={user.type} onChange={(e) => setUser((prev) => ({ ...prev, type: e }))} placeholder="Categoría" className={styles.input_card} options={CATEGORY_OPTIONS}></Select>
                            </div>
                        </div>
                    </div>

                    <div className={styles.step_buttons_row}>
                        <Button
                            onClick={prevStep}
                            className={styles.secondary_button_card}
                            disabled={currentStep === 0}
                        >
                            <LuArrowLeft />
                        </Button>

                        <Button onClick={nextStep} className={styles.button_card}>
                            {currentStep === totalSteps - 1 ? 'CONFIRMAR' : 'SIGUIENTE'}
                        </Button>
                    </div>

                    <Button onClick={() => { onBackToPublic ? backToAnonymous() : setIsAnonymous(!isAnonymous) }} className={styles.anon_button_card} type="text">
                        {
                            isAnonymous ? 'Identificarse' : 'Confirmar anónimo'
                        }
                    </Button>
                </div>
            )
        }
    }

    const backToAnonymous = () => {
        getUser(process.env.NEXT_PUBLIC_ANONYMOUS_ID ?? "")
        setEvent((prev) => ({ ...prev, anonymous: true }))
        setOnBackToPublic(false)
    }

    const hadleAnonymous = () => {
        if (user.id === process.env.NEXT_PUBLIC_ANONYMOUS_ID) {

            setOnBackToPublic(true)

            setUser((prev) => ({
                ...prev,
                id: null
            }))
            handleReset()
            goToStep(0)
            setEvent((prev) => ({ ...prev, anonymous: false }))

        } else {
            updateAnonymous(!event?.anonymous)
        }
    }


    useEffect(() => {
        if (openModal) {

            const timer = setTimeout(() => {
                setDisplayCard(true)
            }, 300)

            return () => clearTimeout(timer)
        }
    }, [openModal])

    useEffect(() => {
        if (!displayCard) {
            const timer = setTimeout(() => {
                setOpenModal(false)
            }, 300)

            return () => clearTimeout(timer)
        }
    }, [displayCard, setOpenModal])

    useEffect(() => {
        const slider = sliderRef.current
        if (!slider) return

        const handleResize = () => {
            goToStep(currentStep, 'auto')
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        return () => window.removeEventListener('resize', handleResize)
    }, [currentStep])


    useEffect(() => {
        setOnEditCont(onEdit)
        setCustomData({
            emoji: user.emoji,
            profile: user.profile
        })
    }, [onEdit])

    useEffect(() => {
        if (onBackground || onEmoji) {
            setOnEditCont(false)
            setTimeout(() => {
                setOnEditCont(true)
            }, 300);
        }
    }, [onBackground, onEmoji])

    useEffect(() => {
        if (isAnonymous) {

            setUser((prev) => ({
                ...prev,
                name: 'Anónimo',
                phone_number: "0000000000",
                type: 'undefined',
                emoji: '🥷',
                profile: 15
            }))
            goToStep(totalSteps)
        }

        else {
            if (user.id) getUser(user.id)

            else handleReset()
        }
    }, [isAnonymous])

    useEffect(() => {
        if (onIssue) {
            setTimeout(() => {
                setOnIssue(false)
            }, 300);
        }
    }, [onIssue])



    return (
        <div
            style={{
                top: displayCard ? '30px' : user.id ? (!event || event.state !== 'confirmado') ? HIDE_NOT_CONFIRMED : HIDE_CONFIRMED : HIDE_FULL_CARD,
            }}
            className={styles.confirm_modal}
            onClick={(e) => e.stopPropagation()}
        >

            <div
                className={`${styles.flipCard} ${flipped ? styles.flipped : ""}`}
                onClick={() => (!onEdit && displayCard && user.id) ? setFlipped((prev) => !prev) : setDisplayCard(true)}
            >
                <div className={styles.flipInner}>
                    <div className={styles.front}>

                        <div style={{
                            height: onEdit ? ON_EDIT_HEIGHT
                                : user.id ? (!event || event.state !== 'confirmado') ? USER_NOT_CONFIRMED_HEIGHT : CONFIRMED_HEIGHT : NOT_USER_NOT_CONFIRMED_HEIGHT,
                            ['--gradient' as any]: onEdit ? profilesMap[customData.profile].background : profilesMap[event?.anonymous ? 15 : user.profile].background
                        }} className={styles.card_cont}>
                            <div className={styles.confirm_card_cont}>

                                <div
                                    style={{
                                        opacity: onEdit ? 1 : 0,
                                        pointerEvents: onEdit ? undefined : 'none'
                                    }}
                                    className={styles.buttons_custom_cont}
                                >
                                    <Button onClick={(e) => { e.stopPropagation(); setOnEdit(false) }} className={styles.custom_button}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={(e) => { e.stopPropagation(); saveChanges() }} className={styles.custom_button}>Guardar</Button>
                                </div>


                                <div className={styles.image_cont_bg}>
                                    <BackgroundGaffette />
                                    <div
                                        className={styles.user_image_cont}
                                        style={{
                                            background: onEdit ? profilesMap[customData.profile].gradient : profilesMap[user.profile].gradient
                                        }}
                                    >
                                        <span className={styles.emoji_cont}>{onEdit ? customData.emoji : event?.anonymous ? '🥷' : user.emoji}</span>
                                    </div>

                                    {
                                        !isAnonymous &&
                                        <div className={styles.act_buttons_cont}>

                                            <Button
                                                style={{
                                                    opacity: !onEdit ? 1 : 0,
                                                    pointerEvents: !onEdit ? undefined : 'none'
                                                }}
                                                onClick={(e) => { e.stopPropagation(); setOnEdit(true); setOnBackground(true) }}
                                                className={styles.custom_button}
                                            >
                                                Personalizar
                                            </Button>


                                            <div
                                                style={{
                                                    opacity: onEdit ? 1 : 0,
                                                    pointerEvents: onEdit ? undefined : 'none'
                                                }}
                                                className={styles.edit_buttons_cont}
                                            >
                                                <Button
                                                    onClick={(e) => { e.stopPropagation(); setOnEmoji(true); setOnBackground(false) }}
                                                    style={{
                                                        backgroundColor: onEmoji ? '#FFF' : '#00000040',
                                                        color: onEmoji ? '#000' : '#FFF'
                                                    }}
                                                    className={styles.custom_button}>
                                                    <LuType />
                                                </Button>
                                                <Button onClick={(e) => { e.stopPropagation(); setOnBackground(true); setOnEmoji(false) }} style={{
                                                    backgroundColor: onBackground ? '#FFF' : '#00000040',
                                                    color: onBackground ? '#000' : '#FFF'
                                                }} className={styles.custom_button}>
                                                    <LuPalette />
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                </div>


                                {
                                    handleCard()
                                }


                                <div className={styles.custom_cont} style={{

                                    bottom: onEditCont ? '-42px' : '-600px'
                                }}>
                                    <span>Color de tarjeta</span>
                                    <div className={styles.colors_grid}>
                                        {
                                            onBackground ?
                                                profiles.map((p, index) => (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation(); setCustomData((prev) => ({
                                                                ...prev, profile: p.id
                                                            }))
                                                        }}
                                                        key={index} style={{
                                                            background: p.gradient,
                                                            outline: p.id === customData.profile ? '2px solid #FFFFFF80' : 'none'
                                                        }} className={styles.color_item}>

                                                    </div>
                                                ))
                                                : <>
                                                    {
                                                        EMOJIS.map((p, index) => (
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); setCustomData((prev) => ({
                                                                        ...prev, emoji: p
                                                                    }))
                                                                }}
                                                                key={index} style={{
                                                                    background: profilesMap[user.profile].gradient,
                                                                    outline: p === customData.emoji ? '2px solid #FFFFFF80' : 'none'
                                                                }} className={styles.color_item}>
                                                                <span className={styles.emoji_cont}>{p}</span>


                                                            </div>
                                                        ))
                                                    }

                                                    <Input
                                                    maxLength={1}
                                                    value={customEmoji ?? ""}
                                                    onClick={(e) => { e.stopPropagation(); setCustomData((prev) => ({
                                                        ...prev, emoji: customEmoji
                                                    }))}}
                                                    onChange={(e) => { setCustomEmoji(e.target.value); e.stopPropagation(); setCustomData((prev) => ({
                                                        ...prev, emoji: e.target.value
                                                    }))}}
                                                    style={{
                                                        background: profilesMap[user.profile].gradient,
                                                        outline: customEmoji === customData.emoji ? '2px solid #FFFFFF80' : 'none'
                                                    }} placeholder='A' className={styles.input_emoji} />
                                                </>
                                        }
                                    </div>
                                </div>

                                {
                                    !onEditCont && <div onClick={(e) => { e.stopPropagation(); setDisplayCard(!displayCard) }} className={styles.bottom_button}></div>
                                }


                            </div>

                            {
                                (!onBackToPublic && user.id && !onEdit && (event && event?.state === 'confirmado')) &&
                                <Button
                                    icon={event?.anonymous ? <ScanFace size={14} /> : <HatGlasses size={14} />}
                                    onClick={(e) => { e.stopPropagation(); hadleAnonymous() }} className={styles.button_anonymous}>
                                    {
                                        event?.anonymous ? 'Identificarte' : 'Anónimo'
                                    }
                                </Button>
                            }
                        </div>

                    </div>
                    <div
                        className={styles.back}
                    >
                        <div style={{
                            height: onEdit ? ON_EDIT_HEIGHT
                                : user.id ? !event ? USER_NOT_CONFIRMED_HEIGHT : CONFIRMED_HEIGHT : NOT_USER_NOT_CONFIRMED_HEIGHT,
                            ['--gradient' as any]: onEdit ? profilesMap[customData.profile].background : profilesMap[event?.anonymous ? 15 : user.profile].background
                        }} className={styles.card_cont}>

                            <div style={{
                                position: 'relative', height: '100%', width: '100%', opacity: '0.5',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <BackgroundGaffette />
                            </div>
                        </div>

                    </div>
                </div>
            </div>





        </div>
    )
}