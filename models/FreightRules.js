const Firebase = require("./Firebase");
const ErrorHandler = require("./ErrorHandler");
const StatesArray = require("../public/plugins/municipios-brasileiros/estados.json");

class FreightRules {
    #firebaseFreightRule;
    
    constructor() {
        this.dataModel = new FreightRulesDataModel();
        this.#firebaseFreightRule = new FirabaseFreightRule();
        this.errorHandler = new ErrorHandler();
    }

    async GetFreightRules() {
        const { docs, error } = await this.#firebaseFreightRule.firebase.FirebaseGetDocs();
        if(error) this.errorHandler.HandleError(error);

        return docs;
    }

    async GetFreightRuleById(id) {
        const { doc, error } = await this.#firebaseFreightRule.firebase.FirebaseGetDocById(id);
        if(error) this.errorHandler.HandleError(error);

        return doc;
    }

    async CreateFreightRule() {
        const data = this.dataModel.GetFreightRule();
        const isFreightRuleValid = await this.#ValidateFreighRule(data, "create");
        const { hasSucceed, error, operation } = isFreightRuleValid ? await this.#firebaseFreightRule.firebase.FirebaseAddDoc(data) : { hasSucceed: false, error: false };

        return { hasSucceed, error, isFreightRuleValid, operation };
    }

    async UpdateFreightRule(id) {
        const data = this.#BuildObjectToUpdate();
        const isFreightRuleValid = await this.#ValidateFreighRule(await this.#GetDataToValidate(id), "update");
        const { hasSucceed, error, operation } =  isFreightRuleValid ? await this.#firebaseFreightRule.firebase.FirebaseUpdateDoc(id, data) : { hasSucceed: false, error: false };

        return { hasSucceed, error, isFreightRuleValid, operation };
    }

    async DeleteFreightRule(id) {
        return await this.#firebaseFreightRule.firebase.FirebaseDeleteDocById(id);
    }

    async GetOriginToDestinationRule(data) {
        let originToDestinationRule = await this.#firebaseFreightRule.GetRuleByExactOriginDestination(data);
        originToDestinationRule = originToDestinationRule._size ? originToDestinationRule : await this.#firebaseFreightRule.GetRuleByAnyDestination(data);
        originToDestinationRule = originToDestinationRule._size ? originToDestinationRule : await this.#firebaseFreightRule.GetRuleByAnyOrigin(data);
        originToDestinationRule = originToDestinationRule._size ? originToDestinationRule : await this.#firebaseFreightRule.GetRuleByAnyOriginDestination(data);
        originToDestinationRule = originToDestinationRule._size ? originToDestinationRule : await this.#firebaseFreightRule.GetRuleByExactOriginDestinationContrariwise(data);
        originToDestinationRule = originToDestinationRule._size ? originToDestinationRule : await this.#firebaseFreightRule.GetRuleByAnyDestinationContrariwise(data);
        originToDestinationRule = originToDestinationRule._size ? originToDestinationRule : await this.#firebaseFreightRule.GetRuleByAnyOriginContrariwise(data);
        originToDestinationRule = originToDestinationRule._size ? originToDestinationRule : await this.#firebaseFreightRule.GetRuleByAnyOriginDestinationContrariwise(data);

        return originToDestinationRule;
    }

    async GetOriginToRegionRule(data) {
        let originToRegionRule = await this.#firebaseFreightRule.GetRuleByExactOriginRegion(data);
        originToRegionRule = originToRegionRule._size ? originToRegionRule : await this.#firebaseFreightRule.GetRegionRuleByAnyOrigin(data);
        originToRegionRule = originToRegionRule._size ? originToRegionRule : await this.#firebaseFreightRule.GetRuleByExactOriginRegionContrariwise(data);
        originToRegionRule = originToRegionRule._size ? originToRegionRule : await this.#firebaseFreightRule.GetRegionRuleByAnyOriginContrariwise(data);

        return originToRegionRule;
    }

    async GetDistanceRangeRule(data) {
        let distanceRangeRule = await this.#firebaseFreightRule.GetRuleByDistanceRange(data);

        return distanceRangeRule;
    }

    async #GetDataToValidate(id) {
        const { doc, error } = await this.#firebaseFreightRule.firebase.FirebaseGetDocById(id);
        if(error) this.errorHandler.HandleError(error);
        
        return this.#BuildObjectToValidate(doc);
    }

    async #ValidateFreighRule(data, operation) {
        let isValid;

        switch (data.ruleType) {
            case "distance-range":
                isValid = await this.#ValidateDistanceRange(data, operation);
                break;
            case "source-to-destination":
                isValid = await this.#ValidateSourceToDestination(data, operation);
                break;
            case "source-to-region":
                isValid = await this.#ValidateSourceToRegion(data, operation);
                break;
            default:
                isValid = false;
        }

        return isValid;
    }

    async #ValidateDistanceRange(data, operation) {
        const isValid = await this.#IsDistanceRangeRuleUnique(data, operation)
            .catch((error) => this.errorHandler.HandleError(error));

        return isValid;
    }

    async #ValidateSourceToDestination(data, operation) {
        const isValid = await this.#IsSourceToDestinationRuleUnique(data, operation)
            .catch((error) => this.errorHandler.HandleError(error));

        return isValid;
    }

    async #ValidateSourceToRegion(data, operation) {
        const isValid = await this.#IsSourceToRegionRuleUnique(data, operation)
            .catch((error) => this.errorHandler.HandleError(error));

        return isValid;
    }

    async #IsDistanceRangeRuleUnique(data, operation) {
        const docs = await this.#firebaseFreightRule.GetConflictingDistanceRange(data);
        if(operation == "update") var duplicates = this.#CheckForDuplicates(docs, data.id);
        let size = docs._size - duplicates;

        return size ? false : true
    }

    async #IsSourceToDestinationRuleUnique(data, operation) {
        const docs = await this.#firebaseFreightRule.GetConflictingSourceToDestination(data);
        if(operation == "update") var duplicates = this.#CheckForDuplicates(docs, data.id);
        let size = docs._size - duplicates;

        return size ? false : true
    }

    async #IsSourceToRegionRuleUnique(data, operation) {
        const docs = await this.#firebaseFreightRule.GetConflictingSourceToRegion(data);
        if(operation == "update") var duplicates = this.#CheckForDuplicates(docs, data.id);
        let size = docs._size - duplicates;

        return size ? false : true
    }

    #CheckForDuplicates(docs, id) {
        let size = 0;
        docs.forEach((doc) => { size = doc.id == id ? size++ : size; });

        return size;
    }

    #BuildObjectToUpdate() {
        const dataToUpdate = {
            numberOfAxles: this.dataModel.numberOfAxles,
            minWeight: this.dataModel.minWeight,
            maxWeight: this.dataModel.maxWeight,
            pricePerDistance: this.dataModel.pricePerDistance,
            useInContrariwise: this.dataModel.useInContrariwise
        }

        return dataToUpdate;
    }

    #BuildObjectToValidate(data) {
        const dataToValidate = {
            id: data.id,
            ruleType: data.ruleType,
            minDistance: data.minDistance,
            maxDistance: data.maxDistance,
            originState: data.originState,
            destinationState: data.destinationState,
            originCity: data.originCity,
            destinationCity: data.destinationCity,
            destinationRegion: data.destinationRegion,
            numberOfAxles: this.dataModel.numberOfAxles,
            minWeight: this.dataModel.minWeight,
            maxWeight: this.dataModel.maxWeight,
            pricePerDistance: this.dataModel.pricePerDistance,
            useInContrariwise: this.dataModel.useInContrariwise,
            origin: data.originCity,
            destination: data.destinationCity
        }

        return dataToValidate;
    }
}

class FirabaseFreightRule {
    constructor() {
        this.firebase = new Firebase();
        this.firebase.collection = "freight_rules";
    }

    async GetConflictingSourceToRegion(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("numberOfAxles", "==", data.numberOfAxles)
            .where("originState", "==", data.originState)
            .where("originCity", "==", data.originCity)
            .where("destinationRegion", "==", data.destinationRegion)
            .where(
                this.firebase.Filter.or(
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minDistance", "<=", data.maxDistance),
                        this.firebase.Filter.where("maxDistance", ">=", data.minDistance)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minDistance", ">=", data.minDistance),
                        this.firebase.Filter.where("minDistance", "<=", data.maxDistance),
                        this.firebase.Filter.where("maxDistance", ">=", data.maxDistance)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minDistance", "<=", data.minDistance),
                        this.firebase.Filter.where("maxDistance", ">=", data.minDistance),
                        this.firebase.Filter.where("maxDistance", "<=", data.maxDistance)
                    )
                )
            )
            .where(
                this.firebase.Filter.or(
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minWeight", "<=", data.maxWeight),
                        this.firebase.Filter.where("maxWeight", ">=", data.minWeight)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minWeight", ">=", data.minWeight),
                        this.firebase.Filter.where("minWeight", "<=", data.maxWeight),
                        this.firebase.Filter.where("maxWeight", ">=", data.maxWeight)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minWeight", "<=", data.minWeight),
                        this.firebase.Filter.where("maxWeight", ">=", data.minWeight),
                        this.firebase.Filter.where("maxWeight", "<=", data.maxWeight)
                    )
                )
            )
        .get();

        return docs;
    }

    async GetConflictingSourceToDestination(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("numberOfAxles", "==", data.numberOfAxles)
            .where(
                this.firebase.Filter.or(
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("originState", "==", data.originState),
                        this.firebase.Filter.where("originCity", "==", data.originCity),
                        this.firebase.Filter.where("destinationState", "==", data.destinationState),
                        this.firebase.Filter.where("destinationCity", "==", data.destinationCity)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("originState", "==", data.destinationState),
                        this.firebase.Filter.where("originCity", "==", data.destinationCity),
                        this.firebase.Filter.where("destinationState", "==", data.originState),
                        this.firebase.Filter.where("destinationCity", "==", data.originCity),
                        this.firebase.Filter.where("useInContrariwise", "==", true)
                    )
                )
            )
            .where(
                this.firebase.Filter.or(
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minWeight", "<=", data.maxWeight),
                        this.firebase.Filter.where("maxWeight", ">=", data.minWeight)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minWeight", ">=", data.minWeight),
                        this.firebase.Filter.where("minWeight", "<=", data.maxWeight),
                        this.firebase.Filter.where("maxWeight", ">=", data.maxWeight)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minWeight", "<=", data.minWeight),
                        this.firebase.Filter.where("maxWeight", ">=", data.minWeight),
                        this.firebase.Filter.where("maxWeight", "<=", data.maxWeight)
                    )
                )
            )
        .get();

        return docs;
    }

    async GetConflictingDistanceRange(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("numberOfAxles", "==", data.numberOfAxles)
            .where(
                this.firebase.Filter.or(
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minDistance", "<=", data.maxDistance),
                        this.firebase.Filter.where("maxDistance", ">=", data.minDistance)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minDistance", ">=", data.minDistance),
                        this.firebase.Filter.where("minDistance", "<=", data.maxDistance),
                        this.firebase.Filter.where("maxDistance", ">=", data.maxDistance)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minDistance", "<=", data.minDistance),
                        this.firebase.Filter.where("maxDistance", ">=", data.minDistance),
                        this.firebase.Filter.where("maxDistance", "<=", data.maxDistance)
                    )
                )
            )
            .where(
                this.firebase.Filter.or(
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minWeight", "<=", data.maxWeight),
                        this.firebase.Filter.where("maxWeight", ">=", data.minWeight)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minWeight", ">=", data.minWeight),
                        this.firebase.Filter.where("minWeight", "<=", data.maxWeight),
                        this.firebase.Filter.where("maxWeight", ">=", data.maxWeight)
                    ),
                    this.firebase.Filter.and(
                        this.firebase.Filter.where("minWeight", "<=", data.minWeight),
                        this.firebase.Filter.where("maxWeight", ">=", data.minWeight),
                        this.firebase.Filter.where("maxWeight", "<=", data.maxWeight)
                    )
                )
            )
        .get();

        return docs;
    }

    async GetRuleByExactOriginDestination(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("origin", "==", data.origin)
            .where("destination", "==", data.destination)
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("ruleType", "==", "source-to-destination")
        .get();

        return docs;
    }

    async GetRuleByExactOriginDestinationContrariwise(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("origin", "==", data.destination)
            .where("destination", "==", data.origin)
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("useInContrariwise", "==", true)
            .where("ruleType", "==", "source-to-destination")
        .limit(1)
        .get();

        return docs;
    }

    async GetRuleByAnyDestination(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("origin", "==", data.origin)
            .where("destinationState", "==", data.destinationState)
            .where("destinationCity", "==", "Qualquer Cidade")
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("ruleType", "==", "source-to-destination")
        .limit(1)
        .get();

        return docs;
    }

    async GetRuleByAnyDestinationContrariwise(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("originState", "==", data.destinationState)
            .where("originCity", "==", "Qualquer Cidade")
            .where("destination", "==", data.origin)
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("useInContrariwise", "==", true)
            .where("ruleType", "==", "source-to-destination")
        .limit(1)
        .get();

        return docs;
    }

    async GetRuleByAnyOrigin(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("originState", "==", data.originState)
            .where("originCity", "==", "Qualquer Cidade")
            .where("destination", "==", data.destination)
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("ruleType", "==", "source-to-destination")
        .limit(1)
        .get();

        return docs;
    }

    async GetRuleByAnyOriginContrariwise(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("origin", "==", data.destination)
            .where("destinationState", "==", data.originState)
            .where("destinationCity", "==", "Qualquer Cidade")
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("useInContrariwise", "==", true)
            .where("ruleType", "==", "source-to-destination")
        .limit(1)
        .get();

        return docs;
    }

    async GetRuleByAnyOriginDestination(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("originState", "==", data.originState)
            .where("originCity", "==", "Qualquer Cidade")
            .where("destinationState", "==", data.destinationState)
            .where("destinationCity", "==", "Qualquer Cidade")
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("ruleType", "==", "source-to-destination")
        .limit(1)
        .get();

        return docs;
    }

    async GetRuleByAnyOriginDestinationContrariwise(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("originState", "==", data.destinationState)
            .where("originCity", "==", "Qualquer Cidade")
            .where("destinationState", "==", data.originState)
            .where("destinationCity", "==", "Qualquer Cidade")
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("useInContrariwise", "==", true)
            .where("ruleType", "==", "source-to-destination")
        .limit(1)
        .get();

        return docs;
    }

    async GetRuleByExactOriginRegion(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("origin", "==", data.origin)
            .where("destinationRegion", "==", data.destinationRegion)
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("minDistance", "<=", data.routeDistance)
            .where("maxDistance", ">=", data.routeDistance)
            .where("ruleType", "==", "source-to-region")
        .limit(1)
        .get();

        return docs;
    }

    async GetRuleByExactOriginRegionContrariwise(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("origin", "==", data.destination)
            .where("destinationRegion", "==", data.originRegion)
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("minDistance", "<=", data.routeDistance)
            .where("maxDistance", ">=", data.routeDistance)
            .where("useInContrariwise", "==", true)
            .where("ruleType", "==", "source-to-region")
        .limit(1)
        .get();

        return docs;
    }

    async GetRegionRuleByAnyOrigin(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("originState", "==", data.originState)
            .where("originCity", "==", "Qualquer Cidade")
            .where("destinationRegion", "==", data.destinationRegion)
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("minDistance", "<=", data.routeDistance)
            .where("maxDistance", ">=", data.routeDistance)
            .where("ruleType", "==", "source-to-region")
        .limit(1)
        .get();

        return docs;
    }

    async GetRegionRuleByAnyOriginContrariwise(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("originState", "==", data.destinationState)
            .where("originCity", "==", "Qualquer Cidade")
            .where("destinationRegion", "==", data.originRegion)
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("minDistance", "<=", data.routeDistance)
            .where("maxDistance", ">=", data.routeDistance)
            .where("useInContrariwise", "==", true)
            .where("ruleType", "==", "source-to-region")
        .limit(1)
        .get();

        return docs;
    }

    async GetRuleByDistanceRange(data) {
        const docs = await this.firebase.db.collection(this.firebase.collection)
            .where("minWeight", "<=", data.cargoWeight)
            .where("maxWeight", ">=", data.cargoWeight)
            .where("minDistance", "<=", data.routeDistance)
            .where("maxDistance", ">=", data.routeDistance)
            .where("ruleType", "==", "distance-range")
        .limit(1)
        .get();

        return docs;
    }
}

class FreightRulesDataModel {
    #ruleType;
    #minDistance;
    #maxDistance;
    #originState;
    #destinationState;
    #originCity;
    #destinationCity;
    #destinationRegion;
    #numberOfAxles;
    #minWeight;
    #maxWeight;
    #pricePerDistance;
    #useInContrariwise;
    #origin;
    #destination;

    GetFreightRule() {
        const data = {
            ruleType: this.ruleType,
            minDistance: this.minDistance,
            maxDistance: this.maxDistance,
            originState: this.originState,
            destinationState: this.destinationState,
            originCity: this.originCity,
            destinationCity: this.destinationCity,
            destinationRegion: this.destinationRegion,
            numberOfAxles: this.numberOfAxles,
            minWeight: this.minWeight,
            maxWeight: this.maxWeight,
            pricePerDistance: this.pricePerDistance,
            useInContrariwise: this.useInContrariwise,
            origin: this.origin,
            destination: this.destination
        }

        return data;
    }
    
    SetFreightRule(requisitionBody) {
        const data = this.#TreatRequisitionData(requisitionBody);
        this.ruleType = data.ruleType;
        this.minDistance = parseInt(data.minDistance);
        this.maxDistance = parseInt(data.maxDistance);
        this.originState = data.originState;
        this.destinationState = data.destinationState;
        this.originCity = data.originCity;
        this.destinationCity = data.destinationCity;
        this.destinationRegion = data.destinationRegion;
        this.numberOfAxles = parseInt(data.numberOfAxles);
        this.minWeight = parseInt(data.minWeight);
        this.maxWeight = parseInt(data.maxWeight);
        this.pricePerDistance = parseFloat(data.pricePerDistance.substring(3).replace(".", "").replace(",", "."));
        this.useInContrariwise = !!data.useInContrariwise;
        this.origin = data.origin;
        this.destination = data.destination;
    }

    #TreatRequisitionData(requisitionBody) {
        const data = {
            ruleType: requisitionBody.ruleType,
            minDistance: requisitionBody.minDistance ? requisitionBody.minDistance : 0,
            maxDistance: requisitionBody.maxDistance ? requisitionBody.maxDistance : 999999999999999,
            originState: requisitionBody.originState ? requisitionBody.originState : null,
            destinationState: requisitionBody.destinationState ? requisitionBody.destinationState : null,
            originCity: requisitionBody.originCity ? requisitionBody.originCity : null,
            destinationCity: requisitionBody.destinationCity ? requisitionBody.destinationCity : null,
            destinationRegion: requisitionBody.destinationRegion ? requisitionBody.destinationRegion : null,
            numberOfAxles: requisitionBody.numberOfAxles,
            minWeight: requisitionBody.minWeight ? requisitionBody.minWeight : 0,
            maxWeight: requisitionBody.maxWeight ? requisitionBody.maxWeight : (requisitionBody.minWeight && requisitionBody.maxWeight ? 0 : 999999999999999),
            pricePerDistance: requisitionBody.pricePerDistance,
            useInContrariwise: requisitionBody.useInContrariwise ? requisitionBody.useInContrariwise : false,
            origin: requisitionBody.originCity ? this.#ConcatenateCityState(requisitionBody.originCity, requisitionBody.originState) : null,
            destination: requisitionBody.destinationCity ? this.#ConcatenateCityState(requisitionBody.destinationCity, requisitionBody.destinationState) : null
        }

        return data;
    }

    #ConcatenateCityState(city, state) {
        const stateUf = this.#GetStateUfByName(state);
        
        return city + " - " + stateUf;
    }

    #GetStateUfByName(stateName) {
        const state = StatesArray.filter(
            function(StatesArray){ return StatesArray.nome == stateName }
        );

        return state[0].uf;
    }

    get ruleType() {
        return this.#ruleType;
    };
    set ruleType(newValue) {
        this.#ruleType = newValue;
    };

    get minDistance() {
        return this.#minDistance;
    };
    set minDistance(newValue) {
        this.#minDistance = newValue;
    };

    get maxDistance() {
        return this.#maxDistance;
    };
    set maxDistance(newValue) {
        this.#maxDistance = newValue;
    };

    get originState() {
        return this.#originState;
    };
    set originState(newValue) {
        this.#originState = newValue;
    };

    get destinationState() {
        return this.#destinationState;
    };
    set destinationState(newValue) {
        this.#destinationState = newValue;
    };

    get originCity() {
        return this.#originCity;
    };
    set originCity(newValue) {
        this.#originCity = newValue;
    };

    get destinationCity() {
        return this.#destinationCity;
    };
    set destinationCity(newValue) {
        this.#destinationCity = newValue;
    };

    get destinationRegion() {
        return this.#destinationRegion;
    };
    set destinationRegion(newValue) {
        this.#destinationRegion = newValue;
    };

    get numberOfAxles() {
        return this.#numberOfAxles;
    };
    set numberOfAxles(newValue) {
        this.#numberOfAxles = newValue;
    };

    get minWeight() {
        return this.#minWeight;
    };
    set minWeight(newValue) {
        this.#minWeight = newValue;
    };

    get maxWeight() {
        return this.#maxWeight;
    };
    set maxWeight(newValue) {
        this.#maxWeight = newValue;
    };

    get pricePerDistance() {
        return this.#pricePerDistance;
    };
    set pricePerDistance(newValue) {
        this.#pricePerDistance = newValue;
    };

    get useInContrariwise() {
        return this.#useInContrariwise;
    };
    set useInContrariwise(newValue) {
        this.#useInContrariwise = newValue;
    };

    get origin() {
        return this.#origin;
    };
    set origin(newValue) {
        this.#origin = newValue;
    };

    get destination() {
        return this.#destination;
    };
    set destination(newValue) {
        this.#destination = newValue;
    };
}

module.exports = FreightRules;