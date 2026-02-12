import { AppUserEnterprise } from "@/types/context";
import { message } from "antd";
import { AxiosRequestConfig } from "axios";

/**
 * Intenta renovar el JWT si está próximo a expirar (menos de 30 minutos).
 * Si ya expiró, ejecuta logout y muestra un mensaje.
 *
 * @param logout - Función que cierra la sesión del usuario.
 * @param operation - Función que realiza una petición HTTP, típicamente configurada con Axios.
 */
export const renew_jwt = async (logout: () => void, operation: (params: AxiosRequestConfig) => Promise<void>) => {
  const expired = localStorage.getItem("token-expires");
  const token = localStorage.getItem("token");

  if (!expired || !token) {
    logout();
    return;
  }

  const now = new Date();
  const expiredDate = new Date(expired);
  const finalDate = new Date(expired);

  expiredDate.setMinutes(expiredDate.getMinutes() - 30);

  if (now > finalDate) {
    logout();
    message.info("Tu sesión ha expirado");
  } else if (now > expiredDate && now < finalDate) {
    try {
      await operation({
        method: "GET",
        url: "/auth/renew",
        headers: {
          token: `${token}`,
        },
      });
    } catch (error) {
      console.error("Error al renovar el token:", error);
    }
  } else {
    console.log("Token aún válido por más de 30 minutos.");
  }
};

/**
 * Inicia sesión con las credenciales proporcionadas.
 *
 * @param operation - Función que realiza la petición HTTP (POST /auth/login).
 * @param Email - Correo electrónico del usuario.
 * @param Password - Contraseña del usuario.
 */
export async function onLogin(operation: (params: AxiosRequestConfig) => Promise<void>, Email: string, Password: string) {
  try {
    await operation({
      method: "POST",
      url: "/auth/login",
      headers: { accept: "*/*" },
      data: {
        Email,
        Password,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
  }
}

/**
 * Registra un nuevo usuario en el sistema.
 *
 * @param operation - Función para enviar la petición HTTP (POST /auth/new-user).
 * @param Name - Nombre del nuevo usuario.
 * @param Email - Correo electrónico.
 * @param Password - Contraseña.
 */
export async function onNewUser(operation: (params: AxiosRequestConfig) => Promise<void>, Name: string, Email: string, Password: string) {
  const newUser = {
    Name,
    Email,
    Password,
    Invitations: [],
    Role: "Owner",
  };

  try {
    await operation({
      method: "POST",
      url: "/auth/new-user",
      headers: {
        "Content-Type": "application/json",
      },
      data: newUser,
    });
  } catch (error) {
    message.error("Es probable que este usuario ya exista");
  }
}

/**
 * Obtiene todos los usuarios registrados.
 *
 * @param operation - Función que realiza la petición HTTP (GET /auth/).
 */
export async function getUSers(operation: (params: AxiosRequestConfig) => Promise<void>) {
  try {
    await operation({
      method: "GET",
      url: "/auth/",
    });
  } catch (error) {
    message.error("Error al obtener los usuarios");
  }
}

/**
 * Edita los datos de una empresa del usuario por su UID.
 *
 * @param operation - Función que realiza la petición HTTP (PUT /auth/edit/:uid).
 * @param uid - ID único del usuario a modificar.
 * @param name_enterprise - Nombre nuevo de la empresa.
 * @param logo_enterpise - URL del nuevo logo de la empresa.
 */

export async function editUser(operation: (params: AxiosRequestConfig) => Promise<void>, uid: string, enterpriseModel: AppUserEnterprise) {
  const token = localStorage.getItem("token");
  const data = {
    Enterprise: enterpriseModel,
  };

  try {
    await operation({
      method: "PUT",
      url: `/auth/edit/${uid}`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: data,
    });
  } catch (error) {
    message.error("Es probable que este usuario ya exista");
  }
}
