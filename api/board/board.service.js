import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { loggerService } from '../../services/logger.service.js'
import { authService } from '../auth/auth.service.js'
import { utilService } from '../../services/util.service.js'

export const boardService = {
	remove,
	query,
	getById,
	add,
	update,
	// addToyMsg,
	// removeToyMsg,
}

async function query(filterBy = {}) {
	try {
		// const criteria = {
		// 	name: { $regex: filterBy.name, $options: 'i' },
		// }
		// if (filterBy.labels && filterBy.labels.length > 0) {
		// 	criteria.labels = { $in: filterBy.labels }
		// }
		// if (filterBy.price !== 0) {
		// 	criteria.price = { $lte: filterBy.price }
		// }
		// if (filterBy.inStock !== 'all') {
		// 	criteria.inStock = (filterBy.inStock === 'available')
		// }

		// let sortOption = {}
		// if (filterBy.selector === 'name') {
		// 	sortOption = { name: 1 }
		// } else if (filterBy.selector === 'price') {
		// 	sortOption = { price: 1 }
		// } else if (filterBy.selector === 'createdAt') {
		// 	sortOption = { createdAt: 1 }
		// }
		const collection = await dbService.getCollection('board')
		// var toys = await collection.find(criteria).sort(sortOption).toArray()
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
	const { boardId } = board._id
	try {
		const updatedBoard = {
			title: board.title,
			isStarred: board.isStarred,
			style: board.style,
			labels: board.labels,
			members: board.members,
			groups: board.groups,
			activities: board.activities
		}
		const collection = await dbService.getCollection('board')
		await collection.updateOne({ _id: ObjectId.createFromHexString(board._id) }, { $set: updatedBoard })
		return board
	} catch (err) {
		loggerService.error(`cannot update toy ${boardId}`, err)
		throw err
	}
}

// async function addBoardMsg(toyId, msg) {
// 	try {
// 		msg.id = utilService.makeId()

// 		const collection = await dbService.getCollection('toys')
// 		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $push: { msgs: msg } })
// 		return msg
// 	} catch (err) {
// 		loggerService.error(`cannot add toy msg ${toyId}`, err)
// 		throw err
// 	}
// }

// async function removeToyMsg(toyId, msgId) {
// 	try {
// 		const collection = await dbService.getCollection('toys')
// 		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $pull: { msgs: { id: msgId } } })
// 		return msgId
// 	} catch (err) {
// 		loggerService.error(`cannot add toy msg ${toyId}`, err)
// 		throw err
// 	}
// }