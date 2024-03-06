const express = require("express");
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const app = express();
const bodyParser = require("body-parser");
const http = require("http").createServer(app);
const session = require("express-session");
const moment = require("moment");
const io = require("socket.io")(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    maxHttpBufferSize: 1e8
});
const userAccess = require("./middlewares/userAccess");

const vendasController = require("./controllers/vendas");
const indicadoresController = require("./controllers/indicadores");
const usersController = require("./controllers/users");
const pagesController = require("./controllers/pages");
const profilesController = require("./controllers/profiles");

var recebimentos;
var vendas;
var vendasFinalizadas;
var indicadorRecebimento;
var indicadorSeparacao;
var indicadorExpedicao;
var indicadorRecebimentoTipoProd;
var indicadorSeparacaoTipoProd;
var indicadorExpedicaoTipoProd;
var kpiRecebimento;
var kpiVendas;
var kpiExpedicao;

io.on("connection", (socket) => {
    var socketId = socket.id;

    socket.on("disconnect", () => {
        console.log("Desconectado: " + socket.id);
    });

    socket.on("requireDashboardData", (data) => {
        var operation = data.operation;

        if (data.operation == "recebimento") {
            socket.emit("getRecebimento", { recebimentos });
        } else if (data.operation == "venda") {
            socket.emit("getVenda", { vendas });
        } else if (data.operation == "venda-finalizada") {
            socket.emit("getVendaFinalizada", { vendasFinalizadas });
        } else if (data.operation == "indicador") {
            socket.emit("getIndicador", {
                indicadorRecebimento, indicadorSeparacao, indicadorExpedicao,
                indicadorRecebimentoTipoProd, indicadorSeparacaoTipoProd, indicadorExpedicaoTipoProd
            });
        } else if (data.operation == "igest") {
            socket.emit("getIgest", { kpiRecebimento, kpiVendas, kpiExpedicao });
        } else if (data.operation == "expedicao-dia") {
            var dateFilter = data.dateFilter;
            io.emit("requireDashboardData", { operation, dateFilter, socketId });
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
        if (data.operation == "recebimento") {
            socket.emit("getReloadedRecebimento", { recebimentos });
        } else if (data.operation == "venda") {
            socket.emit("getReloadedVendas", { vendas });
        } else if (data.operation == "venda-finalizada") {
            socket.emit("getReloadedVendasFinalizada", { vendasFinalizadas });
        } else if (data.operation == "indicador") {
            socket.emit("getReloadedIndicador", {
                indicadorRecebimento, indicadorSeparacao, indicadorExpedicao,
                indicadorRecebimentoTipoProd, indicadorSeparacaoTipoProd, indicadorExpedicaoTipoProd
            });
        } else if (data.operation == "igest") {
            socket.emit("getReloadedIgest", { kpiRecebimento, kpiVendas, kpiExpedicao });
        }
    });


    // Sockets Recebimento
    socket.on("getRecebimento", (data) => {
        recebimentos = data.recebimentos;
    });

    // Sockets Venda
    socket.on("getVenda", (data) => {
        vendas = data.vendas;
    });

    // Sockets Venda Finalizada
    socket.on("getVendaFinalizada", (data) => {
        vendasFinalizadas = data.vendasFinalizadas;
    });

    // Sockets Indicador
    socket.on("getIndicador", (data) => {
        indicadorRecebimento = data.indicadorRecebimento;
        indicadorSeparacao = data.indicadorSeparacao;
        indicadorExpedicao = data.indicadorExpedicao;
        indicadorRecebimentoTipoProd = data.indicadorRecebimentoTipoProd;
        indicadorSeparacaoTipoProd = data.indicadorSeparacaoTipoProd;
        indicadorExpedicaoTipoProd = data.indicadorExpedicaoTipoProd;
    });

    // Sockets Igest
    socket.on("getIgest", (data) => {
        kpiRecebimento = data.kpiRecebimento;
        kpiVendas = data.kpiVendas;
        kpiExpedicao = data.kpiExpedicao;
    });

    // Sockets Expedição Dia
    socket.on("getExpedicaoDia", (data) => {
        var tabelaExpedicao = data.tabelaExpedicao;
        var socketId = data.socketId;
        socket.to(socketId).emit("getExpedicaoDia", { tabelaExpedicao })
    })
});



// Indicando para o Express utilizar o EJS como View Engine
app.set('view engine', 'ejs');

// Sessions
app.use(session({
    secret: "2i3fmcjkds oiniofds$¨#³²45",
    // cookie: {
    //     maxAge: 30 * 60 * 1000
    // },
    resave: true,
    saveUninitialized: true
}));

// Static
app.use(express.static('public'));

app.use((req, res, next) => {
    res.locals.moment= moment;
    next();
});

// Importando Body Parser, lib para ler as informações enviadas pelo POST
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rotas
app.use("/", indicadoresController);

app.use("/", usersController);

app.use("/", vendasController);

app.use("/", pagesController);

app.use("/", profilesController);

app.get("/", userAccess, (req, res) => {
    res.render("index", { frontendUrl, user: req.session.user });
});

app.get("/recebimento", (req, res) => {
    res.render("recebimento", { frontendUrl, backendUrl });
});

http.listen(8080, () => {
    console.log("App rodando!");
});

