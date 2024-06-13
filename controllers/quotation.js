require('dotenv').config();
const Quotation = require("../models/Quotation");
const ErrorHandler = require("../models/ErrorHandler");

class QuotationInterfaceController {
    #backendUrl;
    #frontendUrl;

    constructor() {
        this.quotation = new Quotation();
        this.#backendUrl = process.env.APP_TIMER_HOST;
        this.#frontendUrl = process.env.APP_HOST;
    }

    // async RenderIndexPage(req, res) {
    //     const errorStatus = this.#CheckForErrorsOnSession(req);
    //     const freightRules = await this.freightRules.GetFreightRules();

    //     res.render("freight-rules/index", { frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.session.user, freightRules, errorStatus });
    // }

    RenderCreateForm(req, res) {
        const errorStatus = this.#CheckForErrorsOnSession(req);

        res.render("quotation/form", { frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.session.user, errorStatus });
    }

    // async RenderUpdateForm(req, res) {
    //     const errorStatus = this.#CheckForErrorsOnSession(req);
    //     const freightRule = await this.freightRules.GetFreightRuleById(req.params.id);

    //     res.render("freight-rules/form", { operation: "edit", frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.session.user, freightRule, errorStatus });
    // }

    #CheckForErrorsOnSession(req) {
        const createStatus = req.session.QuotationErrorStatus;
        this.#ClearErrorsOnSession(req);

        return createStatus;
    }

    #ClearErrorsOnSession(req) {
        req.session.QuotationErrorStatus = undefined;
    }

    get backendUrl() {
        return this.#backendUrl;
    }

    get frontendUrl() {
        return this.#frontendUrl;
    }
}

// class FreightRulesController {
//     constructor() {
//         this.freightRules = new FreightRules();
//         this.errorHandler = new ErrorHandler();
//     }

//     async HandleCreateRequest(req, res) {
//         this.freightRules.dataModel.SetFreightRule(req.body);
//         this.#HandleCreateResponse(req, res, await this.freightRules.CreateFreightRule());
//     }

//     async HandleUpdateRequest(req, res) {
//         const id = req.body.id;
//         this.freightRules.dataModel.SetFreightRule(req.body);
//         this.#HandleUpdateResponse(req, res, await this.freightRules.UpdateFreightRule(id));
//     }

//     async HandleDeleteRequest(req, res) {
//         const id = req.body.id;
//         this.#RedirectResponse(req, res, await this.freightRules.DeleteFreightRule(id));
//     }

//     #HandleCreateResponse(req, res, createResponse) {
//         if(!createResponse.isFreightRuleValid) {
//             this.#RedirectNotValidCreation(req, res);
//         } else this.#RedirectResponse(req, res, createResponse);
//     }

//     #HandleUpdateResponse(req, res, updateResponse) {
//         if(!updateResponse.isFreightRuleValid) {
//             this.#RedirectNotValidUpdate(req, res);
//         } else this.#RedirectResponse(req, res, createResponse);
//     }

//     #RedirectNotValidCreation(req, res) {
//         req.session.FreightRulesErrorStatus = { completed: false };
//         res.redirect("/freight-rules/create");
//     }

//     #RedirectNotValidUpdate(req, res) {
//         req.session.FreightRulesErrorStatus = { completed: false };
//         res.redirect("/freight-rules/edit/" + req.body.id);
//     }

//     #RedirectResponse(req, res, operationResponse) {
//         if(!operationResponse.hasSucceed) this.errorHandler.HandleError(operationResponse.error);
//         req.session.FreightRulesErrorStatus = { completed: operationResponse.hasSucceed, operation: operationResponse.operation };
//         res.redirect("/freight-rules");
//     }
// }

module.exports = { QuotationInterfaceController };