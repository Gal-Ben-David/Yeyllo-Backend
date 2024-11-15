import { ObjectId } from 'mongodb'

import { asyncLocalStorage } from '../../services/als.service.js'
import { loggerService } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'

export const reviewService = { query, remove, add }

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('review')

        var reviews = await collection.aggregate([
            {
                $match: criteria,
            },
            {
                $lookup: {
                    localField: 'userId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'byUser',
                },
            },
            {
                $unwind: '$byUser'
            },
            {
                $lookup: {
                    localField: 'toyId',
                    from: 'toys',
                    foreignField: '_id',
                    as: 'aboutToy',
                },
            },
            {
                $unwind: '$aboutToy',
            },
            {
                $project: {
                    _id: true,
                    txt: 1,
                    byUser: { _id: 1, fullname: 1 },
                    aboutToy: { _id: 1, name: 1, price: 1 },
                    createdAt: 1
                },
            },
        ]).toArray()

        console.log('reviewfromservice', reviews)

        // reviews = reviews.map(review => {
        //     review.byUser = {
        //         _id: review.byUser._id,
        //         fullname: review.byUser.fullname
        //     }
        // review.aboutUser = {
        //     _id: review.aboutUser._id,
        //     fullname: review.aboutUser.fullname
        // }
        //     review.createdAt = review._id.getTimestamp()
        //     delete review.byUserId
        //     // delete review.aboutUserId
        //     return review
        // })

        return reviews
    } catch (err) {
        loggerService.error('cannot get reviews', err)
        throw err
    }
}

async function remove(reviewId, loggedinUser) {
    try {
        // const { loggedinUser } = asyncLocalStorage.getStore()
        const collection = await dbService.getCollection('review')

        const criteria = { _id: ObjectId.createFromHexString(reviewId) }
        //* remove only if user is owner/admin
        //* If the user is not admin, he can only remove his own reviews by adding byUserId to the criteria
        if (!loggedinUser.isAdmin) {
            criteria.byUserId = ObjectId.createFromHexString(loggedinUser._id)
        }

        const { deletedCount } = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        loggerService.error(`cannot remove review ${reviewId}`, err)
        throw err
    }
}

async function add(review) {
    try {
        const newId = new ObjectId()
        const reviewToAdd = {
            _id: newId,
            userId: ObjectId.createFromHexString(review.byUserId),
            toyId: ObjectId.createFromHexString(review.aboutToyId),
            txt: review.txt,
            createdAt: newId.getTimestamp()
        }
        const collection = await dbService.getCollection('review')
        await collection.insertOne(reviewToAdd)

        return reviewToAdd
    } catch (err) {
        loggerService.error('cannot add review', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}

    if (filterBy.byUserId) {
        criteria.userId = ObjectId.createFromHexString(filterBy.byUserId)
    }
    if (filterBy.aboutToyId) {
        criteria.toyId = ObjectId.createFromHexString(filterBy.aboutToyId)
    }
    console.log('criteria:', criteria)
    return criteria
}