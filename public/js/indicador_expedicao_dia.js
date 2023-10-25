var socket = io(frontendUrl);

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socket.on("getExpedicaoDia", (data) => {
    dados = data.tabelaExpedicao;
    var clientes = [];
    let clientesFiltered = [];
    let tableArray = [];
    var totalBanda = 0;
    var totalCoxim = 0;
    var totalCola = 0;
    var totalProdutos = 0;

    const table = document.getElementById("table");
    var tBody = document.getElementById("tableBody");
    tBody.remove();
    tBody = document.createElement("tbody");
    tBody.setAttribute("id", "tableBody");
    table.appendChild(tBody);

    dados.forEach(dado => {
        clientes.push(dado.RAZSOC);
    });

    clientesFiltered = clientes.filter(function (v, i, self) {
        return i == self.indexOf(v);
    });

    clientesFiltered.forEach(cliente => {
        
        var notaFiscalArray = [];
        var notaFiscalFiltered = [];
        var notasFiscais = '';
        var qtdBanda = 0;
        var qtdCoxim = 0;
        var qtdCola = 0;
        var total = 0;

        dados.forEach(dado => {
            if(cliente == dado.RAZSOC) {
                notaFiscalArray.push(dado.NOTFIS);

                if(dado.TIPPRO == 'BANDA') {
                    qtdBanda += dado.TOTAL;
                } else if(dado.TIPPRO == 'COXIM') {
                    qtdCoxim += dado.TOTAL;
                } else if(dado.TIPPRO == 'COLA') {
                    qtdCola += dado.TOTAL;
                }
            }
        });

        notaFiscalFiltered = notaFiscalArray.filter(function (v, i, self) {
            return i == self.indexOf(v);
        });

        notaFiscalFiltered.forEach(function callback(nf, index) {
            if(index == notaFiscalFiltered.length - 1) {
                notasFiscais += nf;
            } else {
                notasFiscais += nf + '/';
            }
        });

        total = qtdBanda + qtdCoxim + qtdCola;

        var object = { "RAZSOC": cliente, "BANDA": qtdBanda, "COXIM": qtdCoxim, "COLA": qtdCola, "NOTFIS": notasFiscais, "TOTAL": total };

        tableArray.push(object);
    });

    tableArray.forEach(cliente => {
        totalBanda += cliente.BANDA;
        totalCoxim += cliente.COXIM;
        totalCola += cliente.COLA;
    });

    totalProdutos = totalBanda + totalCoxim + totalCola;

    tableArray.forEach(cliente => {
        const newRow = document.createElement("tr");

        const nfTd = document.createElement("td");
        const clienteTd = document.createElement("td");
        const bandasTd = document.createElement("td");
        const coximTd = document.createElement("td");
        const colaTd = document.createElement("td");
        const totalTd = document.createElement("td");

        nfTd.setAttribute("id", cliente.RAZSOC);
        nfTd.setAttribute("class", "text-center");

        clienteTd.setAttribute("id", cliente.RAZSOC);

        bandasTd.setAttribute("id", cliente.RAZSOC);
        bandasTd.setAttribute("class", "text-center");

        coximTd.setAttribute("id", cliente.RAZSOC);
        coximTd.setAttribute("class", "text-center");
        
        colaTd.setAttribute("id", cliente.RAZSOC);
        colaTd.setAttribute("class", "text-center");
        
        totalTd.setAttribute("id", cliente.RAZSOC);
        totalTd.setAttribute("class", "text-center font-weight-bold");

        const notfis = document.createTextNode(cliente.NOTFIS);
        const razsoc = document.createTextNode(cliente.RAZSOC);
        const banda = document.createTextNode(cliente.BANDA);
        const coxim = document.createTextNode(cliente.COXIM);
        const cola = document.createTextNode(cliente.COLA);
        const total = document.createTextNode(cliente.TOTAL);

        nfTd.appendChild(notfis); //adiciona o nó de texto à nova div criada
        newRow.appendChild(nfTd);

        clienteTd.appendChild(razsoc);
        newRow.appendChild(clienteTd);

        bandasTd.appendChild(banda);
        newRow.appendChild(bandasTd);

        coximTd.appendChild(coxim);
        newRow.appendChild(coximTd);

        colaTd.appendChild(cola);
        newRow.appendChild(colaTd);

        totalTd.appendChild(total);
        newRow.appendChild(totalTd);

        // adiciona o novo elemento criado e seu conteúdo ao DOM
        var tbody = document.getElementById("tableBody");
        tbody.appendChild(newRow);
    });

    document.getElementById("totalBanda").innerHTML = totalBanda;
    document.getElementById("totalCoxim").innerHTML = totalCoxim;
    document.getElementById("totalCola").innerHTML = totalCola;
    document.getElementById("total").innerHTML = totalProdutos;
});


var dateNow = new Date();
dateNow.setDate(dateNow.getDate() - 1);

dateFilter = dateNow.getFullYear() + '-' +
            ((dateNow.getMonth() + 1) < 10 ? '0' + (dateNow.getMonth() + 1) : (dateNow.getMonth() + 1)) + '-' +
            (dateNow.getDate() < 10 ? '0' + dateNow.getDate() : dateNow.getDate());

//Date picker
$('#reservationdate').datetimepicker({
    format: 'DD/MM/YYYY',
    locale: 'pt-br',
    defaultDate: dateNow
})

$("#reservationdate").on("change.datetimepicker", (e) => {
    date = $('#reservationdate').data('date');
    // console.log(date.getMonth()+1);

    var dateParts = date.split("/");

    dateFilter = dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0];
    // console.log(dateFilter);
    socket.emit("requireDashboardData", { operation: "expedicao-dia", dateFilter });
})