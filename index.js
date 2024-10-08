const compression = require("compression");
const express = require("express");
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST;
const frontendUrl = process.env.APP_HOST;
const app = express();
const bodyParser = require("body-parser");
const http = require("http").createServer(app);
const session = require("cookie-session");
const moment = require("moment");
const io = require("socket.io")(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    maxHttpBufferSize: 1e8
});

const Middleware = require("./middlewares/userAccess");
const userAccess = new Middleware;

const vendasController = require("./controllers/vendas");
const indicadoresController = require("./controllers/indicadores");
const usersRoutes = require("./routes/users");
const pagesController = require("./controllers/pages");
const profilesController = require("./controllers/profiles");
const freightRulesRoutes = require("./routes/freightRules");
const quotationRoutes = require("./routes/quotation");

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
var indicadorNoShow;
var indicadorArmazenagem;
var indicadorCurvaABCQuadrimestre;
var indicadorCurvaABCBimestre;
var indicadorCurvaABCMes;

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
        } else if(data.operation == "indicador") {
            socket.emit("getIndicador", { indicadorRecebimento, indicadorSeparacao, indicadorExpedicao,
                indicadorRecebimentoTipoProd, indicadorSeparacaoTipoProd, indicadorExpedicaoTipoProd });
        } else if(data.operation == "igest") {
            socket.emit("getIgest", { kpiRecebimento, kpiVendas, kpiExpedicao, indicadorArmazenagem });
        } else if(data.operation == "expedicao-dia") {
            var dateFilter = data.dateFilter;
            io.emit("requireDashboardData", { operation, dateFilter, socketId });
        } else if(data.operation == "no-show") {
            socket.emit("getNoShow", { indicadorNoShow });
        } else if(data.operation == "curva-abc") {
            socket.emit("getCurvaABC", { indicadorCurvaABCQuadrimestre, indicadorCurvaABCBimestre, indicadorCurvaABCMes });
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
        } else if(data.operation == "indicador") {
            socket.emit("getReloadedIndicador", { indicadorRecebimento, indicadorSeparacao, indicadorExpedicao,
                indicadorRecebimentoTipoProd, indicadorSeparacaoTipoProd, indicadorExpedicaoTipoProd });
        } else if(data.operation == "igest") {
            socket.emit("getReloadedIgest", { kpiRecebimento, kpiVendas, kpiExpedicao, indicadorArmazenagem });
        } else if(data.operation == "no-show") {
            socket.emit("getNoShow", { indicadorNoShow });
        } else if(data.operation == "curva-abc") {
            socket.emit("getCurvaABC", { indicadorCurvaABCQuadrimestre, indicadorCurvaABCBimestre, indicadorCurvaABCMes });
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
        indicadorArmazenagem = data.indicadorArmazenagem;
    });

    // Sockets Expedição Dia
    socket.on("getExpedicaoDia", (data) => {
        var tabelaExpedicao = data.tabelaExpedicao;
        var socketId = data.socketId;
        socket.to(socketId).emit("getExpedicaoDia", { tabelaExpedicao })
    });

    // Sockets No-Show
    socket.on("getIndicadorNoShow", (data) => {
        indicadorNoShow = data.indicadorNoShow;
    });

    // Sockets Curva-ABC
    socket.on("getIndicadorCurvaABC", (data) => {
        indicadorCurvaABCQuadrimestre = data.indicadorCurvaABCQuadrimestre;
        indicadorCurvaABCBimestre = data.indicadorCurvaABCBimestre;
        indicadorCurvaABCMes = data.indicadorCurvaABCMes;
    });

    io.emit("getData");
});

app.use(compression());
app.use(express.static('public'));

app.use(session({
    secret: "2i3fmcjkds oiniofds$¨#³²45",
    // TODO: Sistema de sessão por tempo que se renova conforme o usuário navega
    // cookie: {
    //     maxAge: 30 * 60 * 1000
    // },
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.locals.moment = moment;
    next();
});

app.set('view engine', 'ejs');

app.use("/", indicadoresController);
app.use("/", usersRoutes);
app.use("/", vendasController);
app.use("/", pagesController);
app.use("/", profilesController);
app.use("/", freightRulesRoutes);
app.use("/", quotationRoutes);

app.get("/recebimento", userAccess.UserAuth, async (req, res) => {
    res.render("recebimento", { frontendUrl, backendUrl });
});

app.get("/", userAccess.UserAuth, async (req, res) => {
    res.render("index", { user: req.locals.user });
});
        
http.listen(8000, () => {
    console.log("App rodando!");
});