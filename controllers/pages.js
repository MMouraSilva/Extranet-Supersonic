const express = require("express");
const router = express.Router();
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const userAuth = require("../middlewares/userAuth");
const Page = require("../models/Page");

router.get("/pages", userAuth, async (req, res) => {
    try {
        const updateStatus = req.session.updatePageStatus;
        const createStatus = req.session.createPageStatus;
        
        req.session.updatePageStatus = undefined;
        req.session.createPageStatus = undefined;

        const pages = await Page.GetPages();

        res.render("pages/index", { frontendUrl, backendUrl, user: req.session.user, pages, updateStatus, createStatus });
    } catch(error) {
        console.log(error);
    }
});

router.get("/pages/edit/:id", userAuth, async (req, res) => {
    const id = req.params.id;

    const updateStatus = req.session.updatePageStatus;
    req.session.updatePageStatus = undefined;

    if(id) {
        const page = new Page(req.params);
        const pageToEdit = await page.GetPageById();
        const menuGroup = await Page.GetMenuGroup();

        res.render("pages/form", { pageToEdit, operation: "edit", user: req.session.user, updateStatus, menuGroup });
    } else {
        res.redirect("/pages");
    }
});

router.post("/pages/edit", async (req, res) => {
    var form = req.body;

    if (!form.isMenuGroup) {
        form.isMenuGroup = false;
    } else {
        form.isMenuGroup = true;
    }

    if (!form.isSubMenu) {
        form.isSubMenu = false;
    } else {
        form.isSubMenu = true;
    }

    if (!form.urlPath) {
        form.urlPath = null;
    }

    if (!form.menuGroupId) {
        form.menuGroupId = null;
    }

    const page = new Page(form);
    const updateRes = await page.UpdatePage();

    if(updateRes.hasError) {
        console.log(updateRes.error);
        if(updateRes.pageError) {
            req.session.updatePageStatus = { completed: false, error: updateRes.error, pageError: updateRes.pageError };
            res.redirect("/pages/edit/" + form.id);
        } else {
            req.session.updatePageStatus = { completed: false, error: updateRes.error, pageError: updateRes.pageError };
            res.redirect("/pages");
        }
    } else {
        req.session.updatePageStatus = { completed: true };
        res.redirect("/pages");
    }
});

router.get("/pages/create", userAuth, async (req, res) => {
    const createStatus = req.session.createPageStatus;
    req.session.createPageStatus = undefined;

    const menuGroup = await Page.GetMenuGroup();

    res.render("pages/form", { operation: "create", user: req.session.user, createStatus, menuGroup });
});

router.post("/pages/create", async (req, res) => {
    var form = req.body;

    if (!form.isMenuGroup) {
        form.isMenuGroup = false;
    } else {
        form.isMenuGroup = true;
    }

    if (!form.isSubMenu) {
        form.isSubMenu = false;
    } else {
        form.isSubMenu = true;
    }

    if (!form.urlPath) {
        form.urlPath = null;
    }

    if (!form.menuGroupId) {
        form.menuGroupId = null;
    }

    const page = new Page(form);
    const createRes = await page.CreatePage();

    if(createRes.hasError) {
        console.log(createRes.error);
        if(createRes.pageError) {
            req.session.createPageStatus = { completed: false, error: createRes.error, pageError: createRes.pageError };
            res.redirect("/pages/create");
        } else {
            req.session.createPageStatus = { completed: false, error: createRes.error, pageError: createRes.pageError };
            res.redirect("/pages");
        }
    } else {
        req.session.createPageStatus = { completed: true };
        res.redirect("/pages");
    }
});

router.post("/pages/delete", async (req, res) => {
    const page = new Page(req.body);
    await page.DeletePage();

    res.redirect("/pages");
});

module.exports = router;