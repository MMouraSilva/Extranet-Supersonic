const express = require("express");
const router = express.Router();
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const userAuth = require("../middlewares/userAuth");
const loginPageAuth = require("../middlewares/loginPageAuth");
const User = require("../models/User");

router.get("/users", userAuth, async (req, res) => {
    try {
        const updateStatus = req.session.updateUserStatus;
        const createStatus = req.session.createUserStatus;
        
        req.session.updateUserStatus = undefined;
        req.session.createUserStatus = undefined;

        const users = await User.GetUsers();
        var arrUsers = [];

        users.forEach(user => {
            arrUsers.push(user);
        });

        res.render("users/index", { frontendUrl, backendUrl, user: req.session.user, users: arrUsers, updateStatus, createStatus });
    } catch(error) {
        console.log(error);
    }
});

router.get("/users/edit/:id", userAuth, async (req, res) => {
    const id = req.params.id;

    const updateStatus = req.session.updateUserStatus;
    req.session.updateUserStatus = undefined;

    if(id) {
        const user = new User(req.params);
        const userToEdit = await user.GetUserById(id);

        res.render("users/form", { userToEdit, operation: "edit", user: req.session.user, updateStatus });
    } else {
        res.redirect("/users");
    }
});

router.get("/users/create", userAuth, async (req, res) => {
    const createStatus = req.session.createUserStatus;
    req.session.createUserStatus = undefined;

    res.render("users/form", { operation: "create", user: req.session.user, createStatus });
});

router.post("/users/edit", async (req, res) => {
    const user = new User(req.body);
    const updateRes = await user.UpdateUser();

    if(updateRes.hasError) {
        console.log(updateRes.error);
        if(updateRes.emailError || updateRes.loginError) {
            req.session.updateUserStatus = { completed: false, error: updateRes.error, loginError: updateRes.loginError, emailError: updateRes.emailError };
            res.redirect("/users/edit/" + req.body.id);
        } else {
            req.session.updateUserStatus = { completed: false, error: updateRes.error, loginError: updateRes.loginError, emailError: updateRes.emailError };
            res.redirect("/users");
        }
    } else {
        req.session.updateUserStatus = { completed: true };
        res.redirect("/users");
    }
});

router.post("/users/create", async (req, res) => {
    const user = new User(req.body);
    const createRes = await user.CreateUser();

    if(createRes.hasError) {
        console.log(createRes.error);
        if(createRes.emailError || createRes.loginError) {
            req.session.createUserStatus = { completed: false, error: createRes.error, loginError: createRes.loginError, emailError: createRes.emailError };
            res.redirect("/users/create");
        } else {
            req.session.createUserStatus = { completed: false, error: createRes.error, loginError: createRes.loginError, emailError: createRes.emailError };
            res.redirect("/users");
        }
    } else {
        req.session.updateUserStatus = { completed: true };
        res.redirect("/users");
    }
});

router.post("/users/delete", async (req, res) => {
    const user = new User(req.body);
    await user.DeleteUser();

    res.redirect("/users");
});

router.get("/login", loginPageAuth, (req, res) => {
    const loginStatus = req.session.loginStatus;
    req.session.loginStatus = undefined;
    res.render("users/login", { loginStatus });
});

router.post("/authenticate", async (req, res) => {
    const { login, password } = req.body;

    const user = new User(req.body);

    const userCorrect = await user.GetUserByLogin();

    if (userCorrect) {
        const userAuthenticate = await user.AuthenticateUser(password);

        if (userAuthenticate) {
            req.session.user = {
                id: user.id,
                name: user.name,
                login: user.login,
                email: user.email,
                phone: user.phone
            }
            res.redirect("/");
        } else {
            req.session.loginStatus = "error";
            res.redirect("/login");
        }
    } else {
        req.session.loginStatus = "error";
        res.redirect("/login");
    }
});

router.get("/logout", (req, res) => {
    req.session.user = undefined;
    res.redirect("/");
});

module.exports = router;