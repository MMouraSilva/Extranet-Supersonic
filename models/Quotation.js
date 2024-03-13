const connection = require("../database/connection");
require("dotenv").config();
const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue, Filter } = require("firebase-admin/firestore");
const QualpAPI = require("./QualpAPI");
const cities = require("../public/plugins/municipios-brasileiros/municipios");
const states = require("../public/plugins/municipios-brasileiros/estados");


const db = getFirestore(connection);

class Quotation {
    #originState;
    #originCity;
    #destinationState;
    #destinationCity;
    #cargoPrice;
    #cargoWeight;
    #numberOfAxles;
    #routeDistance;
    #routeDuration;
    #tollsValue;
    #originStateUfCode;
    #destinationStateUfCode;
    #source;
    #destination;
    #route;
    
    constructor(data) {
        this.#originState = data.originState;
        this.#originCity = data.originCity;
        this.#destinationState = data.destinationState;
        this.#destinationCity = data.destinationCity;
        this.#cargoPrice = data.currency;
        this.#cargoWeight = data.weight;
        this.#numberOfAxles = data.axles;
        this.#routeDistance = 0;
        this.#routeDuration = 0;
        this.#tollsValue = 0;
        this.#originStateUfCode = this.GetStateUfCode(this.#originState);
        this.#destinationStateUfCode = this.GetStateUfCode(this.#destinationState);
        
        this.#source;
        this.#destination;
        this.#route;
        
        this.SetFormattedSourceAndDestination();
        this.qualp = new QualpAPI(this.#source, this.#destination);
    }

    async SetRoute() {
        try {
            var success = true;
            this.#route = await this.qualp.GetRoute();
        } catch(error) {
            console.error(error);
            success = false;
        } finally {
            return success;
        }
    }

    GetRouteDistance() {
        return this.#routeDistance;
    }

    SetRouteDistance() {
        this.#routeDistance = this.#route.distancia.valor;
    }

    GetTollsValue() {
        return this.#tollsValue;
    }

    SetTollsValue() {
        this.#tollsValue = this.CaculateTollsValue();
    }

    CaculateTollsValue() {
        var tollsValue = 0;

        for(var i = 0; i < this.#route.pedagios.length; i++) {
            tollsValue += this.#route.pedagios[i].tarifa[JSON.stringify(this.#numberOfAxles)];
        }

        return tollsValue ? parseFloat(tollsValue.toFixed(2)) : 0;
    }

    GetStateUfCode(stateName) {
        return states.filter((state) => {
            return state.nome == stateName;
        })[0].uf;
    }

    SetFormattedSourceAndDestination() {
        this.#source = this.#originCity + " - " + this.#originStateUfCode;
        this.#destination = this.#destinationCity + " - " + this.#destinationStateUfCode;
    }
}

module.exports = Quotation;