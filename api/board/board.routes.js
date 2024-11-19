import express from 'express'
import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'
import { getBoards, getBoardById, addBoard, updateBoard, removeBoard, addActivity, generateAiBoard } from './board.controller.js'

export const boardRoutes = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)

boardRoutes.get('/', log, getBoards)
boardRoutes.get('/:id', getBoardById)
boardRoutes.post('/', addBoard)
boardRoutes.post('/:id/activity', addActivity)
boardRoutes.post('/generate-board', generateAiBoard)
boardRoutes.put('/:id', updateBoard)
boardRoutes.delete('/:id', removeBoard)

//* With Auth
// boardRoutes.get('/', log, getBoards)
// boardRoutes.get('/:id', getBoardById)
// boardRoutes.post('/', requireAuth, requireAdmin, addBoard)
// boardRoutes.put('/:id', requireAuth, requireAdmin, updateBoard)
// boardRoutes.delete('/:id', requireAuth, requireAdmin, removeBoard)

// router.delete('/:id', requireAuth, requireAdmin, removeToy)

// toyRoutes.post('/:id/msg', requireAuth, addToyMsg)
// toyRoutes.delete('/:id/msg/:msgId', requireAuth, removeToyMsg)