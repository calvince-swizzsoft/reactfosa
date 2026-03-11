import axios from "axios";

const EMP_BASE_URL = "https://63e9030f26e2.ngrok-free.app/api";

const getemployeesapi = axios.create({
    baseURL: EMP_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",        
    }
})

export default getemployeesapi