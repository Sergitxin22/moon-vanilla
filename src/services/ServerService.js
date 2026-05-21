export default class ServerService {
    static BASE_URL = "https://moon.deusto.es/api/";
    static AUTH_HEADER = "Basic bW9vbl9hZG1pbl9kamFuZ286M19LRE4mcmIrTUpCa1A5SA==";

    static async postCreateGame(parameters) {
        return this.post("games/", parameters);
    }

    static async postCreateRound(parameters) {
        return this.post("rounds/", parameters);
    }

    static async post(endpoint, parameters) {
        const url = this.BASE_URL + endpoint;
        const formBody = Object.keys(parameters).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key])).join('&');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': this.AUTH_HEADER,
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formBody
            });

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }
}
