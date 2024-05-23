var socket = io(frontendUrl);

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socket.on("getIgest", (data) => {
    buildIgest(data, false);
});

socket.on("displayTimer", (data) => {
    var display = document.querySelector('#time');
    display.textContent = data.display;
    if (--data.timer < 0) {
    }
});

socket.on("reloadData", () => {
    socket.emit("reloadedData", { operation: "igest" });
});

socket.on("getReloadedIgest", (data) => {
    buildIgest(data, true);
});

function buildIgest(data, isReload) {
    var activeChart;
    var igestChart = document.getElementById("igest-chart-tab");
    var armazenagemChart = document.getElementById("armazenagem-chart-tab");

    if(isReload) {
        if(igestChart.classList.contains("active")) {
            activeChart = igestChart.id;
            armazenagemChart.classList.add("active");
        } else if(armazenagemChart.classList.contains("active")) {
            activeChart = armazenagemChart.id;
            igestChart.classList.add("active");
        }
    }

    buildArmazenagemGraph(data.indicadorArmazenagem);

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

    document.getElementById("knobAtendido").value=Math.round(percentualAtendido);

    /* jQueryKnob */
    $(".knob-atendido").knob({
        "format" : function (value) {
            return value + "%";
        }
    });

    $(".knob-atendido").val(Math.round(percentualAtendido));
        
    $("input.knob").trigger(
        "configure",
        {
            "fgColor": "#12E2AB",
            "readonly": true,
            "width": "110",
            "height": "110",
            "angleOffset": -125,
            "angleArc": 250
        }
    );

    $("input.knob").trigger("change");


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

    if(isReload && activeChart == "armazenagem-chart-tab") {
        igestChart.classList.remove("active");
    } else {
        armazenagemChart.classList.remove("active");
    }
}

function buildArmazenagemGraph(indicadorArmazenagem) {
    const totalProdutos = document.getElementById("totalProdutosUnidadePallet");
    const totalEnderecado = document.getElementById("totalEnderecado");
    const totalEnderecadoNivelUm = document.getElementById("totalEnderecadoNivelUm");
    const totalBlocado = document.getElementById("totalBlocado");
    const totalBloqueado = document.getElementById("totalBloqueado");
    const capacidadeUtilizada = document.getElementById("capacidadeUtilizada");
    
    let totalProdutosEnderecado = 0, totalPalletsEnderecado = 0, porcentagemEnderecado = 0;
    let totalProdutosEnderecadoNivelUm = 0, totalPalletsEnderecadoNivelUm = 0, porcentagemEnderecadoNivelUm = 0;
    let totalProdutosBlocado = 0, totalPalletsBlocado = 0, porcentagemBlocado = 0;
    let totalProdutosBloqueado = 0, totalPalletsBloqueado = 0, porcentagemBloqueado = 0;
    let porcentagemCapacidadeUtilizada = (indicadorArmazenagem[0].TOTAL_PALLETS * 100) / 2517;

    indicadorArmazenagem.forEach(data => {
        if(data.CODAAR == "ABL2" || data.CODAAT == "DVENT") {
            totalProdutosBloqueado += data.PRODUTOS_POR_LOCALIZACAO;
            totalPalletsBloqueado += data.PALLETS_POR_LOCALIZACAO;
            porcentagemBloqueado += data.PORCENTAGEM_PRODUTOS_POR_LOCALIZACAO;
        } else if(data.CODAAR == "AC2P") {
            if(data.PALLETS_POR_LOCALIZACAO >= 586) {
                totalProdutosEnderecadoNivelUm = 586 * 20;
                totalPalletsEnderecadoNivelUm = 586;
                porcentagemEnderecadoNivelUm += (totalProdutosEnderecadoNivelUm * data.PORCENTAGEM_PRODUTOS_POR_LOCALIZACAO) / data.PRODUTOS_POR_LOCALIZACAO;
                
                totalProdutosBlocado += data.PRODUTOS_POR_LOCALIZACAO - totalProdutosEnderecadoNivelUm;
                totalPalletsBlocado += data.PALLETS_POR_LOCALIZACAO - totalPalletsEnderecadoNivelUm;
                porcentagemBlocado += data.PORCENTAGEM_PRODUTOS_POR_LOCALIZACAO - porcentagemEnderecadoNivelUm;
            } else {
                totalProdutosEnderecadoNivelUm += data.PRODUTOS_POR_LOCALIZACAO;
                totalPalletsEnderecadoNivelUm += data.PALLETS_POR_LOCALIZACAO;
                porcentagemEnderecadoNivelUm += data.PORCENTAGEM_PRODUTOS_POR_LOCALIZACAO;
            }
        } else {
            totalProdutosEnderecado += data.PRODUTOS_POR_LOCALIZACAO;
            totalPalletsEnderecado += data.PALLETS_POR_LOCALIZACAO;
            porcentagemEnderecado += data.PORCENTAGEM_PRODUTOS_POR_LOCALIZACAO;
        }
    });

    totalProdutos.innerHTML = indicadorArmazenagem[0].TOTAL_PRODUTOS + " / " + indicadorArmazenagem[0].TOTAL_PALLETS;
    totalEnderecado.innerHTML = totalProdutosEnderecado + " / " + totalPalletsEnderecado;
    totalEnderecadoNivelUm.innerHTML = totalProdutosEnderecadoNivelUm + " / " + totalPalletsEnderecadoNivelUm;
    totalBlocado.innerHTML = totalProdutosBlocado + " / " + totalPalletsBlocado;
    totalBloqueado.innerHTML = totalProdutosBloqueado + " / " + totalPalletsBloqueado;
    capacidadeUtilizada.innerHTML = indicadorArmazenagem[0].TOTAL_PALLETS + " / 2517";

    document.getElementById("knobEnderecado").value=Math.round(porcentagemEnderecado);
    document.getElementById("knobEnderecadoNivelUm").value=Math.round(porcentagemEnderecadoNivelUm);
    document.getElementById("knobBlocado").value=Math.round(porcentagemBlocado);
    document.getElementById("knobBloqueado").value=Math.round(porcentagemBloqueado);
    document.getElementById("knobCapacidadeUtilizada").value=Math.round(porcentagemCapacidadeUtilizada);

    /* jQueryKnob */
    $(".knob-enderecado").knob({
        "format" : function (value) {
            return value + "%";
        }
    });
    $(".knob-enderecado-nivel-um").knob({
        "format" : function (value) {
            return value + "%";
        }
    });
    $(".knob-blocado").knob({
        "format" : function (value) {
            return value + "%";
        }
    });
    $(".knob-bloqueado").knob({
        "format" : function (value) {
            return value + "%";
        }
    });
    $(".knob-capacidade-utilizada").knob({
        "format" : function (value) {
            return value + "%";
        }
    });

    $(".knob-enderecado").val(Math.round(porcentagemEnderecado));
    $(".knob-enderecado-nivel-um").val(Math.round(porcentagemEnderecadoNivelUm));
    $(".knob-blocado").val(Math.round(porcentagemBlocado));
    $(".knob-bloqueado").val(Math.round(porcentagemBloqueado));
    $(".knob-capacidade-utilizada").val(Math.round(porcentagemCapacidadeUtilizada));

    $("input.knob-capacidade-utilizada").val(Math.round(porcentagemCapacidadeUtilizada)).trigger(
        "configure",
        {
            "min": 0,
            "max": Math.round(porcentagemCapacidadeUtilizada) > 100 ? Math.round(porcentagemCapacidadeUtilizada) : 100
        }
    );

    $("input.knob-capacidade-utilizada").val(Math.round(porcentagemCapacidadeUtilizada)).trigger("change");

    if(Math.round(porcentagemCapacidadeUtilizada) < 100) {
        var avisoCapacidade = document.getElementById("avisoCapacidade");
        avisoCapacidade.classList.add("d-none");
    }
}

function padWithLeadingZeros(num, totalLength) {
    return String(num).padStart(totalLength, '0');
}

var start = moment().subtract(29, "days");
var end = moment();

function cb(start, end) {
    $("#daterange-btn").html(start.format("DD/MM/YYYY") + ' - ' + end.format("DD/MM/YYYY"));
    socket.emit("reloadedData", { operation: "igest" });
}

//Date range as a button
$("#daterange-btn").daterangepicker(
    {
        ranges   : {
        "Hoje"           : [moment(), moment()],
        "Ontem"          : [moment().subtract(1, "days"), moment().subtract(1, "days")],
        "Últimos 7 Dias" : [moment().subtract(6, "days"), moment()],
        "Últimos 30 Dias": [moment().subtract(29, "days"), moment()],
        "Este Mês"       : [moment().startOf("month"), moment().endOf("month")],
        "Último Mês"     : [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")]
        },
        startDate: moment().subtract(29, "days"),
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

$("#daterange-btn").html(start.format("DD/MM/YYYY") + ' - ' + end.format("DD/MM/YYYY"));

$(".nav-item").on("click", function() { 
   console.log($(this).children().attr("href"));
});