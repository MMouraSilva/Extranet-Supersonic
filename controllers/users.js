const express = require("express");
const router = express.Router();
require('dotenv').config();;
const userAccess = require("../middlewares/userAccess");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Page = require("../models/Page");
const ErrorHandler = require("../models/ErrorHandler");

class UserInterfaceController {
    #backendUrl;
    #frontendUrl;
    #updateStatus;
    #createStatus;
    #loginStatus;

    constructor() {
        this.user = new User();
        this.#backendUrl = process.env.APP_TIMER_HOST;
        this.#frontendUrl = process.env.APP_HOST;
    }

    RenderIndexPage = async (req, res) => {
        this.#CheckForErrorsOnSession(req);
        const users = await this.user.GetUsers();
        const tableUsers = this.#GetUsersFromFirebaseObject(users);
        
        let user = req.session.user;

        res.render("users/index", { frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user, users: tableUsers, updateStatus: this.updateStatus, createStatus: this.createStatus });
    }

    RenderCreateForm = async (req, res) => {
        this.#CheckForErrorsOnSession(req);
        const profiles = await this.user.profile.GetProfiles();
        const arrProfiles = this.#GetProfilesFromFirebaseObject(profiles);
    
        res.render("users/form", { operation: "create", user: req.session.user, createStatus: this.createStatus, profiles: arrProfiles });
    }

    RenderUpdateForm = async (req, res) => {
        const id = req.params.id;
        this.#CheckForErrorsOnSession(req);
        
        if(id) {
            const { userToEdit, userProfiles, arrProfiles } = this.#GetDataToRenderUpdateForm();
            res.render("users/form", { operation: "edit", user: req.session.user, updateStatus: this.updateStatus, profiles: arrProfiles, userToEdit, userProfiles });
        } else res.redirect("/users");
    }

    RenderLoginPage = async (req, res) => {
        this.#CheckForLoginStatusOnSession(req);
        
        res.render("users/login", { loginStatus: this.loginStatus });
    }

    async #GetDataToRenderUpdateForm() {
        const { userToEdit, userProfiles } = await this.#GetUserToEditData(id);
        const arrProfiles = this.#GetProfilesFromFirebaseObject(await this.user.profile.GetProfiles());

        return { userToEdit, userProfiles, arrProfiles };
    }

    async #GetUserToEditData(id) {
        const userToEdit = await this.user.GetUserById(id);
        const userProfilesQuery = await this.user.usersProfiles.GetUsersProfilesByUserId(id);
        const userProfiles = await this.user.PushIdProfileToArray(userProfilesQuery);

        return { userToEdit, userProfiles };
    }

    #GetUsersFromFirebaseObject(users) {
        let arrUsers = [];

        users.forEach(user => {
            arrUsers.push(user);
        });

        return arrUsers;
    }

    #GetProfilesFromFirebaseObject(object) {
        let arrProfiles = [];

        object.forEach(profile => {
            let array = profile.data();
            array.id = profile.id;
            arrProfiles.push(array);
        });

        return arrProfiles;
    }

    #CheckForErrorsOnSession(req) {
        this.updateStatus = req.session.updateUserStatus;
        this.createStatus = req.session.createUserStatus;
        this.#ClearErrorsOnSession(req);
    }

    #ClearErrorsOnSession(req) {
        req.session.updateUserStatus = undefined;
        req.session.createUserStatus = undefined;
    }

    #CheckForLoginStatusOnSession(req) {
        this.loginStatus = req.session.loginStatus;
        this.#ClearLoginStatusOnSession(req);
    }

    #ClearLoginStatusOnSession(req) {
        req.session.loginStatus = undefined;
    }

    get backendUrl() {
        return this.#backendUrl;
    }

    get frontendUrl() {
        return this.#frontendUrl;
    }

    get updateStatus() {
        return this.#updateStatus;
    }
    set updateStatus(newValue) {
        this.#updateStatus = newValue;
    }

    get createStatus() {
        return this.#createStatus;
    }
    set createStatus(newValue) {
        this.#createStatus = newValue;
    }

    get loginStatus() {
        return this.#loginStatus;
    }
    set loginStatus(newValue) {
        this.#loginStatus = newValue;
    }
}

class UserController {
    constructor() {
        this.user = new User();
        this.errorHandler = new ErrorHandler();
    }

    HandleCreateRequest = async (req, res) => {
        this.user.dataModel.SetUser(req.body);
        this.#HandleCreateResponse(req, res, await this.user.CreateUser());
    }

    HandleUpdateRequest = async (req, res) => {
        this.user.dataModel.SetUser(req.body);
        this.#HandleUpdateResponse(req, res, await this.user.UpdateUser());
    }

    HandleDeleteRequest = async (req, res) => {
        const id = req.body.id;
        this.#RedirectDeleteResponse(req, res, await this.user.DeleteUser(id));
    }

    HandleUserAuthentication = async (req, res) => {
        this.user.dataModel.SetUser(req.body);
        await this.#AuthenticateUser(req, res, await this.user.ValidateCredentialToAuthenticate());
    }

    HandleUserLogout = (req, res) => {
        req.session.user = undefined;
        res.redirect("/");
    }

    async #AuthenticateUser(req, res, isUserValid) {
        const { password } = req.body;

        if(isUserValid) {    
            if(await this.user.AuthenticateUserPassword(password)) this.#RegisterSession(req, res);
            else this.#RedirectLoginError(req, res);
        } else this.#RedirectLoginError(req, res);
    }

    #RegisterSession(req, res) {
        req.session.user = {
            id: this.user.dataModel.id,
            name: this.user.dataModel.name,
        }
        res.redirect("/");
    }

    #RedirectLoginError(req, res) {
        req.session.loginStatus = "error";
        res.redirect("/login");
    }

    #HandleCreateResponse(req, res, createResponse) {
        if(createResponse.emailExists || createResponse.loginExists) {
            this.#RedirectNotValidCreation(req, res, createResponse);
        } else this.#RedirectResponse(req, res, createResponse, "create");
    }

    #HandleUpdateResponse(req, res, updateResponse) {
        if(updateResponse.emailExists || updateResponse.loginExists) {
            this.#RedirectNotValidUpdate(req, res);
        } else this.#RedirectResponse(req, res, updateResponse, "update");
    }

    #RedirectNotValidCreation(req, res, createResponse) {
        req.session.createUserStatus = { completed: false, loginExists: createResponse.loginExists, emailExists: createResponse.emailExists };
        res.redirect("/users/create");
    }

    #RedirectNotValidUpdate(req, res) {
        req.session.updateUserStatus = { completed: false };
        res.redirect("/users/edit/" + req.body.id);
    }

    #RedirectResponse(req, res, operationResponse, operation) {
        if(operationResponse.hasError) this.errorHandler.HandleError(operationResponse.error);
        if(operation == "create")
            req.session.createUserStatus = { completed: !operationResponse.hasError, loginExists: operationResponse.loginExists, emailExists: operationResponse.emailExists };
        else if(operation == "update")
            req.session.updateUserStatus = { completed: !operationResponse.hasError, loginExists: operationResponse.loginExists, emailExists: operationResponse.emailExists };
        res.redirect("/users");
    }

    #RedirectDeleteResponse(req, res, operationResponse) {
        if(operationResponse.error) this.errorHandler.HandleError(operationResponse.error);
        res.redirect("/users");
    }
}

module.exports = { UserInterfaceController, UserController };