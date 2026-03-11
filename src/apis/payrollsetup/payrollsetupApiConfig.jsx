import axios from "axios";

const API_URL = `${import.meta.env.VITE_APP_PAYROLL_URL}/api`;

const payrollsetupApiConfig = axios.create(
    {
        baseURL: API_URL,
        headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
        }
    }
)

export default payrollsetupApiConfig;