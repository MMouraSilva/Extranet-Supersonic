var socket = io(frontendUrl);

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socket.on("getVenda", (data) => {
    var vendas = data.vendas;

    vendas.forEach(venda => {
        adcElemento(venda);
    });
});

socket.on("getVendaFinalizada", (data) => {
    var vendas = data.vendasFinalizadas;

    vendas.forEach(venda => {
        adcElemento(venda);
    });
});

socket.on("displayTimer", (data) => {
    var display = document.querySelector('#time');
    display.textContent = data.display;
    if (--data.timer < 0) {
    }
})

socket.on("reloadData", () => {
    if(tipo == "V") {
        socket.emit("reloadedData", { operation: "venda" });
    } else if(tipo == "F") {
        socket.emit("reloadedData", { operation: "venda-finalizada" });
    }
});

socket.on("getReloadedVendas", (data) => {
    var vendas = data.vendas;
    reloadVendas(vendas);
});

socket.on("getReloadedVendasFinalizada", (data) => {
    var vendas = data.vendasFinalizadas;
    reloadVendas(vendas);
});

function reloadVendas(vendas) {
    const table = document.getElementById("table");
    var tBody = document.getElementById("tableBody");
    tBody.remove();
    tBody = document.createElement("tbody");
    tBody.setAttribute("id", "tableBody");
    table.appendChild(tBody);

    vendas.forEach(venda => {
        adcElemento(venda);
    });
}

function adcElemento(conteudo, page) {
    // cria um novo elemento div
    // e dá à ele conteúdo
    if (conteudo !== undefined) {
        const newRow = document.createElement("tr");

        if (conteudo.LEITURA == "SEPARAÇÃO") {
            newRow.setAttribute("style", "background-color: #A4C2F4 ");
        } else if (conteudo.LEITURA == "2º LEITURA") {
            newRow.setAttribute("style", "background-color: #FFE599 ");
        } else if (conteudo.LEITURA == "M51 PENDENTE") {
            newRow.setAttribute("style", "background-color: #FF9900 ");
        }

        const clienteTd = document.createElement("td");
        const remessaTd = document.createElement("td");
        const pedidoTd = document.createElement("td");
        const osTd = document.createElement("td");
        const statusTd = document.createElement("td");
        const materialTd = document.createElement("td");
        const totalTd = document.createElement("td");
        const qtdateTd = document.createElement("td");
        const dtpedTd = document.createElement("td");
        const dtageTd = document.createElement("td");

        clienteTd.setAttribute("id", conteudo.PEDIDO);
        remessaTd.setAttribute("id", conteudo.PEDIDO);
        pedidoTd.setAttribute("id", conteudo.PEDIDO);
        osTd.setAttribute("id", conteudo.PEDIDO);
        statusTd.setAttribute("id", conteudo.PEDIDO);
        materialTd.setAttribute("id", conteudo.PEDIDO);
        totalTd.setAttribute("id", conteudo.PEDIDO);
        qtdateTd.setAttribute("id", conteudo.PEDIDO);
        dtpedTd.setAttribute("id", conteudo.PEDIDO);
        dtageTd.setAttribute("id", conteudo.PEDIDO);

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


        if (conteudo.AG_BDG == "AGUARDANDO") {
            var dateAge = conteudo.AG_BDG;
        } else {
            var dateAge = new Date(conteudo.AG_BDG);

            var dayAge = dateAge.getDate();
            var monthAge = dateAge.getMonth();
            var yearAge = dateAge.getFullYear();
            var hours = dateAge.getHours();
            var minutes = dateAge.getMinutes();
            monthAge = monthAge + 1;

            if (hours < 10) {
                hours = '0' + hours;
            }
    
            if (minutes < 10) {
                minutes = '0' + minutes;
            }

            if (dayAge < 10) {
                dayAge = '0' + dayAge;
            }
    
            if (monthAge < 10) {
                monthAge = `0${monthAge}`;
            }
            var time = hours + ":" + minutes;
            dateAge = dayAge + "/" + monthAge + "/" + yearAge + " " + time;
        }

        const cliente = document.createTextNode(conteudo.RAZSOC);
        const remessa = document.createTextNode(conteudo.CLIPED);
        const pedido = document.createTextNode(conteudo.PEDIDO);
        const os = document.createTextNode(conteudo.OS);
        const status = document.createTextNode(conteudo.LEITURA);
        const material = document.createTextNode(conteudo.MATERIAL);
        const total = document.createTextNode(conteudo.TTPED);
        const qtdate = document.createTextNode(conteudo.TTATE);
        const dtped = document.createTextNode(datePed);
        const dtage = document.createTextNode(dateAge);


        clienteTd.appendChild(cliente); //adiciona o nó de texto à nova div criada
        newRow.appendChild(clienteTd);

        remessaTd.appendChild(remessa);
        newRow.appendChild(remessaTd);

        pedidoTd.appendChild(pedido);
        newRow.appendChild(pedidoTd);

        osTd.appendChild(os);
        newRow.appendChild(osTd);

        statusTd.appendChild(status);
        newRow.appendChild(statusTd);

        materialTd.appendChild(material);
        newRow.appendChild(materialTd);

        totalTd.appendChild(total);
        newRow.appendChild(totalTd);

        qtdateTd.appendChild(qtdate);
        newRow.appendChild(qtdateTd);

        dtpedTd.appendChild(dtped);
        newRow.appendChild(dtpedTd);

        if (tipo !== "F") {
            dtageTd.appendChild(dtage);
            newRow.appendChild(dtageTd);
        }

        // adiciona o novo elemento criado e seu conteúdo ao DOM
        var tbody = document.getElementById("tableBody");
        tbody.appendChild(newRow);
    }
}