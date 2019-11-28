const logger = require('logger-for-kibana');

logger.setContext('organization', 'growme.fyi');
logger.setContext('service', 'flash');
logger.setContext('application', 'media');

module.exports = logger;