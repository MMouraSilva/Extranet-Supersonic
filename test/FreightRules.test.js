const FreightRules = require("../models/FreightRules");

test("O método deve cadastrar a regra de frete do tipo Faixa de Km", async () => {
    data = {
        ruleType: "distance-range",
        minDistance: 850,
        maxDistance: 1000,
        originState: null,
        destinationState: null,
        originCity: null,
        destinationCity: null,
        destinationRegion: null,
        numberOfAxles: 5,
        minWeight: 15,
        maxWeight: 20,
        pricePerDistance: 2.76,
        useInContrariwise: true
    }

    // data = {
    //     ruleType: "source-to-region",
    //     minDistance: 750,
    //     maxDistance: 800,
    //     originState: "São Paulo",
    //     destinationState: null,
    //     originCity: "Campinas",
    //     destinationCity: null,
    //     destinationRegion: "Norte",
    //     numberOfAxles: 6,
    //     minWeight: 15,
    //     maxWeight: 20,
    //     pricePerDistance: 2.76,
    //     useInContrariwise: false
    // }

    // data = {
    //     ruleType: "source-to-destination",
    //     minDistance: null,
    //     maxDistance: null,
    //     originState: "São Paulo",
    //     destinationState: "São Paulo",
    //     originCity: "Campinas",
    //     destinationCity: "Santos",
    //     destinationRegion: null,
    //     numberOfAxles: 10,
    //     minWeight: 15,
    //     maxWeight: 20,
    //     pricePerDistance: 2.76,
    //     useInContrariwise: false
    // }

    const freightRules = new FreightRules();
    freightRules.dataModel.SetFreightRule(data);
    const createResponse = await freightRules.CreateFreightRule();

    expect(createResponse.hasSucceed).toEqual(true);
});

test("O método deve resgatar a regra de frete", async () => {

});

test("O método deve atualizar a regra de frete", async () => {

});

test("O método deve deletar a regra de frete", async () => {

});