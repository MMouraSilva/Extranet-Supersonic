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

    RenderIndexPage = async (req, res) => {
        res.render("quotation/index", { frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.locals.user });
    }

    RenderQuotationForm = async (req, res) => {
        res.render("quotation/form", { frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.locals.user });
    }

    RenderQuotation = async (req, res) => {
        const quotation = await this.quotation.GetQuotationByCode(req.params.id);
        
        res.render("quotation/doc", { frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.locals.user, quotation });
    }

    get backendUrl() {
        return this.#backendUrl;
    }

    get frontendUrl() {
        return this.#frontendUrl;
    }
}

class QuotationController {
    #quotation;
    #errorHandler;

    constructor() {
        this.#quotation = new Quotation();
        this.#errorHandler = new ErrorHandler();
    }

    HandleNewQuotation = async (req, res) => {
        const { ruleNotFound, hasSucceed, error, quotationCode } = await this.#quotation.GenerateQuotation(req.body);
        const statusCode = ruleNotFound ? 404 : hasSucceed ? 200 : 500;
        const message = hasSucceed ? "quotation-creation-success" : error;
        const responseData = { statusCode, data: { message , quotationCode } };

        this.#Response(res, responseData);
    }

    // async HandleCreateRequest(req, res) {
    //     this.freightRules.dataModel.SetFreightRule(req.body);
    //     this.#HandleCreateResponse(req, res, await this.freightRules.CreateFreightRule());
    // }

    // #HandleCreateResponse(req, res, createResponse) {
    //     if(!createResponse.isFreightRuleValid) {
    //         this.#RedirectNotValidCreation(req, res);
    //     } else this.#RedirectResponse(req, res, createResponse);
    // }

    // #RedirectNotValidCreation(req, res) {
    //     req.session.FreightRulesErrorStatus = { completed: false };
    //     res.redirect("/freight-rules/create");
    // }

    // #RedirectResponse(req, res, operationResponse) {
    //     if(!operationResponse.hasSucceed) this.errorHandler.HandleError(operationResponse.error);
    //     req.session.FreightRulesErrorStatus = { completed: operationResponse.hasSucceed, operation: operationResponse.operation };
    //     res.redirect("/freight-rules");
    // }

    #Response(res, responseData) {
        res.status(responseData.statusCode).send(responseData.data);
    }
}

module.exports = { QuotationInterfaceController, QuotationController };