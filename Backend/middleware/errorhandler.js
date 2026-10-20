export const errorHandler = (error, _req, res, next) => {
    console.error(error);
    if (res.headersSent) {
        next(error);
        return;
    }
    if (error?.code === 11000) {
        res.status(409).json({
            message: "A product with this slug already exists",
        });
        return;
    }
    if (error?.name === "ValidationError" ||
        error?.name === "CastError") {
        res.status(400).json({
            message: "Invalid data provided",
        });
        return;
    }
    res.status(500).json({
        message: "Internal server error",
    });
};
//# sourceMappingURL=errorhandler.js.map