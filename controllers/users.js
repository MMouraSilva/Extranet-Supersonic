const express = require("express");
const router = express.Router();
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const userAccess = require("../middlewares/userAccess");
const loginPageAuth = require("../middlewares/loginPageAuth");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Page = require("../models/Page");

router.get("/users", userAccess, async (req, res) => {
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

router.get("/users/create", userAccess, async (req, res) => {
    const createStatus = req.session.createUserStatus;
    req.session.createUserStatus = undefined;

    const profiles = await User.GetProfiles();

    res.render("users/form", { operation: "create", user: req.session.user, createStatus, profiles });
});

router.post("/users/create", async (req, res) => {
    const user = new User(req.body);
    const createRes = await user.CreateUser();

    // TODO: Ao refatorar, adicionar tratamento para a captura de erro de cadastro dos perfils de acesso do usuário.

    if(createRes.hasError) {
        if(createRes.emailExists || createRes.loginExists) {
            req.session.createUserStatus = { completed: false, error: createRes.error, loginExists: createRes.loginExists, emailExists: createRes.emailExists };
            res.redirect("/users/create");
        } else {
            req.session.createUserStatus = { completed: false, error: createRes.error, loginExists: createRes.loginExists, emailExists: createRes.emailExists };
            res.redirect("/users");
        }
    } else {
        req.session.updateUserStatus = { completed: true };
        res.redirect("/users");
    }
});

router.get("/users/edit/:id", userAccess, async (req, res) => {
    const id = req.params.id;

    const updateStatus = req.session.updateUserStatus;
    req.session.updateUserStatus = undefined;

    if(id) {
        const user = new User(req.params);
        const userToEdit = await user.GetUserById();
        const userProfilesQuery = await user.GetUsersProfilesByUserId();
        const userProfiles = await user.PushIdProfileToArray(userProfilesQuery);

        const profiles = await User.GetProfiles();

        res.render("users/form", { userToEdit, operation: "edit", user: req.session.user, updateStatus, profiles, userProfiles });
    } else {
        res.redirect("/users");
    }
});

router.post("/users/edit", async (req, res) => {
    const user = new User(req.body);
    const updateRes = await user.UpdateUser();

    if(updateRes.hasError) {
        if(updateRes.emailExists || updateRes.loginExists) {
            req.session.updateUserStatus = { completed: false, error: updateRes.error, loginExists: updateRes.loginExists, emailExists: updateRes.emailExists };
            res.redirect("/users/edit/" + req.body.id);
        } else {
            req.session.updateUserStatus = { completed: false, error: updateRes.error, loginExists: updateRes.loginExists, emailExists: updateRes.emailExists };
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
    
    // TODO: Após transformar o controller em Classes e separar as rotas em outro arquivo, transformar esse treco em um método
    user.profiles = await user.PushIdProfileToArray(await user.GetUsersProfilesByUserId());
    var profilesPermissions;
    var pages = [];
    var allowedRoutes = [];
    
    for(var i = 0; i < user.profiles.length; i++) {
        var profile = new Profile({ id: user.profiles[i] });
        profilesPermissions = await profile.GetPermissionsIdById();
    }
    
    for(var i = 0; i < profilesPermissions.length; i++) {
        var page = new Page({ id: profilesPermissions[i] });
        pages.push(await page.GetPagesObject());
    }
    
    for(var i = 0; i < pages.length; i++) {
        if(pages[i].urlPath) {
            allowedRoutes.push(pages[i].urlPath);
        }
    }

    if(userCorrect) {
        const userAuthenticate = await user.AuthenticateUser(password);

        if(userAuthenticate) {
            req.session.user = {
                id: user.id,
                name: user.name,
                login: user.login,
                email: user.email,
                phone: user.phone,
                permissions: pages,
                allowedRoutes
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