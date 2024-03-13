const Quotation = require("../models/Quotation");

test("O método deve calcular a distância entre dois municípios utilizando a API Qualp", async () => {
    const data = {
        originState: "São Paulo",
        originCity: "Campinas",
        destinationState: "Espírito Santo",
        destinationCity: "Viana"
    }

    const quotation = new Quotation(data);
    await quotation.SetRoute();
    quotation.SetRouteDistance();
    const routeDistance = quotation.GetRouteDistance();

    expect(routeDistance).toEqual(937);
});

test("O método deve calcular o valor dos pedágios que existem entre dois municípios utilizando a API Qualp", async () => {
    const data = {
        originState: "São Paulo",
        originCity: "Campinas",
        destinationState: "Espírito Santo",
        destinationCity: "Viana",
        axles: 4
    }

    const quotation = new Quotation(data);
    await quotation.SetRoute();
    quotation.SetTollsValue();
    const tollsValue = quotation.GetTollsValue();

    expect(tollsValue).toEqual(417.60);
});

test("O método deve calcular o valor do carreteiro de acordo com a tabela de preços", async () => {
    
});

test("O método deve calcular o valor a ser cobrado por sobrepeso", async () => {

});

test("O método deve calcular o valor do Seguro Rodoviário", async () => {

});

test("O método deve calcular o valor da movimentação vazia", async () => {

});

test("O método deve calcular o valor da coleta de acordo com a tabela de preços", async () => {

});

test("O método deve calcular o valor do custo da carreta", async () => {

});

test("O método deve calcular o valor da balsa", async () => {

});

