export const sendSuccess = (res, data = [], message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
        status: "success",
        message,
        data,
    });
};
export const sendError = (res, message = "Internal Server Error At User Service", statusCode = 500, error = {}) => {
    return res.status(statusCode).json({
        status: "error",
        message,
        error,
    });
};
