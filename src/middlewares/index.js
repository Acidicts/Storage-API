const { body, validationResult } = require('express-validator');

const validateImageUrl = [
    body('url')
        .isURL()
        .withMessage('Invalid URL format')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateImageUrl,
    handleValidationErrors
};