const Firebase = require("./Firebase");
const ErrorHandler = require("./ErrorHandler");
const QualpAPI = require("./QualpAPI");
const FreightRules = require("./FreightRules");

class Quotation {
    #dataModel;
    #firebase;
    #errorHandler;
    #cities;
    #states;
    #qualp;
    #client;
    #freightRules;
    #freightRule;
    #matrizICMS;
    #refBaseColeta;

    constructor() {
        this.#dataModel = new QuotationDataModel();
        this.#firebase = new Firebase();
        this.#firebase.collection = "quotation";
        this.#errorHandler = new ErrorHandler();
        this.#cities = require("../public/plugins/municipios-brasileiros/municipios");
        this.#states = require("../public/plugins/municipios-brasileiros/estados");
        this.#qualp = new QualpAPI();
        this.#client = require("../config/redisClient");
        this.#freightRules = new FreightRules();
        this.#matrizICMS = require("../public/js/matrizICMS");
        this.#refBaseColeta = require("../public/js/ref_base_coleta");
    }

    async GenerateQuotation(data) {
        await this.#SetRoute(data);
        this.freightRule = await this.#SetFreightRuleValues(this.#GetQuotationData());
        if(this.freightRule) await this.#SetQuotationCalculations();
        const { hasSucceed, error, quotationCode } = await this.#SaveQuotationOnDatabase();

        return { ruleNotFound: !this.freightRule, hasSucceed, error, quotationCode };
    }

    async GetQuotationByCode(quotationCode) {
        this.#firebase.field = "quotationCode";
        const { doc, error } = await this.#firebase.FirebaseGetUniqueDocByField(quotationCode);
        if(error) this.#errorHandler.HandleError(error);

        let docData = this.#PushToArray(doc);

        return docData;
    }

    async #SaveQuotationOnDatabase() {
        const quotationData = this.#GetQuotationData();
        const { hasSucceed, error } = this.freightRule ? 
            await this.#firebase.FirebaseAddDoc(quotationData) : { hasSucceed: false, error: "rule-not-found" };

        return { hasSucceed, error, quotationCode: quotationData.quotationCode };
    }

    async #PushToArray(doc) {
        var quotation = [];

        doc.docs.map(doc => {
            quotation = doc.data();
        });

        return quotation;
    }

    async #SetRoute(data) {
        this.#SetQuotationData(data);
        this.#dataModel.route = await this.#GetRoute(this.#dataModel.origin, this.#dataModel.destination);
        this.#SetRouteDistance();
    }

    #SetRouteDistance() {
        this.#dataModel.routeDistance = this.#dataModel.route.distancia.valor;
    }

    async #SetQuotationCalculations() {
        this.#dataModel.pricePerDistance = this.freightRule.pricePerDistance;
        this.#SetTollsValue();
        this.#CalculateQuotation();
        await this.#SetCollectValue();
        await this.#SetDeliveryValue();
    }

    #SetTollsValue() {
        this.#SetNumberOfAxles(this.freightRule);
        this.#dataModel.tollsValue = this.#CaculateTollsValue(this.#dataModel.route);
    }

    async #SetFreightRuleValues(data) {
        const freightRule = await this.#ChooseFreightRule(data);
        const rule = freightRule ? this.#PushRuleToArray(freightRule) : false;
        
        return rule;
    }

    async #SetCollectValue() {
        this.#dataModel.collectValue = await this.#CalculateCollectValue();
    }

    async #SetDeliveryValue() {
        this.#dataModel.deliveryValue =
            this.#dataModel.destinationState == "São Paulo" || this.#dataModel.destinationState == "Pará"
            || this.#dataModel.destinationCity == "Manaus" ?
                await this.#CalculateDeliveryValue() : 0;
    }

    async #ChooseFreightRule(quotationData) {
        let originToRegionRule, distanceRangeRule;

        const originToDestinationRule = await this.#freightRules.GetOriginToDestinationRule(quotationData);
        if(!originToDestinationRule._size) {
            originToRegionRule = await this.#freightRules.GetOriginToRegionRule(quotationData);
            if(!originToRegionRule._size) distanceRangeRule = await this.#freightRules.GetDistanceRangeRule(quotationData);
        }

        return originToDestinationRule._size ? originToDestinationRule :
            originToRegionRule._size ? originToRegionRule : distanceRangeRule._size ? distanceRangeRule : false;
    }


    async #GetRoute(routeOrigin, routeDestination) {
        const origin = routeOrigin == "Manaus - AM" ? "Belém - PA" : routeOrigin;
        const destination = routeDestination == "Manaus - AM" ? "Belém - PA" : routeDestination;

        const cacheKey = "route:" + origin + "_X_" + destination;
        const cachedRoute = await JSON.parse(await this.#client.get(cacheKey));

        return cachedRoute ? cachedRoute : await this.#GetRouteFromAPI(routeOrigin, routeDestination);
    }

    async #GetRouteFromAPI(origin, destination) {
        this.#SetQualpParams(origin, destination);
        const route = await this.#qualp.GetRoute();
        await this.#SaveRouteOnCache(route, origin, destination);

        return route;
    }

    async #SaveRouteOnCache(route, routeOrigin, routeDestination) {
        const origin = routeOrigin == "Manaus - AM" ? "Belém - PA" : routeOrigin;
        const destination = routeDestination == "Manaus - AM" ? "Belém - PA" : routeDestination;

        const cacheKey = "route:" + origin + "_X_" + destination;
        await this.#client.setEx(cacheKey, this.#GetSecondsToNextMonth(), JSON.stringify(route));
    }

    #SetQualpParams(routeOrigin, routeDestination) {
        const origin = routeOrigin == "Manaus - AM" ? "Belém - PA" : routeOrigin;
        const destination = routeDestination == "Manaus - AM" ? "Belém - PA" : routeDestination;
        this.#qualp.SetParams(origin, destination);
    }

    #CaculateTollsValue(route) {
        var tollsValue = 0;

        for(var i = 0; i < route.pedagios.length; i++) {
            tollsValue += route.pedagios[i].tarifa[JSON.stringify(this.#dataModel.numberOfAxles)];
        }

        return tollsValue ? parseFloat(tollsValue.toFixed(2)) : 0;
    }

    #PushRuleToArray(docs) {
        var freightRule = [];

        docs.forEach(doc => {
            let element = doc.data();
            element.id = doc.id;
            freightRule = element;
        });

        return freightRule;
    }

    #CalculateQuotation() {
        this.#dataModel.truckerValue = this.#dataModel.routeDistance * this.#dataModel.pricePerDistance;
        this.#dataModel.cartageValue = this.#dataModel.routeDistance * 0.8;
        this.#dataModel.insuranceValue = this.#dataModel.cargoPrice * 0.0007;
        this.#dataModel.hasOverweight = this.#dataModel.cargoWeight > 18000 ? true : false;
        this.#dataModel.overweightQuantity = this.#dataModel.hasOverweight ? this.#dataModel.cargoWeight - 18000 : 0;
        this.#dataModel.overweightValue = this.#dataModel.overweightQuantity * 200;
        this.#dataModel.hasFerry = this.#dataModel.originCity == "Manaus" || this.#dataModel.destinationCity == "Manaus" ? true : false;
        this.#dataModel.ferryValue = this.#dataModel.hasFerry ? 6156 : 0;
        this.#dataModel.pullValue = this.#dataModel.hasFerry ? 270 : 0;
        this.#dataModel.marineInsurance = this.#dataModel.hasFerry ? this.#dataModel.cargoPrice * 0.0005 : 0;
    }

    #GetQuotationData() {
        const data = {
            user: this.#dataModel.user,
            originState: this.#dataModel.originState,
            originCity: this.#dataModel.originCity,
            destinationState: this.#dataModel.destinationState,
            destinationCity: this.#dataModel.destinationCity,
            cargoPrice: this.#dataModel.cargoPrice,
            cargoWeight: this.#dataModel.cargoWeight,
            originStateUfCode: this.#dataModel.originStateUfCode,
            destinationStateUfCode: this.#dataModel.destinationStateUfCode,
            origin: this.#dataModel.origin,
            destination: this.#dataModel.destination,
            originRegion: this.#dataModel.originRegion,
            destinationRegion: this.#dataModel.destinationRegion,
            routeDistance: this.#dataModel.routeDistance,
            numberOfAxles: this.#dataModel.numberOfAxles,
            tollsValue: this.#dataModel.tollsValue,
            pricePerDistance: this.#dataModel.pricePerDistance,
            truckerValue: this.#dataModel.truckerValue,
            cartageValue: this.#dataModel.cartageValue,
            insuranceValue: this.#dataModel.insuranceValue,
            hasOverweight: this.#dataModel.hasOverweight,
            overweightQuantity: this.#dataModel.overweightQuantity,
            overweightValue: this.#dataModel.overweightValue,
            hasFerry: this.#dataModel.hasFerry,
            ferryValue: this.#dataModel.ferryValue,
            pullValue: this.#dataModel.pullValue,
            marineInsurance: this.#dataModel.marineInsurance,
            collectValue: this.#dataModel.collectValue,
            deliveryValue: this.#dataModel.deliveryValue,
            quotationCode: this.#CreateQuotationCode(),
            IcmsTax: this.#matrizICMS[this.#dataModel.originStateUfCode][this.#dataModel.destinationStateUfCode]
        }

        return data;
    }

    #SetQuotationData(data) {
        this.#dataModel.user = data.user;
        this.#dataModel.originState = data.originState;
        this.#dataModel.originCity = data.originCity;
        this.#dataModel.destinationState = data.destinationState;
        this.#dataModel.destinationCity = data.destinationCity;
        this.#dataModel.cargoPrice = parseFloat(data.cargoPrice.substring(3).replace(".", "").replace(",", "."));
        this.#dataModel.cargoWeight = parseInt(data.weight);
        this.#dataModel.originStateUfCode = this.#GetStateUfCode(this.#dataModel.originState);
        this.#dataModel.destinationStateUfCode = this.#GetStateUfCode(this.#dataModel.destinationState);
        this.#dataModel.originRegion = this.#GetStateURegion(this.#dataModel.originState);
        this.#dataModel.destinationRegion = this.#GetStateURegion(this.#dataModel.destinationState);
        this.#SetFormattedoriginAndDestination();
    }

    #GetStateUfCode(stateName) {
        return this.#states.filter((state) => {
            return state.nome == stateName;
        })[0].uf;
    }

    #GetStateURegion(stateName) {
        return this.#states.filter((state) => {
            return state.nome == stateName;
        })[0].regiao.toLowerCase();
    }

    #SetFormattedoriginAndDestination() {
        this.#dataModel.origin = this.#dataModel.originCity + " - " + this.#dataModel.originStateUfCode;
        this.#dataModel.destination = this.#dataModel.destinationCity + " - " + this.#dataModel.destinationStateUfCode;
    }

    #SetNumberOfAxles(freightRule) {
        this.#dataModel.numberOfAxles = freightRule.numberOfAxles;
    }

    #GetSecondsToNextMonth() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Calculate the first day of the next month
        const nextMonth = (currentMonth + 1) % 12;
        const nextYear = nextMonth === 0 ? currentYear + 1 : currentYear;
        const firstDayNextMonth = new Date(nextYear, nextMonth, 1);

        // Calculate the difference in milliseconds
        const diffInMillis = firstDayNextMonth - now;

        // Convert milliseconds to seconds
        const diffInSeconds = Math.floor(diffInMillis / 1000);

        return diffInSeconds;
    }

    async #CalculateCollectValue() {
        const collectData = await this.#GetCollectData();
        const freightRule = await this.#SetFreightRuleValues(collectData);
        const collectValue = collectData.routeDistance * freightRule.pricePerDistance + 0.8 * 2 * collectData.routeDistance + collectData.tolls;

        return collectValue;
    }

    async #CalculateDeliveryValue() {
        const deliveryData = await this.#GetDeliveryData();
        const freightRule = await this.#SetFreightRuleValues(deliveryData);
        const deliveryValue = deliveryData.routeDistance * freightRule.pricePerDistance;

        return deliveryValue;
    }

    async #GetCollectData() {
        const collectionBase = this.#refBaseColeta[this.#dataModel.originState];
        const route = await this.#GetRoute(collectionBase.base, this.#dataModel.origin);

        const data = {
            originState: collectionBase.state,
            originCity: collectionBase.city,
            destinationState: this.#dataModel.originState,
            destinationCity: this.#dataModel.originCity,
            cargoWeight: this.#dataModel.cargoWeight,
            origin: collectionBase.base,
            destination: this.#dataModel.origin,
            originRegion: collectionBase.region,
            destinationRegion: this.#dataModel.originRegion,
            routeDistance: route.distancia.valor,
            tolls: this.#CaculateTollsValue(route)
        }

        return data;
    }

    async #GetDeliveryData() {
        const deliveryBase = this.#refBaseColeta[this.#dataModel.destinationState];
        const route = await this.#GetRoute(deliveryBase.base, this.#dataModel.destination);

        const data = {
            originState: deliveryBase.state,
            originCity: deliveryBase.city,
            destinationState: this.#dataModel.destinationState,
            destinationCity: this.#dataModel.destinationCity,
            cargoWeight: this.#dataModel.cargoWeight,
            origin: deliveryBase.base,
            destination: this.#dataModel.destination,
            originRegion: deliveryBase.region,
            destinationRegion: this.#dataModel.destinationRegion,
            routeDistance: route.distancia.valor,
        }

        return data;
    }

    #CreateQuotationCode() {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = String(date.getFullYear()).substring(2);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        
        return day + month + year + hours + minutes + seconds;
    }

    get freightRule() {
        return this.#freightRule;
    }
    set freightRule(newValue) {
        this.#freightRule = newValue;
    }
}

class QuotationDataModel {
    #user;
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
    #originRegion
    #destinationRegion
    #origin;
    #destination;
    #route;
    #truckerValue;
    #cartageValue;
    #insuranceValue;
    #hasOverweight;
    #overweightQuantity;
    #overweightValue;
    #pricePerDistance;
    #hasFerry;
    #ferryValue;
    #pullValue;
    #marineInsurance;
    #IcmsTax;
    #collectValue;
    #deliveryValue;

    get user() {
        return this.#user;
    }
    set user(newValue) {
        this.#user = newValue;
    }

    get originState() {
        return this.#originState;
    }
    set originState(newValue) {
        this.#originState = newValue;
    }

    get originCity() {
        return this.#originCity;
    }
    set originCity(newValue) {
        this.#originCity = newValue;
    }

    get destinationState() {
        return this.#destinationState;
    }
    set destinationState(newValue) {
        this.#destinationState = newValue;
    }

    get destinationCity() {
        return this.#destinationCity;
    }
    set destinationCity(newValue) {
        this.#destinationCity = newValue;
    }

    get cargoPrice() {
        return this.#cargoPrice;
    }
    set cargoPrice(newValue) {
        this.#cargoPrice = newValue;
    }

    get cargoWeight() {
        return this.#cargoWeight;
    }
    set cargoWeight(newValue) {
        this.#cargoWeight = newValue;
    }

    get numberOfAxles() {
        return this.#numberOfAxles;
    }
    set numberOfAxles(newValue) {
        this.#numberOfAxles = newValue;
    }

    get routeDistance() {
        return this.#routeDistance;
    }
    set routeDistance(newValue) {
        this.#routeDistance = newValue;
    }

    get routeDuration() {
        return this.#routeDuration;
    }
    set routeDuration(newValue) {
        this.#routeDuration = newValue;
    }

    get tollsValue() {
        return this.#tollsValue;
    }
    set tollsValue(newValue) {
        this.#tollsValue = newValue;
    }

    get originStateUfCode() {
        return this.#originStateUfCode;
    }
    set originStateUfCode(newValue) {
        this.#originStateUfCode = newValue;
    }

    get destinationStateUfCode() {
        return this.#destinationStateUfCode;
    }
    set destinationStateUfCode(newValue) {
        this.#destinationStateUfCode = newValue;
    }

    get originRegion() {
        return this.#originRegion;
    }
    set originRegion(newValue) {
        this.#originRegion = newValue;
    }

    get destinationRegion() {
        return this.#destinationRegion;
    }
    set destinationRegion(newValue) {
        this.#destinationRegion = newValue;
    }

    get origin() {
        return this.#origin;
    }
    set origin(newValue) {
        this.#origin = newValue;
    }

    get destination() {
        return this.#destination;
    }
    set destination(newValue) {
        this.#destination = newValue;
    }

    get route() {
        return this.#route;
    }
    set route(newValue) {
        this.#route = newValue;
    }

    get pricePerDistance() {
        return this.#pricePerDistance;
    }
    set pricePerDistance(newValue) {
        this.#pricePerDistance = newValue;
    }

    get truckerValue() {
        return this.#truckerValue;
    }
    set truckerValue(newValue) {
        this.#truckerValue = newValue;
    }

    get cartageValue() {
        return this.#cartageValue;
    }
    set cartageValue(newValue) {
        this.#cartageValue = newValue;
    }

    get insuranceValue() {
        return this.#insuranceValue;
    }
    set insuranceValue(newValue) {
        this.#insuranceValue = newValue;
    }

    get hasOverweight() {
        return this.#hasOverweight;
    }
    set hasOverweight(newValue) {
        this.#hasOverweight = newValue;
    }

    get overweightQuantity() {
        return this.#overweightQuantity;
    }
    set overweightQuantity(newValue) {
        this.#overweightQuantity = newValue;
    }

    get overweightValue() {
        return this.#overweightValue;
    }
    set overweightValue(newValue) {
        this.#overweightValue = newValue;
    }

    get hasFerry() {
        return this.#hasFerry;
    }
    set hasFerry(newValue) {
        this.#hasFerry = newValue;
    }

    get ferryValue() {
        return this.#ferryValue;
    }
    set ferryValue(newValue) {
        this.#ferryValue = newValue;
    }

    get pullValue() {
        return this.#pullValue;
    }
    set pullValue(newValue) {
        this.#pullValue = newValue;
    }

    get marineInsurance() {
        return this.#marineInsurance;
    }
    set marineInsurance(newValue) {
        this.#marineInsurance = newValue;
    }

    get IcmsTax() {
        return this.#IcmsTax;
    }
    set IcmsTax(newValue) {
        this.#IcmsTax = newValue;
    }

    get collectValue() {
        return this.#collectValue;
    }
    set collectValue(newValue) {
        this.#collectValue = newValue;
    }

    get deliveryValue() {
        return this.#deliveryValue;
    }
    set deliveryValue(newValue) {
        this.#deliveryValue = newValue;
    }
}

module.exports = Quotation;