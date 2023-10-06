var socket = io(frontendUrl);
var socketTimer = io(backendUrl);

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socketTimer.on("disconnect", () => {
    console.log("Desconectado");
});

socketTimer.on("getRecebimento", (data) => {
    var recebimentos = data.recebimentos;

    recebimentos.forEach(recebimento => {
        adcElemento(recebimento);
    });
});

socketTimer.on("displayTimer", (data) => {
    var display = document.querySelector('#time');
    display.textContent = data.display;
    if (--data.timer < 0) {
    }
})

socketTimer.on("reloadData", () => {
    socketTimer.emit("reloadedData", { operation: "recebimento" });
});

socketTimer.on("getReloadedRecebimento", (data) => {
    var recebimentos = data.recebimentos;

    const table = document.getElementById("table");
    var tBody = document.getElementById("tableBody");
    tBody.remove();
    tBody = document.createElement("tbody");
    tBody.setAttribute("id", "tableBody");
    table.appendChild(tBody);

    recebimentos.forEach(recebimento => {
        adcElemento(recebimento);
    });
})

function adcElemento(conteudo, page) {
    // cria um novo elemento div
    // e dá à ele conteúdo
    if (conteudo !== undefined) {
        const newRow = document.createElement("tr");

        if (conteudo.STATUS == "EM CONFERÊNCIA") {
            newRow.setAttribute("style", "background-color: #FFE599 ");
        } else if (conteudo.STATUS == "CONFERÊNCIA FINALIZADA") {
            newRow.setAttribute("style", "background-color: #FF9900 ");
        } else if (conteudo.STATUS == "CONSOLIDADO") {
            newRow.setAttribute("style", "background-color: #93C47D ");
        } else if (conteudo.STATUS == "AGUARDANDO CONFERÊNCIA") {
            newRow.setAttribute("style", "background-color: #A4C2F4 ");
        }

        const numdocTd = document.createElement("td");
        const pedidoTd = document.createElement("td");
        const codosaTd = document.createElement("td");
        const documentalTd = document.createElement("td");
        const fisicaTd = document.createElement("td");
        const statusTd = document.createElement("td");
        const totalProdTd = document.createElement("td");
        const totalConfeTd = document.createElement("td");
        const datpedTd = document.createElement("td");

        numdocTd.setAttribute("id", conteudo.PEDIDO);
        pedidoTd.setAttribute("id", conteudo.PEDIDO);
        codosaTd.setAttribute("id", conteudo.PEDIDO);
        documentalTd.setAttribute("id", conteudo.PEDIDO);
        fisicaTd.setAttribute("id", conteudo.PEDIDO);
        statusTd.setAttribute("id", conteudo.PEDIDO);
        totalProdTd.setAttribute("id", conteudo.PEDIDO);
        totalConfeTd.setAttribute("id", conteudo.PEDIDO);
        datpedTd.setAttribute("id", conteudo.PEDIDO);

        var datePed = new Date(conteudo.DATPED);
        datePed = new Date(datePed.toISOString().slice(0, -1));
        
        var dayPed = datePed.getDate();
        var monthPed = datePed.getMonth();
        var yearPed = datePed.getFullYear();

        monthPed = monthPed + 1;

        if (dayPed < 10) {
            dayPed = '0' + dayPed;
        }

        if (monthPed < 10) {
            monthPed = `0${monthPed}`;
        }

        datePed = dayPed + "/" + monthPed + "/" + yearPed;

        var total_confe = conteudo.TOTAL_CONFE == '' || conteudo.TOTAL_CONFE == null ? 0 : conteudo.TOTAL_CONFE;

        const numdoc = document.createTextNode(conteudo.NUMDOC);
        const pedido = document.createTextNode(conteudo.PEDIDO);
        const codosa = document.createTextNode(conteudo.CODOSA);
        const documental = document.createTextNode(conteudo.DOCUMENTAL);
        const fisica = document.createTextNode(conteudo.FISICA);
        const status = document.createTextNode(conteudo.STATUS);
        const totalProd = document.createTextNode(conteudo.TOTAL_PROD);
        const totalConfe = document.createTextNode(total_confe);
        const datped = document.createTextNode(datePed);

        numdocTd.appendChild(numdoc); //adiciona o nó de texto à nova div criada
        newRow.appendChild(numdocTd);

        pedidoTd.appendChild(pedido);
        newRow.appendChild(pedidoTd);

        codosaTd.appendChild(codosa);
        newRow.appendChild(codosaTd);

        documentalTd.appendChild(documental);
        newRow.appendChild(documentalTd);

        fisicaTd.appendChild(fisica);
        newRow.appendChild(fisicaTd);

        statusTd.appendChild(status);
        newRow.appendChild(statusTd);

        totalProdTd.appendChild(totalProd);
        newRow.appendChild(totalProdTd);

        totalConfeTd.appendChild(totalConfe);
        newRow.appendChild(totalConfeTd);

        datpedTd.appendChild(datped);
        newRow.appendChild(datpedTd);

        // adiciona o novo elemento criado e seu conteúdo ao DOM
        var tbody = document.getElementById("tableBody");
        tbody.appendChild(newRow);
    }
}