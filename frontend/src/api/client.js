import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("organ_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";

    if (status === 401 && !requestUrl.includes("/auth/login")) {
      localStorage.removeItem("organ_token");
      localStorage.removeItem("organ_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const loginRequest = async (payload) => (await api.post("/auth/login", payload)).data;
export const fetchDemoUsers = async () => (await api.get("/auth/demo-users")).data;

export const fetchDashboard = async () => (await api.get("/dashboard/summary")).data;

export const fetchEntityList = async (entity, params = {}) =>
  (await api.get(`/entities/${entity}`, { params })).data;
export const createEntity = async (entity, payload) => (await api.post(`/entities/${entity}`, payload)).data;
export const updateEntity = async (entity, id, payload) => (await api.put(`/entities/${entity}/${id}`, payload)).data;
export const deleteEntity = async (entity, id) => (await api.delete(`/entities/${entity}/${id}`)).data;

export const fetchMatchSuggestions = async (recipientId) =>
  (await api.get("/matches/suggestions", { params: { recipientId } })).data;
export const runMatching = async (payload) => (await api.post("/matches/run", payload)).data;
export const fetchEmergencyQueue = async () => (await api.get("/matches/emergency-queue")).data;
export const fetchMatchRecords = async () => (await api.get("/matches/records")).data;

export const fetchTransportJobs = async (params = {}) => (await api.get("/transport/jobs", { params })).data;
export const fetchTransportJourney = async (transportId) =>
  (await api.get(`/transport/${transportId}/journey`)).data;
export const fetchTransportNetwork = async () => (await api.get("/transport/network")).data;

export const fetchApprovalWorkflow = async () => (await api.get("/approval/workflow")).data;

export default api;
