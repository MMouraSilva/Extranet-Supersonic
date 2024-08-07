var socket = io(frontendUrl);
var curvaABCChart;
var indicadorCurvaABCQuadrimestre;
var indicadorCurvaABCBimestre;
var indicadorCurvaABCMes; 
var labels = [0];
var datasetClassA = [0], datasetClassB = [0], datasetClassC = [0];

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socket.on("getCurvaABC", (data) => {
    indicadorCurvaABCQuadrimestre = data.indicadorCurvaABCQuadrimestre;
    indicadorCurvaABCBimestre = data.indicadorCurvaABCBimestre;
    indicadorCurvaABCMes = data.indicadorCurvaABCMes;
    buildGraph();
});

socket.on("displayTimer", (data) => {
    var display = document.querySelector("#time");
    display.textContent = data.display;
    if (--data.timer < 0) {
    }
});

socket.on("reloadData", () => {
    socket.emit("reloadedData", { operation: "curva-abc" });
});

function buildGraph() {
    clearChart();
    cleanTable();

    const startDate = new Date($('#daterange-btn').data('daterangepicker').startDate.format('YYYY/MM/DD'));
    const endDate = new Date($('#daterange-btn').data('daterangepicker').endDate.format('YYYY/MM/DD'));
    const monthDiffSelector = monthDiff(startDate, endDate);

    const graphData = monthDiffSelector == 4 ? indicadorCurvaABCQuadrimestre : monthDiffSelector == 2 ? indicadorCurvaABCBimestre : monthDiffSelector == 1 ? indicadorCurvaABCMes : 0;

    getChartData(graphData);
    buildAreaLineChart();
    buildTable(graphData);
}

function getChartData(data) {
    data.forEach(data => {
        labels.push(data.ACUMULADO_SKU);
        if(data.PORCENTAGEM_SKUS <= 20) {
            datasetClassA.push(data.REPRESENTATIVIDADE_ACUMULADA);
            datasetClassB.push(undefined);
            datasetClassC.push(undefined);
        } else if(data.PORCENTAGEM_SKUS > 20 && data.PORCENTAGEM_SKUS < 21) {
            datasetClassA.push(data.REPRESENTATIVIDADE_ACUMULADA);
            datasetClassB.push(data.REPRESENTATIVIDADE_ACUMULADA);
            datasetClassC.push(undefined);
        }

        if(data.PORCENTAGEM_SKUS >= 21 && data.PORCENTAGEM_SKUS <= 50) {
            datasetClassB.push(data.REPRESENTATIVIDADE_ACUMULADA);
            datasetClassC.push(undefined);
        } else if (data.PORCENTAGEM_SKUS >= 50 && data.PORCENTAGEM_SKUS <= 51) {
            datasetClassB.push(data.REPRESENTATIVIDADE_ACUMULADA);
            datasetClassC.push(data.REPRESENTATIVIDADE_ACUMULADA);
        }

        if(data.PORCENTAGEM_SKUS > 51) {
            datasetClassC.push(data.REPRESENTATIVIDADE_ACUMULADA);
        }
    });
}

function buildAreaLineChart() {
    var $curvaABCChart = $("#curva-abc-chart").get(0).getContext("2d");
    
    curvaABCChart = new Chart($curvaABCChart, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Classe A",
                    backgroundColor: "#1F9D96",
                    borderColor: "#1F9D96",
                    pointRadius: false,
                    fill: true,
                    data: datasetClassA
                },
                {
                    label: "Classe B",
                    backgroundColor: "#27CFC7",
                    borderColor: "#27CFC7",
                    pointRadius: false,
                    fill: true,
                    data: datasetClassB
                },
                {
                    label: "Classe C",
                    backgroundColor: "#2BF3E9",
                    borderColor: "#2BF3E9",
                    pointRadius: false,
                    fill: true,
                    data: datasetClassC
                },
            ]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                yAxes: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        callback: function(value, index, ticks) {
                            return value + "%";
                        }
                    },
                    // title: {
                    //     display: true,
                    //     text: "Representatividade de Venda Acumulada",
                    //     font: {
                    //         size: 16
                    //     }
                    // }
                },
                xAxes: {
                    grid: {
                        display: false
                    },
                    // title: {
                    //     display: true,
                    //     text: "QTD. de SKU's",
                    //     font: {
                    //         size: 16
                    //     }
                    // }
                }
            },
            interaction: {
                mode: "nearest",
                axis: "x",
                intersect: false
            }
        },
        plugins: [{
            id: 'customLabels',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
    
                const datasets = chart.data.datasets;
    
                datasets.forEach((dataset, index) => {
                    const label = dataset.label;
                    const text = label.substr(label.length - 1);
                    const percent = text == "A" ? "20%" : text == "B" ? "30%" : text == "C" ? "50%" : null;
    
                    const width = chart.width;
                    const positionX = text == "A" ? width * 0.13 : text == "B" ? width * 0.36 : text == "C" ? width * 0.75 : null;
    
                    
                    ctx.fillStyle = "white";
                    ctx.font = "bold 50px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(text, positionX, 340);
                    ctx.fillText(percent, positionX, 420);
                });
    
                ctx.restore();
            }
        }]
    });
}

function buildTable(data) {
    data.forEach(row => {
        addRowToTable(row);
    });
}

function addRowToTable(rowData) {
    if (rowData !== undefined) {
        const newRow = document.createElement("tr");

        const skuTd = document.createElement("td");
        const qtdVendidaTd = document.createElement("td");
        const representatividadeQtdVendaTd = document.createElement("td");
        const representatividadeAcumuladaTd = document.createElement("td");
        const representatividadeSkuTd = document.createElement("td");
        const classificacaoTd = document.createElement("td");

        const sku = document.createTextNode(rowData.REFERE);
        const qtdVendida = document.createTextNode(rowData.QUANTI_VENDIDA);
        const representatividadeQtdVenda = document.createTextNode(Number((rowData.REPRESENTATIVIDADE_PRODUTO / 100)).toLocaleString(undefined, { style: "percent", minimumFractionDigits: 2 }));
        const representatividadeAcumulada = document.createTextNode(Number((rowData.REPRESENTATIVIDADE_ACUMULADA / 100)).toLocaleString(undefined, { style: "percent", minimumFractionDigits: 2 }));
        const representatividadeSku = document.createTextNode(Number((rowData.PORCENTAGEM_SKUS / 100)).toLocaleString(undefined, { style: "percent", minimumFractionDigits: 2 }));
        const classificacao = document.createTextNode(rowData.CLASSIFICACAO_ABC);

        skuTd.appendChild(sku);
        newRow.appendChild(skuTd);

        qtdVendidaTd.appendChild(qtdVendida);
        newRow.appendChild(qtdVendidaTd);

        representatividadeQtdVendaTd.appendChild(representatividadeQtdVenda);
        newRow.appendChild(representatividadeQtdVendaTd);

        representatividadeAcumuladaTd.appendChild(representatividadeAcumulada);
        newRow.appendChild(representatividadeAcumuladaTd);

        representatividadeSkuTd.appendChild(representatividadeSku);
        newRow.appendChild(representatividadeSkuTd);

        classificacaoTd.appendChild(classificacao);
        newRow.appendChild(classificacaoTd);

        var tbody = document.getElementById("tableBody");
        tbody.appendChild(newRow);
    }
}

function clearChart() {
    if(curvaABCChart) {
        curvaABCChart.destroy();
        labels = [0];
        datasetClassA = [0], datasetClassB = [0], datasetClassC = [0];
    }
}

function cleanTable() {
    const table = document.getElementById("table");
    let tBody = document.getElementById("tableBody");
    tBody.remove();
    tBody = document.createElement("tbody");
    tBody.setAttribute("id", "tableBody");
    table.appendChild(tBody);
}

function monthDiff(startDate, endDate) {
    let months;

    months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth();
    months += endDate.getMonth();

    return months <= 0 ? 0 : months;
}

var start = moment().subtract(29, "days");
var end = moment();

function cb(start, end) {
    $("#daterange-btn").html(start.format("DD/MM/YYYY") + " - " + end.format("DD/MM/YYYY"));
    socket.emit("reloadedData", { operation: "curva-abc" });
}

//Date range as a button
$("#daterange-btn").daterangepicker(
    {
        ranges: {
            "Quadrimestre": [moment().subtract(4, "month"), moment()],
            "Bimestre": [moment().subtract(2, "month"), moment()],
            "Mês": [moment().subtract(1, "month"), moment()],
        },
        startDate: moment().subtract(4, "month"),
        endDate: moment(),
        showCustomRangeLabel: false,
    }, cb
);

$("#daterange-btn").html(start.format("DD/MM/YYYY") + " - " + end.format("DD/MM/YYYY"));

$(".nav-item").on("click", function () {
    console.log($(this).children().attr("href"));
});