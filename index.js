const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const http = require("http").createServer(app);
const io = require("socket.io")(http);

io.on("connection", (socket) => {
    socket.on("disconnect", () => {
        console.log("Desconectado: " + socket.id);
    });
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
        res.render("index");
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/vendas", async (req, res) => {
    try {
        res.render("vendas");
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/vendas-finalizadas", async (req, res) => {
    try {
        res.render("vendas_finalizadas");
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/recebimento", async (req, res) => {
    try {
        res.render("recebimento");
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

app.get("/indicadores", async (req, res) => {
    try {
        res.render("indicador");
    } catch (error) {
        console.error("Erro na rota:", error);
        res.status(500).send("Erro ao executar a rota");
    }
});

http.listen(8080, () => {
    console.log("App rodando!");
});

