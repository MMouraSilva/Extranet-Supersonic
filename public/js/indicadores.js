var socket = io(frontendUrl);
var socketTimer = io(backendUrl);

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socketTimer.on("disconnect", () => {
    console.log("Desconectado");
});

socketTimer.on("getIndicador", (data) => {
    buildChartLine(data.indicadorRecebimento, 'recebimento', false, data.indicadorRecebimentoTipoProd);
    buildChartLine(data.indicadorSeparacao, 'separacao', false, data.indicadorSeparacaoTipoProd);
    buildChartLine(data.indicadorExpedicao, 'expedicao', false, data.indicadorExpedicaoTipoProd);
});

socketTimer.on("displayTimer", (data) => {
    var display = document.querySelector('#time');
    display.textContent = data.display;
    if (--data.timer < 0) {
    }
});

socketTimer.on("reloadData", () => {
    socketTimer.emit("reloadedData", { operation: "indicador" });
});

socketTimer.on("getReloadedIndicador", (data) => {
    buildChartLine(data.indicadorRecebimento, 'recebimento', true, data.indicadorRecebimentoTipoProd);
    buildChartLine(data.indicadorSeparacao, 'separacao', true, data.indicadorSeparacaoTipoProd);
    buildChartLine(data.indicadorExpedicao, 'expedicao', true, data.indicadorExpedicaoTipoProd);
});

function buildGraph(labels, data, avg, chart, isReload, knobData) {
    $(function () {
        var wasActive;

        if(isReload) {
            var tabName = chart + "-chart-tab";
            var chartTab = document.getElementById(tabName);
            if(!chartTab.classList.contains("active")) {
                chartTab.classList.add("active");
                wasActive = false;
            } else {
                wasActive = true;
            }
        }

        var label, avgLabel;

        if(chart == "recebimento") {
            label = "Recebidos";
            avgLabel = "Recebimento";
        } else if(chart == "separacao") {
            label = "Separados";
            avgLabel = "Separação";
        } else if(chart == "expedicao") {
            label = "Expedidos";
            avgLabel = "Expedição";
        }

        buildDonutGraph(knobData, chart, isReload);

        var knob = ".knob-" + chart;
        
        /* jQueryKnob */
        $(knob).knob({
            'format' : function (value) {
                return value + '%';
            }
        });

        /* Chart.js Charts */

        var chartName = "#" + chart + "-chart";
        
        // Sales graph chart
        var salesGraphChartCanvas = $(chartName).get(0).getContext('2d')
        
        var salesGraphChartData = {
            labels,
            datasets: [
                {
                    label: 'Produtos ' + label,
                    fill: false,
                    borderWidth: 3,
                    lineTension: 0,
                    spanGaps: true,
                    borderColor: '#fff',
                    pointRadius: 3,
                    pointHoverRadius: 7,
                    pointColor: '#fff',
                    pointBackgroundColor: '#fff',
                    data
                },
                {
                    label: 'Média ' + avgLabel,
                    fill: false,
                    borderWidth: 3,
                    lineTension: 0,
                    spanGaps: true,
                    borderColor: '#f5b400',
                    pointRadius: 1,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#f5b400',
                    data: avg
                }
            ]
        }
        
        var salesGraphChartOptions = {
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
        
        // This will get the first returned node in the jQuery collection.
        // eslint-disable-next-line no-unused-vars
        var salesGraphChart = new Chart(salesGraphChartCanvas, { // lgtm[js/unused-local-variable]
            type: 'line',
            data: salesGraphChartData,
            options: salesGraphChartOptions
        })

        if((chart == "separacao" || chart == "expedicao") && !isReload) {
            var tabName = chart + "-chart-tab";
            var chartTab = document.getElementById(tabName);
            chartTab.classList.remove("active");
        }

        if(!wasActive && isReload) {
            var tabName = chart + "-chart-tab";
            var chartTab = document.getElementById(tabName);
            chartTab.classList.remove("active");
        }
    })
}

function buildChartLine (indicadores, chart, isReload, knobData) {
    var graphLabels = [];
    var graphData = [];
    var graphAvg = [];
    var avg = 0;
    var startDateFilter = $('#daterange-btn').data('daterangepicker').startDate.format('YYYY-MM-DD');
    var endDateFilter = $('#daterange-btn').data('daterangepicker').endDate.format('YYYY-MM-DD');
    var qtdDias = 0;
    
    indicadores.forEach(indicador => {
        if(indicador.DATE_FILTER >= startDateFilter && indicador.DATE_FILTER <= endDateFilter) {
            graphLabels.push(indicador.DATA_REF);
            graphData.push(indicador.TOTAL_DIA);
            avg += parseInt(indicador.TOTAL_DIA);
            qtdDias++;
        }
    });
    
    avg = parseInt(avg / qtdDias);
    
    indicadores.forEach(indicador => {
        if(indicador.DATE_FILTER >= startDateFilter && indicador.DATE_FILTER <= endDateFilter) {
            graphAvg.push(avg);
        }
    });
    
    buildGraph(graphLabels, graphData, graphAvg, chart, isReload, knobData);
}

function buildDonutGraph(dados, operation, isReload) {
    var totalBanda = 0;
    var totalCoxim = 0;
    var totalCola = 0;
    var startDateFilter = $('#daterange-btn').data('daterangepicker').startDate.format('YYYY-MM-DD');
    var endDateFilter = $('#daterange-btn').data('daterangepicker').endDate.format('YYYY-MM-DD');

    dados.forEach(dado => {
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

    if(operation == "recebimento") {
        knobBandaId = "knobBandaRecebimento";
        knobCoximId = "knobCoximRecebimento";
        knobColaId = "knobColaRecebimento";
    } else if(operation == "separacao") {
        knobBandaId = "knobBandaSeparacao";
        knobCoximId = "knobCoximSeparacao";
        knobColaId = "knobColaSeparacao";
    } else if(operation == "expedicao") {
        knobBandaId = "knobBandaExpedicao";
        knobCoximId = "knobCoximExpedicao";
        knobColaId = "knobColaExpedicao";
    }

    if(isReload) {
        var knobBanda = "input." + knobBandaId;
        var knobCoxim = "input." + knobCoximId;
        var knobCola = "input." + knobColaId;

        $(knobBanda).val(Math.round(percentBandas));
        $(knobCoxim).val(Math.round(percentBandas));
        $(knobCola).val(Math.round(percentBandas));
        
        $("input.knob").trigger('change');
    } else {
        document.getElementById(knobBandaId).value=Math.round(percentBandas);
        document.getElementById(knobCoximId).value=Math.round(percentCoxim);
        document.getElementById(knobColaId).value=Math.round(percentCola);
    }
}

var start = moment().subtract(29, 'days');
var end = moment();

function cb(start, end) {
    $('#daterange-btn').html(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
    socketTimer.emit("reloadedData", { operation: "indicador" });
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