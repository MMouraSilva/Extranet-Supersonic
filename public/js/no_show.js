let socket = io(frontendUrl);
let dados;
let clientes = [];
let clientesFiltered = [];
let tableArray = [];
let totalProdutos = 0;
let totalDias = 0;
let diasNoShowPorCliente = [];
let noShowChart;

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socket.on("getNoShow", (data) => {
    dados = data.indicadorNoShow;
    buildGraphs();
});

function buildGraphs() {
    clearChartTable();
    getTableData();
    buildTable();

    buildBarChart();
}

function getTableData() {
    var startDateFilter = $('#daterange-btn').data('daterangepicker').startDate.format('YYYY-MM-DD');
    var endDateFilter = $('#daterange-btn').data('daterangepicker').endDate.format('YYYY-MM-DD');

    dados.forEach(dado => {
        if (startDateFilter <= dado.DATA_AGENDA && endDateFilter >= dado.DATA_AGENDA) {
            clientes.push(dado.RAZSOC);
        }
    });

    clientesFiltered = clientes.filter(function (v, i, self) {
        return i == self.indexOf(v);
    });

    clientesFiltered.forEach(cliente => {
        let notaFiscalArray = [];
        let notaFiscalFiltered = [];
        let notasFiscais = '';
        let total = 0;
        let totalDias = 0;

        dados.forEach(dado => {
            if (startDateFilter <= dado.DATA_AGENDA && endDateFilter >= dado.DATA_AGENDA) {
                if (cliente == dado.RAZSOC) {
                    notaFiscalArray.push(dado.NOTFIS);
                    totalDias += dado.DIAS_EM_NOSHOW;
                    total += dado.TOTAL_PRODUTOS;
                }
            }
        });

        notaFiscalFiltered = notaFiscalArray.filter(function (v, i, self) {
            return i == self.indexOf(v);
        });

        notaFiscalFiltered.forEach(function callback(nf, index) {
            if (index == notaFiscalFiltered.length - 1) {
                notasFiscais += nf ? nf : "NO SHOW ABERTO";
            } else {
                notasFiscais += (nf ? nf : "NO-SHOW ABERTO") + '/';
            }
        });

        var object = { "RAZSOC": cliente, "NOTFIS": notasFiscais, "TOTAL": total, "TOTAL_DIAS": totalDias };

        tableArray.push(object);
    });

    tableArray.sort((a, b) => b.TOTAL_DIAS - a.TOTAL_DIAS);
}

function splitClientes(cliente) {
    const clienteName = cliente.split(" ");

    return clienteName[0];
}

function buildTable() {
    const table = document.getElementById("table");
    let tBody = document.getElementById("tableBody");
    tBody.remove();
    tBody = document.createElement("tbody");
    tBody.setAttribute("id", "tableBody");
    table.appendChild(tBody);

    tableArray.forEach(cliente => {
        totalProdutos += cliente.TOTAL;
        totalDias += cliente.TOTAL_DIAS;
        diasNoShowPorCliente.push(cliente.TOTAL_DIAS);
    });

    tableArray.forEach(cliente => {
        const newRow = document.createElement("tr");

        const nfTd = document.createElement("td");
        const clienteTd = document.createElement("td");
        const totalTd = document.createElement("td");
        const totalDiasTd = document.createElement("td");

        nfTd.setAttribute("id", cliente.RAZSOC);
        nfTd.setAttribute("class", "text-center");

        clienteTd.setAttribute("id", cliente.RAZSOC);

        totalTd.setAttribute("id", cliente.RAZSOC);
        totalTd.setAttribute("class", "text-center font-weight-bold");

        totalDiasTd.setAttribute("id", cliente.RAZSOC);
        totalDiasTd.setAttribute("class", "text-center font-weight-bold");

        const notfis = document.createTextNode(cliente.NOTFIS);
        const razsoc = document.createTextNode(cliente.RAZSOC);
        const total = document.createTextNode(cliente.TOTAL);
        const totalDias = document.createTextNode(cliente.TOTAL_DIAS);

        nfTd.appendChild(notfis); //adiciona o nó de texto à nova div criada
        newRow.appendChild(nfTd);

        clienteTd.appendChild(razsoc);
        newRow.appendChild(clienteTd);

        totalTd.appendChild(total);
        newRow.appendChild(totalTd);

        totalDiasTd.appendChild(totalDias);
        newRow.appendChild(totalDiasTd);

        // adiciona o novo elemento criado e seu conteúdo ao DOM
        var tbody = document.getElementById("tableBody");
        tbody.appendChild(newRow);
    });

    document.getElementById("total").innerHTML = totalProdutos;
    document.getElementById("total-dias").innerHTML = totalDias;
}

function clearChartTable() {
    if(noShowChart) {
        noShowChart.destroy();
        clientes = [];
        clientesFiltered = [];
        tableArray = [];
        totalProdutos = 0;
        totalDias = 0;
        diasNoShowPorCliente = [];
    }
}

function buildBarChart() {
    "use strict"

    $("#date-range-indicator").html("Período: " + start.format("DD/MM/YYYY") + " - " + end.format("DD/MM/YYYY"));

    let clientes = []
    let data = [];

    tableArray.forEach(element => {
        clientes.push(splitClientes(element.RAZSOC));
        data.push(element.TOTAL_DIAS);
    });

    var ticksStyleX = {
        font: {
            weight: "bold"
        },
        maxRotation: 90,
        minRotation: 90
    }

    var ticksStyleY = {
        font: {
            weight: "bold"
        }
    }

    var $noShowChart = $('#no-show-chart');

    noShowChart = new Chart($noShowChart, {
        type: 'bar',
        data: {
            labels: clientes,
            datasets: [
                {
                    label: "Dias em No-Show",
                    backgroundColor: '#007bff',
                    borderColor: '#007bff',
                    data: data
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                yAxes: {
                    grid: {
                        display: false
                    },
                    ticks: $.extend({
                        beginAtZero: true,
                    }, ticksStyleY)
                },
                xAxes: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: ticksStyleX
                }
            },
            plugins: {
                datalabels: {
                    font: {
                        weight: 'bold'
                    },
                    anchor: 'end',
                    align: 'end'
                }
            }
        }
    });
}

var start = moment().subtract(6, 'days');
var end = moment();

function cb(start, end) {
    $('#daterange-btn').html(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
    buildGraphs();
}

//Date range as a button
$('#daterange-btn').daterangepicker(
    {
        ranges: {
            'Hoje': [moment(), moment()],
            'Ontem': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Últimos 7 Dias': [moment().subtract(6, 'days'), moment()],
            'Últimos 30 Dias': [moment().subtract(29, 'days'), moment()],
            'Este Mês': [moment().startOf('month'), moment().endOf('month')],
            'Último Mês': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        startDate: moment().subtract(6, 'days'),
        endDate: moment(),
        maxSpan: {
            days: 30
        },
        locale: {
            "format": "DD/MM/YYYY",
            "separator": " - ",
            "applyLabel": "Aplicar",
            "cancelLabel": "Cancelar",
            "fromLabel": "De",
            "toLabel": "Até",
            "customRangeLabel": "Custom",
            "daysOfWeek": [
                "Dom",
                "Seg",
                "Ter",
                "Qua",
                "Qui",
                "Sex",
                "Sáb"
            ],
            "monthNames": [
                "Janeiro",
                "Fevereiro",
                "Março",
                "Abril",
                "Maio",
                "Junho",
                "Julho",
                "Agosto",
                "Setembro",
                "Outubro",
                "Novembro",
                "Dezembro"
            ],
            "firstDay": 0
        }
    }, cb
);

$("#daterange-btn").html(start.format("DD/MM/YYYY") + " - " + end.format("DD/MM/YYYY"));