import { Guests } from "@/types/guests";
import { Invitation } from "@/types/invitation";
import { AxiosRequestConfig } from "axios";
import { getStorage } from "firebase/storage";

const storage = getStorage();

export async function getInvitationbyID(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string) {
  try {
    await operation({
      method: "GET",
      url: `/inv/${invitationID}`,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function getAllInvitations(operation: (params: AxiosRequestConfig) => Promise<void>) {
  try {
    await operation({
      method: "GET",
      url: `/inv`,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function getAllUserInvitations(operation: (params: AxiosRequestConfig) => Promise<void>, userID: string) {
  const token = localStorage.getItem("token");
  try {
    await operation({
      method: "GET",
      url: `/inv/user/${userID}`,
      headers: {
        accept: "*/*",
        token: token,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export async function editInvitation(operation: (params: AxiosRequestConfig) => Promise<void>, invitation: Invitation) {
  const token = localStorage.getItem("token");
  // console.log('edit inv: ', invitation)

  try {
    await operation({
      method: "PUT",
      url: `/inv/${invitation._id}`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: invitation,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function newInvitation(operation: (params: AxiosRequestConfig) => Promise<void>, invitation: Invitation) {
  const token = localStorage.getItem("token");
  try {
    await operation({
      method: "POST",
      url: `/inv`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: invitation,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function createGuests(operation: (params: AxiosRequestConfig) => Promise<void>, guests: Guests) {
  const token = localStorage.getItem("token");
  try {
    await operation({
      method: "POST",
      url: `/guests/`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: guests,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function getAllDominios(operation: (params: AxiosRequestConfig) => Promise<void>, label: string) {
  const token = localStorage.getItem("token");
  try {
    await operation({
      method: "POST",
      url: `/inv/dominios`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: {
        label: label,
      },
    });
  } catch (error) {
    console.error(error);
  }
}
