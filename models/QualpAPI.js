require("dotenv").config();
const ErrorHandler = require("./ErrorHandler");

class QualpAPI {
    #source;
    #destination;
    #route;
    #apiAccessToken;
    #axios;
    #qualpParams;
    #errorHandler;

    constructor() {
        this.#apiAccessToken = process.env.API_ACCESS_TOKEN;
        this.#axios = require("axios");
        this.#qualpParams = require("../etc/json/qualp-params.json");
        this.#errorHandler = new ErrorHandler();
    }

    async GetRoute() {
        await this.#axios.get("https://api.qualp.com.br/rotas/v4", {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Access-Token': this.#apiAccessToken
            },
            params: { json: JSON.stringify(this.#qualpParams) }
        }).then(res => {
            this.route = res ? res.data : false;
        }).catch(error => {
            this.#errorHandler.HandleError(error);
        });

        return this.route;
    }

    SetParams(source, destination) {
        this.#qualpParams.locations = [];
        this.#qualpParams.locations.push(source, destination);
    }

    get source() {
        return this.#source;
    };
    set source(newValue) {
        this.#source = newValue;
    };

    get destination() {
        return this.#destination;
    };
    set destination(newValue) {
        this.#destination = newValue;
    };

    get route() {
        return this.#route;
    };
    set route(newValue) {
        this.#route = newValue;
    };
}

module.exports = QualpAPI;