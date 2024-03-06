const express = require("express");
const router = express.Router();
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const userAccess = require("../middlewares/userAccess");
const Profile = require("../models/Profile");

router.get("/profiles", userAccess, async (req, res) => {
    try {
        const updateStatus = req.session.updateProfileStatus;
        const createStatus = req.session.createProfileStatus;
        
        req.session.updateProfileStatus = undefined;
        req.session.createProfileStatus = undefined;

        const profiles = await Profile.GetProfiles();

        res.render("profiles/index", { frontendUrl, backendUrl, user: req.session.user, profiles, updateStatus, createStatus });
    } catch(error) {
        console.log(error);
    }
});

router.get("/profiles/edit/:id", userAccess, async (req, res) => {
    const id = req.params.id;

    const updateStatus = req.session.updateProfileStatus;
    req.session.updateProfileStatus = undefined;

    if(id) {
        const profile = new Profile(req.params);
        const profileToEdit = await profile.GetProfileById();

        const permissions = await profile.GetPermissions();
        
        const pages = await Profile.GetPages();

        res.render("profiles/form", { profileToEdit, operation: "edit", user: req.session.user, updateStatus, pages, permissions });
    } else {
        res.redirect("/profiles");
    }
});

router.post("/profiles/edit", async (req, res) => {
    const form = req.body;

    const profile = new Profile(form);
    const updateRes = await profile.UpdateProfile();

    if(updateRes.hasError) {
        console.log(updateRes.error);
        if(updateRes.profileError) {
            req.session.updateProfileStatus = { completed: false, error: updateRes.error, profileError: updateRes.profileError };
            res.redirect("/profiles/edit/" + form.id);
        } else {
            req.session.updateProfileStatus = { completed: false, error: updateRes.error, profileError: updateRes.profileError };
            res.redirect("/profiles");
        }
    } else {
        req.session.updateProfileStatus = { completed: true };
        res.redirect("/profiles");
    }
});

router.get("/profiles/create", userAccess, async (req, res) => {
    const createStatus = req.session.createProfileStatus;
    req.session.createProfileStatus = undefined;

    const pages = await Profile.GetPages();

    res.render("profiles/form", { operation: "create", user: req.session.user, createStatus, pages });
});

router.post("/profiles/create", async (req, res) => {
    const form = req.body;

    const profile = new Profile(form);
    const createRes = await profile.CreateProfile();

    if(createRes.hasError) {
        console.log(createRes.error);
        if(createRes.profileError) {
            req.session.createProfileStatus = { completed: false, error: createRes.error, profileError: createRes.profileError };
            res.redirect("/profiles/create");
        } else {
            req.session.createProfileStatus = { completed: false, error: createRes.error, profileError: createRes.profileError };
            res.redirect("/profiles");
        }
    } else {
        req.session.createProfileStatus = { completed: true };
        res.redirect("/profiles");
    }
});

router.post("/profiles/delete", async (req, res) => {
    const profile = new Profile(req.body);
    await profile.DeleteProfile();

    res.redirect("/profiles");
});

module.exports = router;