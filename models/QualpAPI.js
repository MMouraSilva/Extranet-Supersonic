require("dotenv").config();
const apiAccessToken = process.env.API_ACCESS_TOKEN;
const axios = require("axios");
const qualpParams = require("../etc/json/qualp-params.json");

class QualpAPI {
    constructor(source, destination) {
        this.source = source;
        this.destination = destination;
        this.route = false;

        qualpParams.locations.push(source, destination);
    }

    async GetRoute() {
        await axios.get("https://api.qualp.com.br/rotas/v4", {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Access-Token': apiAccessToken
            },
            params: { json: JSON.stringify(qualpParams) }
        }).then(res => {
            this.route = res ? res.data : false;
        }).catch(error => {
            console.error(error);
        });

        return this.route;
    }
}

module.exports = QualpAPI;