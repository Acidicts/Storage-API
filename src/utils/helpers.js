const { v4: uuidv4 } = require('uuid');

function generateUniqueId() {
    return uuidv4();
}

function isValidUrl(string) {
    const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\\.)+([a-z]{2,})|' + // domain name
        'localhost|' + // localhost
        '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|' + // IP address
        '\\[?[a-f0-9]*:[a-f0-9:%.~+\\/?=\\-]*\\])' + // IPv6
        '(\\:\\d+)?(\\/[-a-z0-9+&@#\\/%?=~_|!:,.;]*)*' + // path
        '(\\?[;&a-z0-9+%#=~_|!:,.;]*)?' + // query string
        '(\\#[-a-z0-9_]*)?$','i'); // fragment locator
    return !!urlPattern.test(string);
}

module.exports = {
    generateUniqueId,
    isValidUrl
};