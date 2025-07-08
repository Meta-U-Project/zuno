const axios = require('axios');

const getCanvasApiClient = (accessToken, domain) => {
    return axios.create({
        baseURL: `https://${domain}/api/v1`,
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
};

module.exports = getCanvasApiClient;
