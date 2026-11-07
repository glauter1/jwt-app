import axios from "axios";

const publicApi = axios.create({
  baseURL: process.env.API_URL || "http://localhost:3000/v1",
  headers: {
    "Content-Type": "application/json",
  },
});


export default publicApi;