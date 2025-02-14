import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { loggerService } from '../../services/logger.service.js'

export const boardService = {
    remove,
    query,
    getById,
    add,
    update,
    findByIdAndUpdate,
}

async function query(filterBy = {}) {
    try {
        const collection = await dbService.getCollection('board')
        var boards = await collection.find().toArray()
        return boards
    } catch (err) {
        loggerService.error('cannot find boards', err)
        throw err
    }
}

async function getById(boardId) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await collection.findOne({ _id: ObjectId.createFromHexString(boardId) })
        board.createdAt = board._id.getTimestamp()
        return board
    } catch (err) {
        loggerService.error(`while finding board ${boardId}`, err)
        throw err
    }
}

async function remove(boardId) {
    try {
        const collection = await dbService.getCollection('board')
        const { deletedCount } = await collection.deleteOne({ _id: ObjectId.createFromHexString(boardId) })
        return deletedCount
    } catch (err) {
        loggerService.error(`cannot remove board ${boardId}`, err)
        throw err
    }
}

async function add(board) {
    try {
        const collection = await dbService.getCollection('board')
        await collection.insertOne(board)
        return board
    } catch (err) {
        loggerService.error('cannot insert board', err)
        throw err
    }
}

async function update(board) {
    try {
        const updatedBoard = {
            title: board.title,
            isStarred: board.isStarred,
            style: board.style,
            labels: board.labels,
            members: board.members,
            groups: board.groups,
            urls: board.urls,
            isClosed: board.isClosed,
        }

        const criteria = { _id: ObjectId.createFromHexString(board._id) }
        const collection = await dbService.getCollection('board')
        await collection.updateOne(criteria, { $set: updatedBoard })

        const boardAfter = await collection.findOne({ _id: ObjectId.createFromHexString(board._id) })

        return boardAfter
    } catch (err) {
        loggerService.error(`cannot update board ${board._id}`, err)
        throw err
    }
}

async function findByIdAndUpdate(boardId, activity) {
    try {
        const collection = await dbService.getCollection('board')

        const criteria = { _id: typeof boardId === 'string' ? ObjectId.createFromHexString(boardId) : boardId }
        await collection.updateOne(criteria, {
            $push: {
                activities: {
                    $each: [activity],
                    $position: 0,
                },
            },
        })
    } catch (err) {
        console.error('Failed to update board', err)
        throw err
    }
}