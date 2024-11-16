import { boardService } from './board.service.js'
import { loggerService } from '../../services/logger.service.js'
import { authService } from '../auth/auth.service.js'
import { socketService } from '../../services/socket.service.js'

export async function getBoards(req, res) {
    try {
        // const filterBy = {
        //     name: req.query.name || '',
        //     price: +req.query.price || 0,
        //     labels: req.query.labels || [],
        //     inStock: req.query.inStock || 'all',
        //     selector: req.query.selector || '',
        // }
        const boards = await boardService.query()
        res.send(boards)
    } catch (err) {
        loggerService.error('Cannot get boards', err)
        res.status(400).send('Cannot get boards')
    }
}

export async function getBoardById(req, res) {
    try {
        const boardId = req.params.id
        const board = await boardService.getById(boardId)
        res.send(board)
    } catch (err) {
        loggerService.error('Cannot get board', err)
        res.status(500).send('Cannot get board')
    }
}

export async function addBoard(req, res) {
    const { loggedinUser } = req
    try {
        const board = {
            title: req.body.title,
            isStarred: req.body.isStarred,
            style: req.body.style,
            labels: req.body.labels,
            members: req.body.members,
            groups: req.body.groups,
            activities: req.body.activities,
            urls: req.body.urls,
            createdAt: Date.now()
        }
        board.createdBy = loggedinUser ||
        {
            _id: 'u101',
            fullname: 'Abi Abambi',
            imgUrl: '/img/user/gal.png',
        }

        const addedBoard = await boardService.add(board)
        res.send(addedBoard)
    } catch (err) {
        loggerService.error('Failed to add board', err)
        res.status(500).send({ err: 'Failed to add board' })
    }
}

export async function updateBoard(req, res) {
    try {
        //optional: const toy = req.body
        const board = {
            _id: req.body._id,
            title: req.body.title,
            isStarred: req.body.isStarred,
            style: req.body.style,
            labels: req.body.labels,
            members: req.body.members,
            groups: req.body.groups,
            activities: req.body.activities
        }
        const updatedBoard = await boardService.update(board)

        socketService.broadcast({ type: 'board-updated', data: updatedBoard, room: board._id, userId: 'u101' })
        console.log('Broadcast called for board-updated')

        res.send(updatedBoard)
    } catch (err) {
        loggerService.error('Failed to update board', err)
        res.status(500).send({ err: 'Failed to update board' })
    }
}

export async function removeBoard(req, res) {
    try {
        const boardId = req.params.id
        const deletedCount = await boardService.remove(boardId)
        res.send(`${deletedCount} boards removed`)
    } catch (err) {
        loggerService.error('Failed to remove board', err)
        res.status(500).send({ err: 'Failed to remove board' })
    }
}

// export async function addToyMsg(req, res) {
//     const { loggedinUser } = req
//     try {
//         const toyId = req.params.id
//         const msg = {
//             txt: req.body.txt,
//             by: loggedinUser,
//             createdAt: Date.now(),
//         }
//         console.log('msg', msg)
//         const savedMsg = await boardService.addToyMsg(toyId, msg)
//         res.send(savedMsg)
//     } catch (err) {
//         logger.error('Failed to add msg', err)
//         res.status(500).send({ err: 'Failed to add msg' })
//     }
// }

// export async function removeToyMsg(req, res) {
//     // const { loggedinUser } = req
//     try {
//         const toyId = req.params.id
//         const { msgId } = req.params

//         const removedId = await boardService.removeToyMsg(toyId, msgId)
//         res.send(removedId)
//     } catch (err) {
//         logger.error('Failed to remove toy msg', err)
//         res.status(500).send({ err: 'Failed to remove toy msg' })
//     }
// }