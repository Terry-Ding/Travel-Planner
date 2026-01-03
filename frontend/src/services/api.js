import axios from 'axios';

// In production, this should be an env var
const API_URL = 'http://localhost:8002';

export const getCities = async () => {
    const response = await axios.get(`${API_URL}/cities`);
    return response.data;
};

export const planGreedyRoute = async (startCity, mustVisit, returnToStart) => {
    const response = await axios.post(`${API_URL}/plan/greedy`, {
        start_city: startCity,
        must_visit: mustVisit,
        return_to_start: returnToStart
    });
    return response.data;
};

export const planIntelligentRoute = async (startCity, endCity) => {
    const response = await axios.post(`${API_URL}/plan/intelligent`, {
        start_city: startCity,
        end_city: endCity,
        return_to_start: false // Not used for intelligent logic in backend currently but keeps model consistent
    });
    return response.data;
};
