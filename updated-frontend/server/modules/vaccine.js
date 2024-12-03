import { Status, productStatus } from '../constants.js';
/**
 * This module handles vaccine-related operations.
 * @module vaccineModule
 */
const vaccineModule = {
    /**
     * Atomically increments and retrieves the next sequence value for a given counter.
     * @function getNextSequence
     * @memberof module:vaccineModule
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
     * Creates a new vaccine
     * @function createVaccine
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The vaccine data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    createVaccine: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on creating vaccine'
        };
        try {
            const { vaccineName, milliliter, bottle, date, expiration, status } = data;

            if (
                !isPresent(vaccineName) ||
                !isPresent(milliliter) ||
                !isPresent(bottle) ||
                !isPresent(date) ||
                !isPresent(expiration) ||
                !isPresent(status)
            ) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Missing required fields';
                return responseData;
            }

            if (!isValidVaccineName(vaccineName)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid vaccine name';
                return responseData;
            }

            if (!isValidMilliliter(milliliter)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid milliliter';
                return responseData;
            }

            if (!isValidBottle(bottle)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid bottle';
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

            const productId = await vaccineModule.getNextSequence(dbHelper, 'productId'); 
            const vaccine = await dbHelper.create('vaccine', {
                userId: session.userId,
                productId: productId,
                vaccineName,
                milliliter,
                bottle,
                date,
                expiration,
                status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = vaccine._id.toString();
        } catch (error) {
            console.error('Error on creating vaccine:', error);
        }
        return responseData;
    },

    /**
     * Get a vaccine by ID
     * @function getVaccine
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @param {string} vaccineId - The ID of the vaccine to retrieve
     * @returns {Promise<object>} - A promise which resolves to an object containing the status, error message and vaccine data
     */
    getVaccine: async (dbHelper, vaccineId) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on getting vaccine',
            data: null
        };
    
        try {
            if (!isPresent(vaccineId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'vaccine ID is required';
                return responseData;
            }

            const projection = {
                _id: 1,
                productId : 1,
                vaccineName: 1,
                milliliter: 1,
                bottle: 1,
                date: 1,
                expiration: 1,
                status: 1
            };
    

            const vaccine = await dbHelper.findOne('vaccine', { _id: vaccineId }, projection);
    
            if (!vaccine) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'vaccine not found';
                return responseData;
            }
    
            const vaccineObject = {
                vaccineId: vaccine._id.toString(),
                productId: vaccine.productId,
                vaccineName: vaccine.vaccineName,
                milliliter: vaccine.milliliter,
                bottle: vaccine.bottle,
                date: vaccine.date,
                expiration: vaccine.expiration,
                status: vaccine.status
            };
    
            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = vaccineObject;
    
        } catch (error) {
            console.error('Error on getting vaccine:', error);
        }
    
        return responseData;
    },

    /**
     * Gets all vaccines
     * @function getvaccines
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @returns {Promise<object>} - A promise which resolves to an object containing the status, error message and vaccine data
     */
    getVaccines: async (dbHelper, session) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on getting vaccines'
        };
        
        try {
            const vaccines = await dbHelper.find('vaccine', { userId: session.userId });
            const vaccineObjects = vaccines.map(vaccine => {
                const { _id, productId, vaccineName, milliliter, bottle, date, expiration, status } = vaccine.toObject();
                return { vaccineId: _id.toString(), productId, vaccineName, milliliter, bottle, date, expiration, status };
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = vaccineObjects;
        } catch (error) {
            console.error('Error on getting vaccines:', error);
        }
        return responseData;
    },

    /**
     * Updates a vaccine
     * @function updatevaccine
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The vaccine data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    updateVaccine: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on updating vaccine'
        };
    
        try {
            const { vaccineId, vaccineName, milliliter, bottle, date, expiration, status } = data;
    
            if (!isPresent(vaccineId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'vaccine ID is required';
                return responseData;
            }
    
            if (!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }
    
            if (!vaccineName && !milliliter && !bottle && !date && !expiration && !status) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'No fields provided to update';
                return responseData;
            }
    
            const fieldsToUpdate = {};
            if (vaccineName) fieldsToUpdate.vaccineName = vaccineName;
            if (milliliter) fieldsToUpdate.milliliter = milliliter;
            if (bottle) fieldsToUpdate.bottle = bottle;
            if (date) fieldsToUpdate.date = date;
            if (expiration) fieldsToUpdate.expiration = expiration;
            if (status) fieldsToUpdate.status = status;
    
            const updatedVaccine = await dbHelper.findOneAndUpdate(
                'vaccine', 
                { _id: vaccineId, userId: session.userId }, 
                { $set: fieldsToUpdate }, 
                { new: true } 
            );
    
            if (!updatedVaccine) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'vaccine not found';
                return responseData;
            }
    
            responseData.status = Status.OK;
            responseData.error = null;
        } catch (error) {
            console.error('Error on updating vaccine:', error);
        }
    
        return responseData;
    },      

    /**
     * Deletes a vaccine
     * @function deleteVaccine
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {string} vaccineId - The ID of the vaccine to delete
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    deleteVaccine: async (dbHelper, session, vaccineId) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on deleting vaccine'
        };
        try {
            if (!isPresent(vaccineId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'vaccine ID is required';
                return responseData;
            }
            if(!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }

            const vaccine = await dbHelper.findOne('vaccine', { _id: vaccineId, userId: session.userId });
            if (!vaccine) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'vaccine not found';
                return responseData;
            }

            await dbHelper.deleteOne('vaccine', { _id: vaccineId, userId: session.userId });


            responseData.status = Status.OK;
            responseData.error = null;
        } catch (error) {
            console.error('Error on deleting vaccine:', error);
        }
        return responseData;
    }
};

export default vaccineModule;

function isValidVaccineName(vaccineName) {
    return /^[a-zA-Z0-9\s]+$/.test(vaccineName);
}

function isValidMilliliter(milliliter) {
    return /^[0-9]+$/.test(milliliter);
}

function isValidBottle(bottle) {
    return /^[0-9]+$/.test(bottle);
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

