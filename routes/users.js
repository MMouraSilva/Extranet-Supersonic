const express = require("express");
const router = express.Router();
const Middleware = require("../middlewares/userAccess");
const loginPageAuth = require("../middlewares/loginPageAuth");
const { UserInterfaceController } = require("../controllers/users");
const { UserController } = require("../controllers/users");

const userInterfaceController  = new UserInterfaceController();
const userController = new UserController();
const userAccess = new Middleware();

router.get("/users", userAccess.UserAuth, userInterfaceController.RenderIndexPage);

router.get("/users/create", userAccess.UserAuth, userInterfaceController.RenderCreateForm);

router.post("/users/create", userAccess.UserAuth, userController.HandleCreateRequest);

router.get("/users/edit/:id", userAccess.UserAuth, userInterfaceController.RenderUpdateForm);

router.post("/users/edit", userAccess.UserAuth, userController.HandleUpdateRequest);

router.post("/users/delete", userAccess.UserAuth, userController.HandleDeleteRequest);

router.get("/login", loginPageAuth, userInterfaceController.RenderLoginPage);

router.post("/authenticate", userController.HandleUserAuthentication);

router.get("/logout", userController.HandleUserLogout);


module.exports = router;