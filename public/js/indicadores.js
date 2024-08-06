var socket = io(frontendUrl);
var recebimentoGraphChart, separacaoGraphChart, expedicaoGraphChart;

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socket.on("getIndicador", (data) => {
    buildChartLine(data, false);
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

socket.on("getReloadedIndicador", (data) => {
    buildChartLine(data, true);
});

function buildChartLine(data, isReload) {
    var graphLabels = [];
    var graphDataRecebimento = [];
    var graphDataExpedicao = [];
    var graphDataSeparacao = [];
    var startDateFilter = new Date($('#daterange-btn').data('daterangepicker').startDate.format('YYYY/MM/DD'));
    var endDateFilter = new Date($('#daterange-btn').data('daterangepicker').endDate.format('YYYY/MM/DD'));

    for(var dateToLabel = new Date(startDateFilter); dateToLabel <= endDateFilter; dateToLabel.setDate(dateToLabel.getDate() + 1)) {
        var dateLabel = getDateLabel(dateToLabel);
        graphLabels.push(dateLabel);

        const filter = getDateFilter(dateToLabel);

        const recebimento = data.indicadorRecebimento.find(indicador => {
            return indicador.DATE_FILTER == filter; 
        });
        graphDataRecebimento.push(recebimento ? recebimento.TOTAL_DIA : 0);

        const expedicao = data.indicadorExpedicao.find(indicador => {
            return indicador.DATE_FILTER == filter; 
        });
        graphDataExpedicao.push(expedicao ? expedicao.TOTAL_DIA : 0);

        const separacao = data.indicadorSeparacao.find(indicador => {
            return indicador.DATE_FILTER == filter; 
        });
        graphDataSeparacao.push(separacao ? separacao.TOTAL_DIA : 0);
        
    }
    
    buildGraph(graphLabels, graphDataRecebimento, graphDataExpedicao, graphDataSeparacao, data, isReload);
}

function buildGraph(labels, dataRecebimento, dataExpedicao, dataSeparacao, data, isReload) {
    $(function () {

        buildDonutGraph(data, isReload);

        var knob = ".knob-recebimento";
        
        /* jQueryKnob */
        $(knob).knob({
            'format' : function (value) {
                return value + '%';
            }
        });

        $("input.knob").trigger(
            "configure",
            {
                "fgColor": "#12E2AB",
                "readonly": true,
                "width": "100",
                "height": "100",
                "angleOffset": -125,
                "angleArc": 250
            }
        );

        $("input.knob").trigger('change');

        /* Chart.js Charts */

        var chartName = "#recebimento-chart";
        
        var graphChartCanvas = $(chartName).get(0).getContext('2d');
        
        var graphChartData = {
            labels,
            datasets: [
                {
                    label: "Produtos Recebimento",
                    fill: false,
                    borderWidth: 3,
                    lineTension: 0,
                    spanGaps: true,
                    borderColor: "#B4CDED",
                    pointRadius: 3,
                    pointHoverRadius: 7,
                    pointColor: "#B4CDED",
                    pointBackgroundColor: "#B4CDED",
                    data: dataRecebimento
                },
                {
                    label: "Produtos Expedição",
                    fill: false,
                    borderWidth: 3,
                    lineTension: 0,
                    spanGaps: true,
                    borderColor: "#E05263",
                    pointRadius: 3,
                    pointHoverRadius: 7,
                    pointColor: "#E05263",
                    pointBackgroundColor: "#E05263",
                    data: dataExpedicao
                },
                {
                    label: "Produtos Separação",
                    fill: false,
                    borderWidth: 3,
                    lineTension: 0,
                    spanGaps: true,
                    borderColor: "#26C485",
                    pointRadius: 3,
                    pointHoverRadius: 7,
                    pointColor: "#26C485",
                    pointBackgroundColor: "#26C485",
                    data: dataSeparacao
                },
            ]
        }
        
        var graphChartOptions = {
            maintainAspectRatio: false,
            responsive: true,
            legend: {
                display: true,
                labels: {
                    fontColor: '#fff'
                }
            },
            scales: {
                xAxes: [{
                    ticks: {
                        fontColor: '#fff'
                    },
                    gridLines: {
                        display: false,
                        color: '#fff',
                        drawBorder: false
                    }
                }],
                yAxes: [{
                    ticks: {
                        stepSize: 500,
                        beginAtZero: true,
                        fontColor: '#fff'
                    },
                    gridLines: {
                        display: false,
                        color: '#fff',
                        drawBorder: false
                    }
                }]
            }
        }
        
        if(recebimentoGraphChart) {
            recebimentoGraphChart.destroy();
        }

        recebimentoGraphChart = new Chart(graphChartCanvas, {
            type: 'line',
            data: graphChartData,
            options: graphChartOptions
        });
    })
}

function buildDonutGraph(data, isReload) {
    var totalBanda = 0;
    var totalCoxim = 0;
    var totalCola = 0;
    var startDateFilter = $('#daterange-btn').data('daterangepicker').startDate.format('YYYY-MM-DD');
    var endDateFilter = $('#daterange-btn').data('daterangepicker').endDate.format('YYYY-MM-DD');

    data.indicadorRecebimentoTipoProd.forEach(dado => {
        if(dado.DATA_REF >= startDateFilter && dado.DATA_REF <= endDateFilter) {
            if(dado.TIPPRO == "BANDA") {
                totalBanda += parseInt(dado.TOTAL);
            }

            if(dado.TIPPRO == "COXIM") {
                totalCoxim += parseInt(dado.TOTAL);
            }

            if(dado.TIPPRO == "COLA") {
                totalCola += parseInt(dado.TOTAL);
            }
        }
    });

    data.indicadorExpedicaoTipoProd.forEach(dado => {
        if(dado.DATA_REF >= startDateFilter && dado.DATA_REF <= endDateFilter) {
            if(dado.TIPPRO == "BANDA") {
                totalBanda += parseInt(dado.TOTAL);
            }

            if(dado.TIPPRO == "COXIM") {
                totalCoxim += parseInt(dado.TOTAL);
            }

            if(dado.TIPPRO == "COLA") {
                totalCola += parseInt(dado.TOTAL);
            }
        }
    });

    data.indicadorSeparacaoTipoProd.forEach(dado => {
        if(dado.DATA_REF >= startDateFilter && dado.DATA_REF <= endDateFilter) {
            if(dado.TIPPRO == "BANDA") {
                totalBanda += parseInt(dado.TOTAL);
            }

            if(dado.TIPPRO == "COXIM") {
                totalCoxim += parseInt(dado.TOTAL);
            }

            if(dado.TIPPRO == "COLA") {
                totalCola += parseInt(dado.TOTAL);
            }
        }
    });

    var totalProdutos = totalBanda + totalCoxim + totalCola;

    var percentBandas = (totalBanda * 100) / totalProdutos;
    var percentCoxim = (totalCoxim * 100) / totalProdutos;
    var percentCola = (totalCola * 100) / totalProdutos;

    var knobBandaId, knobCoximId, knobColaId;

    knobBandaId = "knobBandaRecebimento";
    knobCoximId = "knobCoximRecebimento";
    knobColaId = "knobColaRecebimento";

    if(isReload) {
        var knobBanda = "input." + knobBandaId;
        var knobCoxim = "input." + knobCoximId;
        var knobCola = "input." + knobColaId;

        $(knobBanda).val(Math.round(percentBandas));
        $(knobCoxim).val(Math.round(percentBandas));
        $(knobCola).val(Math.round(percentBandas));
    } else {
        document.getElementById(knobBandaId).value=Math.round(percentBandas);
        document.getElementById(knobCoximId).value=Math.round(percentCoxim);
        document.getElementById(knobColaId).value=Math.round(percentCola);
    }
}

function getDateLabel(date) {
    var day = String(date.getDate()).padStart(2, "0");
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var year = date.getFullYear();

    return day + "/" + month + "/" + year;
}

function getDateFilter(date) {
    var day = String(date.getDate()).padStart(2, "0");
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var year = date.getFullYear();

    return year + "-" + month + "-" + day;
}

var start = moment().subtract(29, 'days');
var end = moment();

function cb(start, end) {
    $('#daterange-btn').html(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
    socket.emit("reloadedData", { operation: "indicador" });
}

//Date range as a button
$('#daterange-btn').daterangepicker(
    {
        ranges   : {
        'Hoje'           : [moment(), moment()],
        'Ontem'          : [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Últimos 7 Dias' : [moment().subtract(6, 'days'), moment()],
        'Últimos 30 Dias': [moment().subtract(29, 'days'), moment()],
        'Este Mês'       : [moment().startOf('month'), moment().endOf('month')],
        'Último Mês'     : [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        startDate: moment().subtract(29, 'days'),
        endDate  : moment(),
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

$('#daterange-btn').html(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));

$('.nav-item').on('click', function() { 
   console.log($(this).children().attr('href'));
});