const BASE_URL = '/api';

const api = {
    async get(endpoint) {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${BASE_URL}${endpoint}${user.id ? `${separator}userId=${user.id}` : ''}`;
        
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },

    async post(endpoint, data) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async upload(endpoint, formData) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        return res.json();
    }
};
