import { Status, productStatus } from '../constants.js';
/**
 * This module handles feed-related operations.
 * @module feedModule
 */
const feedModule = {
    /**
     * Atomically increments and retrieves the next sequence value for a given counter.
     * @function getNextSequence
     * @memberof module:feedModule
     * @param {object} dbHelper - The database helper object
     * @param {string} name - The name of the counter
     * @returns {Promise<number>} - The next sequence value
     */
    getNextSequence: async (dbHelper, name) => {
        const counter = await dbHelper.findOneAndUpdate(
            'counter',
            { _id: name },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true } 
        );
        return counter.sequence_value;
    },

    /**
     * Creates a new feed
     * @function createFeed
     * @memberof module:feedModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The feed data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    createFeed: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on creating feed'
        };
        try {
            const { feedName, kilogram, sack, date, expiration, status } = data;

            if (
                !isPresent(feedName) ||
                !isPresent(kilogram) ||
                !isPresent(sack) ||
                !isPresent(date) ||
                !isPresent(expiration) ||
                !isPresent(status)
            ) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Missing required fields';
                return responseData;
            }

            if (!isValidFeedName(feedName)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid feed name';
                return responseData;
            }

            if (!isValidKilogram(kilogram)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid kilogram';
                return responseData;
            }

            if (!isValidSack(sack)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid sack';
                return responseData;
            }

            if (!isValidDate(date)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid date'; 
                return responseData;
            }

            if (!isValidDate(expiration)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid expiration';
                return responseData;
            }

            if (!isValidStatus(status)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid status';
                return responseData;
            }

            if(!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }

            const productId = await feedModule.getNextSequence(dbHelper, 'productId'); 
            const feed = await dbHelper.create('feed', {
                userId: session.userId,
                productId: productId,
                feedName,
                kilogram,
                sack,
                date,
                expiration,
                status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = feed._id.toString();
        } catch (error) {
            console.error('Error on creating feed:', error);
        }
        return responseData;
    },

    /**
     * Get a feed by ID
     * @function getFeed
     * @memberof module:feedModule
     * @param {object} dbHelper - The database helper object
     * @param {string} feedId - The ID of the feed to retrieve
     * @returns {Promise<object>} - A promise which resolves to an object containing the status, error message and feed data
     */
    getFeed: async (dbHelper, feedId) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on getting feed',
            data: null
        };
    
        try {
            if (!isPresent(feedId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'feed ID is required';
                return responseData;
            }

            const projection = {
                _id: 1,
                productId : 1,
                feedName: 1,
                kilogram: 1,
                sack: 1,
                date: 1,
                expiration: 1,
                status: 1
            };
    

            const feed = await dbHelper.findOne('feed', { _id: feedId }, projection);
    
            if (!feed) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'feed not found';
                return responseData;
            }
    
            const feedObject = {
                feedId: feed._id.toString(),
                productId: feed.productId,
                feedName: feed.feedName,
                kilogram: feed.kilogram,
                sack: feed.sack,
                date: feed.date,
                expiration: feed.expiration,
                status: feed.status
            };
    
            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = feedObject;
    
        } catch (error) {
            console.error('Error on getting feed:', error);
        }
    
        return responseData;
    },

    /**
     * Gets all feeds
     * @function getfeeds
     * @memberof module:feedModule
     * @param {object} dbHelper - The database helper object
     * @returns {Promise<object>} - A promise which resolves to an object containing the status, error message and feed data
     */
    getFeeds: async (dbHelper, session) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on getting feeds'
        };
        
        try {
            const feeds = await dbHelper.find('feed', { userId: session.userId });
            const feedObjects = feeds.map(feed => {
                const { _id, productId, feedName, kilogram, sack, date, expiration, status } = feed.toObject();
                return { feedId: _id.toString(), productId, feedName, kilogram, sack, date, expiration, status };
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = feedObjects;
        } catch (error) {
            console.error('Error on getting feeds:', error);
        }
        return responseData;
    },

    /**
     * Updates a feed
     * @function updatefeed
     * @memberof module:feedModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The feed data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    updateFeed: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on updating feed'
        };
    
        try {
            const { feedId, feedName, kilogram, sack, date, expiration, status } = data;
    
            if (!isPresent(feedId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'feed ID is required';
                return responseData;
            }
    
            if (!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }
    
            if (!feedName && !kilogram && !sack && !date && !expiration && !status) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'No fields provided to update';
                return responseData;
            }
    
            const fieldsToUpdate = {};
            if (feedName) fieldsToUpdate.feedName = feedName;
            if (kilogram) fieldsToUpdate.kilogram = kilogram;
            if (sack) fieldsToUpdate.sack = sack;
            if (date) fieldsToUpdate.date = date;
            if (expiration) fieldsToUpdate.expiration = expiration;
            if (status) fieldsToUpdate.status = status;
    
            const updatedFeed = await dbHelper.findOneAndUpdate(
                'feed', 
                { _id: feedId, userId: session.userId }, 
                { $set: fieldsToUpdate }, 
                { new: true } 
            );
    
            if (!updatedFeed) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'feed not found';
                return responseData;
            }
    
            responseData.status = Status.OK;
            responseData.error = null;
        } catch (error) {
            console.error('Error on updating feed:', error);
        }
    
        return responseData;
    },      

    /**
     * Deletes a feed
     * @function deletefeed
     * @memberof module:feedModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {string} feedId - The ID of the feed to delete
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    deleteFeed: async (dbHelper, session, feedId) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on deleting feed'
        };
        try {
            if (!isPresent(feedId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'feed ID is required';
                return responseData;
            }
            if(!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }

            const feed = await dbHelper.findOne('feed', { _id: feedId, userId: session.userId });
            if (!feed) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'feed not found';
                return responseData;
            }

            await dbHelper.deleteOne('feed', { _id: feedId, userId: session.userId });


            responseData.status = Status.OK;
            responseData.error = null;
        } catch (error) {
            console.error('Error on deleting feed:', error);
        }
        return responseData;
    }
};

export default feedModule;

function isValidFeedName(feedName) {
    return /^[a-zA-Z0-9\s]+$/.test(feedName);
}

function isValidKilogram(kilogram) {
    return /^[0-9]+$/.test(kilogram);
}

function isValidSack(sack) {
    return /^[0-9]+$/.test(sack);
}

function isValidDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidStatus(status) {
    const trimmedStatus = status.trim();
    return Object.values(productStatus).includes(trimmedStatus);
}


function isPresent(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    } else if (typeof value === 'number') {
        return true; 
    } else {
        return value !== null && value !== undefined;
    }
}

