var socket = io(frontendUrl);
var date = new Date();
var rawTableData;

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socket.on("getMedicao", (data) => {
    cleanTable();
   
    rawTableData = data;
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let tableData = filterData(rawTableData, month, year);

    buildTable(tableData);
});

socket.on("displayTimer", (data) => {
    var display = document.querySelector('#time');
    display.textContent = data.display;
    if (--data.timer < 0) {
    }
});

socket.on("reloadData", () => {
    socket.emit("reloadedData", { operation: "indicador" });
});

function buildTable(data) {
    let tfootData = {
        totalRecebimentoAmount: 0,
        totalRecebimentoValue: 0,
        totalMedicaoAmount: 0,
        totalMedicaoValue: 0,
        totalExpedicaoAmount: 0,
        totalExpedicaoValue: 0
    };

    data.forEach(row => {
        addRowToTable(row);

        tfootData.totalRecebimentoAmount += row.rowRecebimento ? row.rowRecebimento.TOTAL_DIA : 0;
        tfootData.totalRecebimentoValue += row.rowRecebimento ? row.rowRecebimento.TOTAL_DIA * 2.46 : 0;
        tfootData.totalMedicaoAmount += row.rowMedicao.SALDO;
        tfootData.totalMedicaoValue += row.rowMedicao.VALOR;
        tfootData.totalExpedicaoAmount += row.rowExpedicao ? row.rowExpedicao.TOTAL_DIA : 0;
        tfootData.totalExpedicaoValue += row.rowExpedicao ? row.rowExpedicao.TOTAL_DIA * 2.952 : 0;
    });

    addTableFoot(tfootData);
    addTableTitle();
}

function addRowToTable(rowData) {
    if (rowData !== undefined) {
        const newRow = document.createElement("tr");

        const dayTd = document.createElement("td");
        const recebimentoAmountTd = document.createElement("td");
        const recebimentoValueTd = document.createElement("td");
        const armazenagemAmountTd = document.createElement("td");
        const armazenagemValueTd = document.createElement("td");
        const expedicaoAmountTd = document.createElement("td");
        const expedicaoValueTd = document.createElement("td");

        const day = document.createTextNode(rowData.rowMedicao.DAY);
        const recebimentoAmount = document.createTextNode(rowData.rowRecebimento ? rowData.rowRecebimento.TOTAL_DIA : 0);
        const recebimentoValue = document.createTextNode(rowData.rowRecebimento ? (rowData.rowRecebimento.TOTAL_DIA * 2.46).toLocaleString("pt-BR", { style: "currency", currency:"BRL" }) : "R$ 0,00");
        const armazenagemAmount = document.createTextNode(rowData.rowMedicao.SALDO);
        const armazenagemValue = document.createTextNode(rowData.rowMedicao.VALOR.toLocaleString("pt-BR", { style: "currency", currency:"BRL" }));
        const expedicaoAmount = document.createTextNode(rowData.rowExpedicao ? rowData.rowExpedicao.TOTAL_DIA : 0);
        const expedicaoValue = document.createTextNode(rowData.rowExpedicao ? (rowData.rowExpedicao.TOTAL_DIA * 2.952).toLocaleString("pt-BR", { style: "currency", currency:"BRL" }) : "R$ 0,00");

        dayTd.appendChild(day);
        newRow.appendChild(dayTd);

        recebimentoAmountTd.appendChild(recebimentoAmount);
        newRow.appendChild(recebimentoAmountTd);

        recebimentoValueTd.appendChild(recebimentoValue);
        newRow.appendChild(recebimentoValueTd);

        armazenagemAmountTd.appendChild(armazenagemAmount);
        newRow.appendChild(armazenagemAmountTd);

        armazenagemValueTd.appendChild(armazenagemValue);
        newRow.appendChild(armazenagemValueTd);

        expedicaoAmountTd.appendChild(expedicaoAmount);
        newRow.appendChild(expedicaoAmountTd);

        expedicaoValueTd.appendChild(expedicaoValue);
        newRow.appendChild(expedicaoValueTd);

        var tbody = document.getElementById("tableBody");
        tbody.appendChild(newRow);
    }
}

function addTableTitle() {
    let tableTitleElement = document.getElementById("tableTitle");
    let date = $("#monthYear").data("date");
    let tableTitleNode = document.createTextNode(date);
    tableTitleElement.appendChild(tableTitleNode);
}

function addTableFoot(footData) {
    if (footData !== undefined) {
        const newRow = document.createElement("tr");

        const dayTd = document.createElement("td");
        const totalRecebimentoAmountTd = document.createElement("td");
        const totalRecebimentoValueTd = document.createElement("td");
        const totalArmazenagemAmountTd = document.createElement("td");
        const totalArmazenagemValueTd = document.createElement("td");
        const totalExpedicaoAmountTd = document.createElement("td");
        const totalExpedicaoValueTd = document.createElement("td");

        const day = document.createTextNode("Total");
        const totalRecebimentoAmount = document.createTextNode(footData.totalRecebimentoAmount);
        const totalRecebimentoValue = document.createTextNode(footData.totalRecebimentoValue.toLocaleString("pt-BR", { style: "currency", currency:"BRL" }));
        const totalArmazenagemAmount = document.createTextNode(footData.totalMedicaoAmount);
        const totalArmazenagemValue = document.createTextNode(footData.totalMedicaoValue.toLocaleString("pt-BR", { style: "currency", currency:"BRL" }));
        const totalExpedicaoAmount = document.createTextNode(footData.totalExpedicaoAmount);
        const totalExpedicaoValue = document.createTextNode(footData.totalExpedicaoValue.toLocaleString("pt-BR", { style: "currency", currency:"BRL" }));

        dayTd.appendChild(day);
        newRow.appendChild(dayTd);

        totalRecebimentoAmountTd.appendChild(totalRecebimentoAmount);
        newRow.appendChild(totalRecebimentoAmountTd);

        totalRecebimentoValueTd.appendChild(totalRecebimentoValue);
        newRow.appendChild(totalRecebimentoValueTd);

        totalArmazenagemAmountTd.appendChild(totalArmazenagemAmount);
        newRow.appendChild(totalArmazenagemAmountTd);

        totalArmazenagemValueTd.appendChild(totalArmazenagemValue);
        newRow.appendChild(totalArmazenagemValueTd);

        totalExpedicaoAmountTd.appendChild(totalExpedicaoAmount);
        newRow.appendChild(totalExpedicaoAmountTd);

        totalExpedicaoValueTd.appendChild(totalExpedicaoValue);
        newRow.appendChild(totalExpedicaoValueTd);

        var tbody = document.getElementById("tableFoot");
        tbody.appendChild(newRow);

        let total = footData.totalRecebimentoValue + footData.totalMedicaoValue + footData.totalExpedicaoValue;
        let taxValue = (total / 0.95) - total;
        let totalWithTax = total + taxValue;

        let totalWithoutTaxElement = document.getElementById("totalWithoutTax");
        let taxValueElement = document.getElementById("taxValue");
        let totalWithTaxElement = document.getElementById("totalWithTax");

        let totalWithoutTaxNode = document.createTextNode(total.toLocaleString("pt-BR", { style: "currency", currency:"BRL" }));
        let taxValueNode = document.createTextNode(taxValue.toLocaleString("pt-BR", { style: "currency", currency:"BRL" }));
        let totalWithTaxNode = document.createTextNode(totalWithTax.toLocaleString("pt-BR", { style: "currency", currency:"BRL" }));


        totalWithoutTaxElement.appendChild(totalWithoutTaxNode);
        taxValueElement.appendChild(taxValueNode);
        totalWithTaxElement.appendChild(totalWithTaxNode);
    }
}

//Date picker
$("#monthYear").datetimepicker({
    format: "MMMM/YYYY",
    minDate: "2024-06-01",
    maxDate: date,
    locale: "pt-br",
    defaultDate: date
});

$("#monthYear").on("change.datetimepicker", (e) => {
    let date = new Date(e.date.format());

    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    cleanTable();
   
    let tableData = filterData(rawTableData, month, year);

    buildTable(tableData);
});

function cleanTable() {
    const table = document.getElementById("table");
    let tBody = document.getElementById("tableBody");
    tBody.remove();
    tBody = document.createElement("tbody");
    tBody.setAttribute("id", "tableBody");
    table.appendChild(tBody);
    let tFoot = document.getElementById("tableFoot");
    tFoot.remove();
    tFoot = document.createElement("tfoot");
    tFoot.setAttribute("id", "tableFoot");
    table.appendChild(tFoot);

    document.getElementById("tableTitle").innerHTML = "Medição operação logística Bandas - Bridgestone Campinas SP - ";
    document.getElementById("totalWithoutTax").innerHTML = "TOTAL SEM IMPOSTOS: ";
    document.getElementById("taxValue").innerHTML = "IMPOSTOS ISS - 5% : ";
    document.getElementById("totalWithTax").innerHTML = "TOTAL COM IMPOSTOS: ";
}



function filterData(data, month, year) {
    let lastDayDate = new Date(year, month, 0);
    let lastDay = lastDayDate.getDate()
    let tableData = [];
    
    for(let i = 1; (i < date.getDate() && (date.getMonth() + 1) == month) || (i <= lastDay && (date.getMonth() + 1) != month); i++) {
        let date = i + "-" + month + "-" + year;

        let rowRecebimento = filterRecebimento(data.indicadorRecebimento, date);
        let rowMedicao = filterMedicao(data.medicaoArmazenagem, date);
        let rowExpedicao = filterExpedicao(data.indicadorExpedicao, date);

        tableData.push({ rowRecebimento, rowMedicao, rowExpedicao });
    }

    return tableData;
}

function filterRecebimento(indicadorRecebimento, date) {
    return indicadorRecebimento.find(doc => {
        let docDate = new Date(doc.DATE_FILTER.replace("-", "/"));
        return docDate.getDate() + "-" + (docDate.getMonth() + 1) + "-" + docDate.getFullYear() == date;
    });
}

function filterMedicao(medicaoArmazenagem, date) {
    return medicaoArmazenagem.find(doc => (doc.DAY + "-" + doc.MONTH + "-" + doc.YEAR) == date);
}

function filterExpedicao(indicadorExpedicao, date) {
    return indicadorExpedicao.find(doc => {
        let docDate = new Date(doc.DATE_FILTER.replace("-", "/"));
        return docDate.getDate() + "-" + (docDate.getMonth() + 1) + "-" + docDate.getFullYear() == date;
    });
}