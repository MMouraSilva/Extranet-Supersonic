const express = require("express");
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const app = express();
const bodyParser = require("body-parser");
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e8
});

io.on("connection", (socket) => {
    socket.on("disconnect", () => {
        console.log("Desconectado: " + socket.id);
    });

    socket.on("requireDashboardData", (data) => {
        var operation = data.operation;

        if(data.dateFilter) {
            var dateFilter = data.dateFilter;
            io.emit("requireDashboardData", { operation, dateFilter });
        } else {
            io.emit("requireDashboardData", { operation });
        }
    });

    socket.on("displayTimer", (data) => {
        var display = data.display;
        var timer = data.timer;
        io.emit("displayTimer", { display, timer });
    });

    socket.on("reloadData", () => {
        io.emit("reloadData");
    });

    socket.on("reloadedData", (data) => {
        var operation = data.operation;
        io.emit("reloadedData", { operation });
    });
    

    // Sockets Recebimento
    socket.on("getRecebimento", (data) => {
        var recebimentos = data.recebimentos;
        io.emit("getRecebimento", { recebimentos });
    });
    
    socket.on("getReloadedRecebimento", (data) => {
        var recebimentos = data.recebimentos;
        io.emit("getReloadedRecebimento", { recebimentos });
    })


    // Sockets Venda
    socket.on("getVenda", (data) => {
        var vendas = data.vendas;
        io.emit("getVenda", { vendas });
    });
    
    socket.on("getReloadedVendas", (data) => {
        var vendas = data.vendas;
        io.emit("getReloadedVendas", { vendas });
    });


    // Sockets Venda Finalizada
    socket.on("getVendaFinalizada", (data) => {
        var vendasFinalizadas = data.vendasFinalizadas;
        io.emit("getVendaFinalizada", { vendasFinalizadas });
    });
    
    socket.on("getReloadedVendasFinalizada", (data) => {
        var vendasFinalizadas = data.vendasFinalizadas;
        io.emit("getReloadedVendasFinalizada", { vendasFinalizadas });
    });


    // Sockets Indicador
    socket.on("getIndicador", (data) => {
        var indicadorRecebimento = data.indicadorRecebimento;
        var indicadorSeparacao = data.indicadorSeparacao;
        var indicadorExpedicao = data.indicadorExpedicao;
        var indicadorRecebimentoTipoProd = data.indicadorRecebimentoTipoProd;
        var indicadorSeparacaoTipoProd = data.indicadorSeparacaoTipoProd;
        var indicadorExpedicaoTipoProd = data.indicadorExpedicaoTipoProd;
        io.emit("getIndicador", { indicadorRecebimento, indicadorSeparacao, indicadorExpedicao,
            indicadorRecebimentoTipoProd, indicadorSeparacaoTipoProd, indicadorExpedicaoTipoProd });
    });
    
    socket.on("getReloadedIndicador", (data) => {
        var indicadorRecebimento = data.indicadorRecebimento;
        var indicadorSeparacao = data.indicadorSeparacao;
        var indicadorExpedicao = data.indicadorExpedicao;
        var indicadorRecebimentoTipoProd = data.indicadorRecebimentoTipoProd;
        var indicadorSeparacaoTipoProd = data.indicadorSeparacaoTipoProd;
        var indicadorExpedicaoTipoProd = data.indicadorExpedicaoTipoProd;
        io.emit("getReloadedIndicador", { indicadorRecebimento, indicadorSeparacao, indicadorExpedicao,
            indicadorRecebimentoTipoProd, indicadorSeparacaoTipoProd, indicadorExpedicaoTipoProd });
    });


    // Sockets Igest
    socket.on("getIgest", (data) => {
        var kpiRecebimento = data.kpiRecebimento;
        var kpiVendas = data.kpiVendas;
        var kpiExpedicao = data.kpiExpedicao;
        io.emit("getIgest", { kpiRecebimento, kpiVendas, kpiExpedicao });
    });
    
    socket.on("getReloadedIgest", (data) => {
        var kpiRecebimento = data.kpiRecebimento;
        var kpiVendas = data.kpiVendas;
        var kpiExpedicao = data.kpiExpedicao;
        io.emit("getReloadedIgest", { kpiRecebimento, kpiVendas, kpiExpedicao });
    });


    // Sockets Expedição Dia
    socket.on("getExpedicaoDia", (data) => {
        var tabelaExpedicao = data.tabelaExpedicao;
        io.emit("getExpedicaoDia", { tabelaExpedicao })
    })
});



// Indicando para o Express utilizar o EJS como View Engine
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Importando Body Parser, lib para ler as informações enviadas pelo POST
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Rotas

app.get("/", async (req, res) => {
    try {
        res.render("index", { frontendUrl });
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/vendas", async (req, res) => {
    try {
        res.render("vendas", { frontendUrl, backendUrl });
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/vendas-finalizadas", async (req, res) => {
    try {
        res.render("vendas_finalizadas", { frontendUrl, backendUrl });
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/recebimento", async (req, res) => {
    try {
        res.render("recebimento", { frontendUrl, backendUrl });
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/indicadores", async (req, res) => {
    try {
        res.render("indicador", { frontendUrl, backendUrl });
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/indicadores/expedicao-cliente-dia", async (req, res) => {
    try {
        res.render("indicador_expedicao_dia", { frontendUrl, backendUrl });
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/indicadores/igest", async (req, res) => {
    try {
        res.render("igest", { frontendUrl, backendUrl });
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

http.listen(8080, () => {
    console.log("App rodando!");
});

