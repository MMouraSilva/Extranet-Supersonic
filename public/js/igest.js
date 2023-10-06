var socket = io(frontendUrl);
var socketTimer = io(backendUrl);

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socketTimer.on("disconnect", () => {
    console.log("Desconectado");
});

socketTimer.on("getIndicador", (data) => {
    buildIgest(data);
});

socketTimer.on("displayTimer", (data) => {
    var display = document.querySelector('#time');
    display.textContent = data.display;
    if (--data.timer < 0) {
    }
});

socketTimer.on("reloadData", () => {
    socketTimer.emit("reloadedData", { operation: "igest" });
});

socketTimer.on("getReloadedIndicador", (data) => {
    buildIgest(data);
});

function buildIgest(data) {
    var recebimentos = data.kpiRecebimento;
    var vendas = data.kpiVendas;
    var expedicoes = data.kpiExpedicao;

    var octm41;
    var avgM41 = 0;
    var startDateFilter = $('#daterange-btn').data('daterangepicker').startDate.format('YYYY-MM-DD');
    var endDateFilter = $('#daterange-btn').data('daterangepicker').endDate.format('YYYY-MM-DD');
    var qtdDocsM41 = 0;
    var octm51;
    var avgM51 = 0;
    var qtdDocsM51 = 0;

    var maiorOctM41 = 0, menorOctM41 = 999999999999999;
    var qtdMaiorM41, qtdMenorM41;

    var maiorOctM51 = 0, menorOctM51 = 999999999999999;
    var qtdMaiorM51, qtdMenorM51;

    var totalRecebimento = 0, totalSeparacao = 0, totalExpedicao = 0;
    var totalTTPED = 0, totalTTATE = 0, percentualAtendido;
        
    recebimentos.forEach(recebimento => {
        if(recebimento.DATA_REF >= startDateFilter && recebimento.DATA_REF <= endDateFilter) {
            avgM41 += parseInt(recebimento.OCTM41);
            qtdDocsM41++;

            if(recebimento.OCTM41 >= maiorOctM41) {
                maiorOctM41 = recebimento.OCTM41;
                qtdMaiorM41 = recebimento.TOTAL_PROD
            }

            if(recebimento.OCTM41 <= menorOctM41) {
                menorOctM41 = recebimento.OCTM41;
                qtdMenorM41 = recebimento.TOTAL_PROD
            }

            totalRecebimento += recebimento.TOTAL_PROD;
        }
    });

    var maiorTempoRecElement = document.getElementById("maiorTempoRec");
    var maiorTempoM41Hours =  padWithLeadingZeros(parseInt(maiorOctM41 / 60), 2);
    var maiorTempoM41Minutes = padWithLeadingZeros(parseInt(maiorOctM41 - (parseInt(maiorOctM41 / 60) * 60)), 2);
    maiorTempoRecElement.innerHTML = maiorTempoM41Hours + ":" + maiorTempoM41Minutes + " / " + qtdMaiorM41

    var menorTempoRecElement = document.getElementById("menorTempoRec");
    var menorTempoM41Hours =  padWithLeadingZeros(parseInt(menorOctM41 / 60), 2);
    var menorTempoM41Minutes = padWithLeadingZeros(parseInt(menorOctM41 - (parseInt(menorOctM41 / 60) * 60)), 2);
    menorTempoRecElement.innerHTML = menorTempoM41Hours + ":" + menorTempoM41Minutes + " / " + qtdMenorM41

    var totalRecElement = document.getElementById("totalRec");
    totalRecElement.innerHTML = totalRecebimento;

    vendas.forEach(venda => {
        if(venda.DATA_REF >= startDateFilter && venda.DATA_REF <= endDateFilter) {
            avgM51 += parseInt(venda.OCTM51);
            qtdDocsM51++;
            if(venda.OCTM51 >= maiorOctM51) {
                maiorOctM51 = venda.OCTM51;
                qtdMaiorM51 = venda.TTPED
            }
    
            if(venda.OCTM51 <= menorOctM51) {
                menorOctM51 = venda.OCTM51;
                qtdMenorM51 = venda.TTPED
            }
    
            totalSeparacao += venda.TTATE;

            totalTTATE += venda.TTATE;
            totalTTPED += venda.TTPED;
        }
    });

    percentualAtendido = (totalTTATE * 100) / totalTTPED;

    document.getElementById('knobAtendido').value=Math.round(percentualAtendido);

    /* jQueryKnob */
    $('.knob-atendido').knob({
        'format' : function (value) {
            return value + '%';
        }
    });

    $('.knob-atendido').val(Math.round(percentualAtendido));
        
    $("input.knob").trigger('change');

    var maiorTempoSepElement = document.getElementById("maiorTempoSep");
    var maiorTempoM51Hours =  padWithLeadingZeros(parseInt(maiorOctM51 / 60), 2);
    var maiorTempoM51Minutes = padWithLeadingZeros(parseInt(maiorOctM51 - (parseInt(maiorOctM51 / 60) * 60)), 2);
    maiorTempoSepElement.innerHTML = maiorTempoM51Hours + ":" + maiorTempoM51Minutes + " / " + qtdMaiorM51

    var menorTempoElement = document.getElementById("menorTempoSep");
    var menorTempoM51Hours =  padWithLeadingZeros(parseInt(menorOctM51 / 60), 2);
    var menorTempoM51Minutes = padWithLeadingZeros(parseInt(menorOctM51 - (parseInt(menorOctM51 / 60) * 60)), 2);
    menorTempoElement.innerHTML = menorTempoM51Hours + ":" + menorTempoM51Minutes + " / " + qtdMenorM51

    var totalSepElement = document.getElementById("totalSep");
    totalSepElement.innerHTML = totalSeparacao;

    octm41 = avgM41 / qtdDocsM41
    var octm41Element = document.getElementById("OCTM41");
    var octm41Hours =  padWithLeadingZeros(parseInt(octm41 / 60), 2);
    var octm41Minutes = padWithLeadingZeros(parseInt(octm41 - (parseInt(octm41 / 60) * 60)), 2);
    octm41Element.innerHTML = octm41Hours + ":" + octm41Minutes;
    
    octm51 = avgM51 / qtdDocsM51
    var octm51Element = document.getElementById("OCTM51");
    var octm51Hours =  padWithLeadingZeros(parseInt(octm51 / 60), 2);
    var octm51Minutes = padWithLeadingZeros(parseInt(octm51 - (parseInt(octm51 / 60) * 60)), 2);
    octm51Element.innerHTML = octm51Hours + ":" + octm51Minutes;

    expedicoes.forEach(expedicao => {
        if(expedicao.DATA_REF >= startDateFilter && expedicao.DATA_REF <= endDateFilter) {
            totalExpedicao += expedicao.TOTAL;
        }
    });

    var totalExpElement = document.getElementById("totalExp");
    totalExpElement.innerHTML = totalExpedicao;
}

function padWithLeadingZeros(num, totalLength) {
    return String(num).padStart(totalLength, '0');
}

var start = moment().subtract(29, 'days');
var end = moment();

function cb(start, end) {
    $('#daterange-btn').html(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
    socketTimer.emit("reloadedData", { operation: "igest" });
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