class ErrorHandler {
    HandleError(error) {
        console.error(error);

        return false;
    }
}

module.exports = ErrorHandler;