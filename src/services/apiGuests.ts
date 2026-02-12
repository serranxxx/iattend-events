import { generateSimpleId } from "@/helpers/functions";
import { Guest, GuestAccessPayload, GuestUpdate, Guests, Table } from "@/types/guests";
import { AxiosRequestConfig } from "axios";
import { StringSchema } from "firebase/vertexai";

export async function getGuestsByInvitationID(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string) {
  try {
    await operation({
      method: "GET",
      url: `/guests/${invitationID}`,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function getUpdatesByID(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string) {
  const token = localStorage.getItem("token");
  try {
    await operation({
      method: "GET",
      url: `/guests/${invitationID}/updates`,
      headers: {
        accept: "*/*",
        token: token,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export async function AddNewGuest(operation: (params: AxiosRequestConfig) => Promise<void>, guests: Guests, newGuest: Guest) {
  const data = {
    userID: guests.userID,
    invitationID: guests.invitationID,
    tickets: guests.tickets,
    type: guests.type,
    guests: [...guests.guests, newGuest],
  };

  try {
    await operation({
      method: "PATCH",
      url: `/guests/${guests.invitationID}`,
      data: data,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function deleteGuestByID(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string, guestID: string) {
  const token = localStorage.getItem("token");

  try {
    await operation({
      method: "DELETE",
      url: `/guests/${invitationID}/guests`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: {
        id: guestID,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export async function confirmGuests(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string, newGuest: Guest){

  const data = {
      guest: newGuest // Enviar solo el invitado, no todo el array
  }

  try {
      await operation({
          method: "PATCH",
          url: `/guests/confirm/${invitationID}`,
          data: data
      })

  } catch (error) {
      console.error(error)
  }
}


export async function moveTickets(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string, card: Guest) {
  const token = localStorage.getItem("token");

  try {
    await operation({
      method: "PATCH",
      url: `/guests/${invitationID}/guests`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: {
        id: card.id,
        guestUpdates: {
          last_action: "edited",
          available_cards: card.companions.length,
          last_update_date: new Date(),
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export async function editCurrentGuest(
  operation: (params: AxiosRequestConfig) => Promise<void>,
  invitationID: string,
  card: Guest,
  updates: GuestUpdate
) {
  const token = localStorage.getItem("token");

  try {
    await operation({
      method: "PATCH",
      url: `/guests/${invitationID}/guests`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: {
        id: card.id,
        guestUpdates: {
          name: updates.name,
          username: updates.username,
          available_cards: updates.tickets,
          companions: updates.companions,
          state: updates.state,
          last_update_date: new Date(),
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export async function updateTables(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string, tables: Table) {
  const token = localStorage.getItem("token");

  try {
    await operation({
      method: "PATCH",
      url: `/guests/${invitationID}`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: {
        tables, // este es el nuevo array de mesas que quieres guardar
        last_update_date: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating tables:", error);
  }
}

export async function guestLogin(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string, guestID: string) {
  try {
    await operation({
      method: "POST",
      url: `/guests/login`,
      data: {
        invitationID: invitationID,
        guestID: guestID,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export async function editGuestsGuest(
  operation: (params: AxiosRequestConfig) => Promise<void>,
  invitationID: string,
  guestInfo: GuestAccessPayload,
  confirmed: string,
  tickets: string[],
  currentGuestName: string
) {
  // const token = localStorage.getItem("guest-token");
  const data = {
    id: guestInfo.guestID,
    guestUpdates: {
      name: guestInfo.username,
      state: confirmed,
      last_action: confirmed === "confirmado" ? "accepted" : "rejected",
      available_cards: guestInfo.cards,
      companions: confirmed === "confirmado" ? [currentGuestName, ...tickets] : tickets,
    },
  };
  try {
    await operation({
      method: "PATCH",
      url: `/guests/${invitationID}/guests`,
      headers: {
        accept: "*/*",
      },
      data: data,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function EditTickets(
  operation: (params: AxiosRequestConfig) => Promise<void>,
  guests: Guests,
  availableTickets: number | null,
  guestsUpdated: Guest,
  typeCard: string
) {
  const token = localStorage.getItem("token");

  const data = {
    userID: guests.userID,
    invitationID: guests.invitationID,
    tickets: availableTickets,
    type: typeCard,
    guests: guestsUpdated,
  };

  try {
    await operation({
      method: "PATCH",
      url: `/guests/${guests.invitationID}`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: data,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function addShare(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string, email: string) {
  const token = localStorage.getItem("token");

  try {
    await operation({
      method: "POST",
      url: `/guests/shared/${invitationID}`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: {
        email: email,
        password: generateSimpleId(),
        id: generateSimpleId(),
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export async function deleteShare(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string, id: string) {
  const token = localStorage.getItem("token");
  try {
    await operation({
      method: "DELETE",
      url: `guests/shared/${invitationID}`,
      headers: {
        accept: "*/*",
        token: token,
      },
      data: {
        shareId: id,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export async function loginShare(operation: (params: AxiosRequestConfig) => Promise<void>, invitationID: string, password: string) {
  try {
    await operation({
      method: "POST",
      url: `guests/shared/login/${invitationID}`,
      data: {
        password: password,
      },
    });
  } catch (error) {
    console.error(error);
  }
}
