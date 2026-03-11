import axios from "axios";

const BASE_URL= `${import.meta.env.VITE_APP_PAYROLL_URL}/api`;

const Base_Url = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        
    },
})

export default Base_Url;