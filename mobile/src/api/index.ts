import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'https://checkupai-api.kro.kr';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  signup: (data: {
    name: string;
    email: string;
    password: string;
    birthDate: string;
    gender: string;
  }) => api.post('/api/auth/signup', data),
  getKakaoLoginUrl: () => `${API_BASE_URL}/oauth2/authorization/kakao`,
};

// User
export const userApi = {
  getMe: () => api.get('/api/user/me'),
  updateProfile: (data: { name?: string; birthDate?: string; gender?: string }) =>
    api.put('/api/user/me', data),
};

// Home
export const homeApi = {
  getHomeData: () => api.get('/api/home'),
  getNotifications: () => api.get('/api/notifications'),
};

// Checkup (건강검진)
export const checkupApi = {
  getAll: () => api.get('/api/checkup'),
  getLatest: () => api.get('/api/checkup/latest'),
  getById: (id: number) => api.get(`/api/checkup/${id}`),
  create: (data: CheckupInput) => api.post('/api/checkup', data),
  uploadPdf: (formData: FormData) =>
    api.post('/api/pdf/parse-and-save', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Vitals (혈압·혈당)
export const vitalsApi = {
  getRecent: () => api.get('/api/vitals'),
  getHistory: () => api.get('/api/vitals/history'),
  create: (data: VitalsInput) => api.post('/api/vitals', data),
};

// Medical Records (약국봉투/병원진료)
export const medicalApi = {
  getHistory: () => api.get('/api/medical-records/history'),
  create: (formData: FormData) =>
    api.post('/api/medical-records', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// AI Analysis
export const aiApi = {
  analyzeCheckup: (checkupId: number) =>
    api.post('/api/ai/analyze', { checkupId }),
  analyzeDaily: () => api.post('/api/ai/analyze/daily'),
  analyzeMedical: (type: 'PHARMACY' | 'HOSPITAL') =>
    api.post(`/api/ai/analyze/medical?type=${type}`),
};

// Payment
export const paymentApi = {
  confirmSingle: (data: { paymentKey: string; orderId: string; amount: number }) =>
    api.post('/api/payment/confirm', data),
  confirmMonthly: (data: { paymentKey: string; orderId: string; amount: number }) =>
    api.post('/api/payment/monthly', data),
};

// Goals
export const goalsApi = {
  getGoals: () => api.get('/api/goals'),
  setGoals: (data: object) => api.post('/api/goals', data),
};

// Types
export interface CheckupInput {
  checkupDate: string;
  height?: number;
  weight?: number;
  systolicBp?: number;
  diastolicBp?: number;
  fastingBloodSugar?: number;
  totalCholesterol?: number;
  hdlCholesterol?: number;
  ldlCholesterol?: number;
  triglycerides?: number;
  alt?: number;
  ast?: number;
  ggt?: number;
  creatinine?: number;
  hemoglobin?: number;
}

export interface VitalsInput {
  measuredAt: string;
  timeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME';
  systolicBp?: number;
  diastolicBp?: number;
  bloodSugar?: number;
  memo?: string;
}

export default api;
