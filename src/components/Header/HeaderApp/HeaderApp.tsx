"use client";

import { appContext } from "@/context/AppContext";
import { editUser } from "@/services/apiLogin";
import { useInvitation } from "@/services/customHook";
import { AppUser, AppUserEnterprise } from "@/types/context";
import { Button, Empty, Input, Upload, message } from "antd";
import { useContext, useEffect, useState } from "react";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebase/firebase";
import { UploadRequestOption } from "rc-upload/lib/interface";
import { NavItems } from "@/helpers/header";
import Link from "next/link";
import { FaCheck, FaRegTrashCan } from "react-icons/fa6";
import { IoMdAdd } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { HiOutlineMenu } from "react-icons/hi";
import styles from "./header.module.css";
import { RcFile } from "antd/es/upload";
import { generateImagesName } from "@/helpers/functions";

type Props = {
  position: string;
  isVisible: boolean;
};

export const HeaderApp = ({ position, isVisible }: Props) => {
  const [messageApi, contextHolder] = message.useMessage();
  const { logged, logout, user, login } = useContext(appContext)!;
  const { operation } = useInvitation();
  // const [IsScrollTop, setIsScrollTop] = useState(false);
  const [localUser, setLocalUser] = useState<AppUser | null>(null);
  const [onEnterprise, setOnEnterprise] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [enterpriseModel, setEnterpriseModel] = useState<AppUserEnterprise>({
    name: null,
    active: false,
    color: null,
    discount: null,
    email: null,
    instagram: null,
    logo: null,
    webpage: null,
    whatsapp: null,
  });

  const getFirstLetterUpperCase = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase();
  };

  // useEffect(() => {
  //   if (position === "home") {
  //     const handleScroll = () => {
  //       if (window.scrollY >= 0 && window.scrollY <= 100) {
  //         setIsScrollTop(false);
  //       } else {
  //         setIsScrollTop(false);
  //       }
  //     };

  //     window.addEventListener("scroll", handleScroll);

  //     return () => {
  //       window.removeEventListener("scroll", handleScroll);
  //     };
  //   }
  // }, []);

  useEffect(() => {
    if (user && user.enterprise) {
      setLocalUser(user);
      setEnterpriseModel(user.enterprise);
    }
  }, [user]);

  const handleURL = (downloadURL: string) => {
    setEnterpriseModel({
      ...enterpriseModel,
      logo: downloadURL,
    });
  };

  const saveAndClose = () => {
    if (localUser) {
      editUser(operation, localUser.uid, enterpriseModel);
      const newUser = {
        name: localUser?.name,
        uid: localUser?.uid,
        role: localUser?.role,
        enterprise: enterpriseModel,
      };
      login(newUser);
      setOnEnterprise(false);
    }
  };

  const saveChanges = () => {
    if (localUser) {
      editUser(operation, localUser.uid, enterpriseModel);
      const newUser = {
        name: localUser?.name,
        uid: localUser?.uid,
        role: localUser?.role,
        enterprise: enterpriseModel,
      };
      login(newUser);
      messageApi.success("Información actualizada");
      setOnEnterprise(false);
    }
  };

  const handleCustomRequest = ({ file }: UploadRequestOption) => {
    // Ant Design usa RcFile internamente, así que lo casteamos si es necesario
    const realFile = file as RcFile;
    if (!realFile || !user) return;

    // Verificar si el archivo es menor a 5MB
    const isLt5M = realFile.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("El archivo debe ser menor a 5MB.");
      return;
    }

    const storageRef = ref(storage, `superUsers/${user.uid}/${generateImagesName()}`);

    const uploadTask = uploadBytesResumable(storageRef, realFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log(progress);
        // setProgress(progress); ← descomenta si usas un estado
      },
      (error) => {
        console.error("Upload error:", error);
        message.error("Hubo un error al subir la imagen.");
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          handleURL(downloadURL);
        });
      }
    );
  };

  const removeImageDB = () => {
    setEnterpriseModel({
      ...enterpriseModel,
      logo: null,
    });
  };

  const deleteImageFB = async (url: string) => {
    const filePath = extractFilePathFromURL(url);
    const imageRef = ref(storage, filePath);

    try {
      await deleteObject(imageRef);
      removeImageDB();
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const extractFilePathFromURL = (url: string) => {
    const regex = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/(.+)\?alt=media&token=.+/;
    const match = url.match(regex);
    if (!match) {
      throw new Error("URL does not match Firebase Storage base URL.");
    }
    const filePath = decodeURIComponent(match[2]);
    return filePath;
  };

  return (
    <>
      {contextHolder}
      <div className={styles.header_main_container}>
        <div className={styles.header_container}>
          <img
            src="/images/_iattend_logo.svg"
            style={{
              width: "120px",
              objectFit: "cover",
            }}
          />
          <div className={styles.header_tabs_cont}>
            <div className={styles.header_tabs_cont} style={{ gap: "12px" }}>
              {NavItems.map((item) => {
                // Condiciones para ocultar el elemento 'Admin'
                if (item.name === "Admin" && (!logged || localUser?.role !== "Admin")) {
                  return null; // No renderiza nada
                }

                if (item.name === "Empresa" && (!logged || !localUser?.enterprise?.active)) {
                  return null; // No renderiza nada
                }

                return (
                  <Link href={item.path} key={item.name}>
                    <div
                      onClick={localUser?.enterprise?.active ? () => setOnEnterprise(!onEnterprise) : undefined}
                      className={`${styles.nav_item_col} ${item.position === position ? styles.__selected : ""}`}
                    >
                      {item.position === position ? (
                        <item.selected className={styles.nav_item_icon} />
                      ) : (
                        <item.icon className={styles.nav_item_icon} />
                      )}
                      <span className={styles.nav_item_label}>{item.name}</span>
                    </div>
                  </Link>
                );
              })}

              <Link
                href={`https://wa.me/6145338500?text=${encodeURIComponent("Hola, estoy interesado en las invitaciones digitales")}`}
                target="_blank"
                style={{}}
              >
                <Button type="primary">{logged ? "¿Necesitas ayuda?" : "CONTÁCTANOS"}</Button>
              </Link>
              {logged && (
                <Button style={{ maxWidth: "32px" }} onClick={logout}>
                  {user ? getFirstLetterUpperCase(localUser?.name ?? "A") : "A"}
                </Button>
              )}
            </div>

            {onEnterprise && (
              <div className={styles.distributor_card}>
                <div
                  className={styles.dist_single_col}
                  style={{ borderBottom: "1px solid var(--borders)", paddingBottom: "18px", marginBottom: "18px" }}
                >
                  <div className={styles.dist_single_row} style={{ alignItems: "center", marginBottom: "6px" }}>
                    <span className={styles.distributor_card_title}>Perfil de empresa</span>
                    <div className={styles.dist_single_row} style={{ justifyContent: "flex-end", gap: "8px", padding: "0px" }}>
                      <Button type="primary" onClick={saveChanges} icon={<FaCheck />}>
                        Guardar
                      </Button>
                      <Button onClick={saveAndClose} icon={<IoClose />}></Button>
                    </div>
                  </div>
                  <span style={{ padding: "0px 16px" }} className={styles.distributor_card_description}>
                    Convierte I attend en una <b>extensión de tu marca.</b> Crea tu perfil de empresa y comparte invitaciones con el estilo
                    que te representa.
                  </span>
                </div>
                <div className={styles.dist_form_container}>
                  <div className={styles.dist_single_row}>
                    <div className={styles.dist_single_col}>
                      <span className={styles.distributor_card_label}>Nombre de empresa</span>
                      <Input
                        onChange={(e) =>
                          setEnterpriseModel({
                            ...enterpriseModel,
                            name: e.target.value,
                          })
                        }
                        placeholder="Amor & Encanto"
                        value={enterpriseModel.name ?? ""}
                      />
                    </div>
                    <div className={styles.dist_single_col}>
                      <span className={styles.distributor_card_label}>Email</span>
                      <Input
                        onChange={(e) =>
                          setEnterpriseModel({
                            ...enterpriseModel,
                            email: e.target.value,
                          })
                        }
                        placeholder="amor@encanto.com"
                        value={enterpriseModel.email ?? ""}
                      />
                    </div>
                  </div>

                  <div className={styles.dist_single_row}>
                    <div className={styles.dist_single_col}>
                      <span className={styles.distributor_card_label}>Instagram</span>
                      <Input
                        onChange={(e) =>
                          setEnterpriseModel({
                            ...enterpriseModel,
                            instagram: e.target.value,
                          })
                        }
                        defaultValue="@"
                        placeholder="amor&encanto"
                        value={enterpriseModel.instagram ?? ""}
                      />
                    </div>
                    <div className={styles.dist_single_col}>
                      <span className={styles.distributor_card_label}>Pagina web</span>
                      <Input
                        onChange={(e) =>
                          setEnterpriseModel({
                            ...enterpriseModel,
                            webpage: e.target.value,
                          })
                        }
                        placeholder="amor&encanto.com.mx"
                        value={enterpriseModel.webpage ?? ""}
                      />
                    </div>
                  </div>

                  <div className={styles.dist_single_row}>
                    <div className={styles.dist_single_col}>
                      <span className={styles.distributor_card_label}>Whatsapp</span>
                      <Input
                        onChange={(e) =>
                          setEnterpriseModel({
                            ...enterpriseModel,
                            whatsapp: e.target.value,
                          })
                        }
                        placeholder="6141234567"
                        value={enterpriseModel.whatsapp ?? ""}
                      />
                    </div>
                    <div className={styles.dist_single_col}></div>
                  </div>

                  <div className={styles.dist_single_col} style={{ padding: "0px 16px", alignSelf: "stretch" }}>
                    <span className={styles.distributor_card_label}>Logo</span>

                    <div className={styles.dist_img_btn_cnt}>
                      <div className={styles.distributor_card_image_container} style={{ position: "relative" }}>
                        {enterpriseModel.logo ? (
                          <>
                            <img
                              alt=""
                              src={enterpriseModel.logo}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </>
                        ) : (
                          <Empty description={false} />
                        )}
                      </div>
                      <div className={styles.upload_btn_ctn}>
                        {enterpriseModel.logo ? (
                          <Button onClick={() => deleteImageFB(enterpriseModel.logo ?? "")} icon={<FaRegTrashCan size={20} />} />
                        ) : (
                          <Upload
                            customRequest={handleCustomRequest}
                            showUploadList={false} // Oculta la lista de archivos subidos
                            beforeUpload={() => false} // Evita la carga automática de archivos
                          >
                            <Button icon={<IoMdAdd size={20} />}></Button>
                          </Upload>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          opacity: isVisible ? 1 : 0,
          display: "none",
        }}
        className="header-main-container mobile-opt"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "90%",
            position: "relative",
          }}
        >
          {/* <ManualLogo /> */}

          <Button onClick={() => setOpenMenu(true)} type="text" icon={<HiOutlineMenu size={36} />} />
        </div>

        <div
          style={{
            right: !openMenu ? "-100vw" : "0px",
          }}
          className="mobile-menu-container"
        >
          <div className="header-main-container">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                width: "90%",
                position: "relative",
              }}
            >
              {/* <span className="mobile-menu-label">Menú</span> */}
              <Button onClick={() => setOpenMenu(false)} type="text" icon={<IoClose size={36} />} />
            </div>
          </div>

          <div className="mobile-menu-routes">
            {NavItems.map((item) => {
              // Condiciones para ocultar el elemento 'Admin'
              if (item.name === "Admin" && (!logged || localUser?.role !== "Admin")) {
                return null; // No renderiza nada
              }

              if (item.name === "Empresa" && (!logged || localUser?.role === "Owner")) {
                return null; // No renderiza nada
              }

              // if (item.name === 'Tablero') {
              //     return null;  // No renderiza nada
              // }

              return (
                <Link style={{ textDecoration: "none" }} href={item.path} key={item.name}>
                  <span
                    style={{
                      color: item.position === position ? "var(--brand-color-500)" : undefined,
                    }}
                    className="mobile-nav-item"
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}

            <Link target="_blank" style={{ textDecoration: "none" }} href="https://wa.me/6145338500">
              <span className="mobile-nav-item">Contacto</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
