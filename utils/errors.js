class CustomError extends Error {
    constructor({ message, error }, status) {
        super(message);
        this.message = message;
        this.error = error;
        this.status = status;
    }
}

module.exports = { CustomError };