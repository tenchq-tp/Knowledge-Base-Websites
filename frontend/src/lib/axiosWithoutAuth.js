import axios from "axios";

const apiWithoutAuth = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ไม่มีการแนบ token ใน request

apiWithoutAuth.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error);
    return Promise.reject(error);
  }
);

export default apiWithoutAuth;
