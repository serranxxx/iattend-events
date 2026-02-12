import { useState } from "react";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// URLs de las APIs
const baseURL1 = "https://api.openweathermap.org/data/2.5/";
const baseLocal = "http://localhost:4000/api";
const baseProd = "https://i-attend-22z4h.ondigitalocean.app/api";

// Hook para clima (OpenWeather)
export const useWeather = () => {
  const [response, setResponse] = useState<AxiosResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const operation = async (params: AxiosRequestConfig) => {
    try {
      setLoading(true);
      const result = await axios.request({
        ...params,
        baseURL: baseURL1,
      });
      setResponse(result);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return { response, error, loading, operation, setLoading };
};

// Hook para invitaciones (i-attend)
export const useInvitation = () => {
  const [response, setResponse] = useState<AxiosResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const operation = async (params: AxiosRequestConfig) => {
    try {
      setLoading(true);
      const result = await axios.request({
        ...params,
        baseURL: baseProd,
      });
      setResponse(result);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return { response, error, loading, operation, setLoading };
};
