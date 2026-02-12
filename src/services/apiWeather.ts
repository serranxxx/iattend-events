import { AxiosRequestConfig } from "axios";

export async function CurrentWeather(
  operation: (params: AxiosRequestConfig) => Promise<void>,
  zipCode: string,
  country: string
) {
  try {
    await operation({
      method: "GET",
      url: `weather?zip=${zipCode},${country}&units=metric&lang=es&appid=082be73deb2bcc79d867d128e39dfa2b`,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function CurrentForecast(
  operation: (params: AxiosRequestConfig) => Promise<void>,
  zipCode: string,
  country: string
) {
  try {
    await operation({
      method: "GET",
      url: `forecast?zip=${zipCode},${country}&units=metric&appid=082be73deb2bcc79d867d128e39dfa2b`,
    });
  } catch (error) {
    console.error(error);
  }
}
