import { boardService } from './board.service.js'
import { loggerService } from '../../services/logger.service.js'
import { authService } from '../auth/auth.service.js'
import { socketService } from '../../services/socket.service.js'
import genAI from '../../server.js'

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
            _id: '6737239f06c9b704f496443a',
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
    const { loggedinUser } = req

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
            urls: req.body.urls,
            isClosed: req.body.isClosed
        }
        const updatedBoard = await boardService.update(board)

        socketService.broadcast({
            type: 'board-updated', data: updatedBoard, room: board._id, userId: loggedinUser?._id || {
                _id: '6737239f06c9b704f496443a',
                fullname: 'Abi Abambi',
                imgUrl: '/img/user/gal.png',
            }
        })
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

export async function addActivity(req, res) {
    try {
        const activity = req.body

        console.log('req.body', req.body)
        const updatedBoard = await boardService.findByIdAndUpdate(activity.boardId, activity)

        res.json(updatedBoard)
    } catch (err) {
        console.error('Failed to add activity', err)
        res.status(500).send({ error: 'Failed to add activity' })
    }
}


export async function generateAiBoard(req, res) {
    const { topic } = req.body
    try {

        //         const prompt = `
        // Create a JSON object for a task board titled "${topic}" with the following structure:
        // - isStarred: boolean
        // - style: { backgroundColor: "lightblue" }
        // - labels: array of objects with id, title, color
        // - members: array of objects with _id, fullname, imgUrl, isAdmin
        // - groups: array of objects with id, title, and tasks (each task includes id, title, description, members, labelIds, membersIds, dueDate, and checklists)
        // - activities: empty array
        // - urls: { regular: "https://res.cloudinary.com/dkckt1l7i/image/upload/v1731148742/gradiant-rainbow_phdwu0.svg" }
        // Format the response as JSON only.`
        const prompt = `Create a task board for the topic "${topic}". The board should have the following structure:
        - A title (e.g., "Project Board")
        - A boolean field indicating if it's starred (e.g., isStarred: false)
        - A style field for the background color (e.g., style: { backgroundImage: url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w2NzM1Nzl8MHwxfHNlYXJjaHwxfHxzZWF8ZW58MHx8fHwxNzMyMDEwNTQ4fDA&ixlib=rb-4.0.3&q=85)})
        - An array of labels (e.g., labels: [
                    {
                        id: 'l101',
                        title: 'Done',
                        color: '#61bd4f',
                    },
                    {
                        id: 'l102',
                        title: 'Progress',
                        color: '#61bd33',
                    },])
        - An array of members (e.g., members: [            {
                        _id: '6737239f06c9b704f4964438',
                        fullname: 'Matan Odentz',
                        imgUrl: '/img/user/team-matan.png',
                        isAdmin: true
                    },
                        _id: '6737239f06c9b704f4964439',
                        fullname: 'Ofer Koren',
                        imgUrl: '/img/user/team-ofer.png',
                        isAdmin: true
                    },
                    {
                        _id: '6737239f06c9b704f496443a',
                        fullname: 'Gal Ben David',
                        imgUrl: '/img/user/gal.png',
                        isAdmin: true
                    },
                    ])
        - An array of groups (each group should have a id, title and tasks, e.g., groups: [{id, title: "To Do", tasks: ["Task 1", "Task 2"] }, { title: "In Progress", tasks: ["Task 3"] }])
        each task: should have id filed and title. the task could include description, members array with members from the board members.
        field of labelIds from the board's labels array, and membersIds from the board's members array,  dueDate, checklists array in this format:
             checklists: [
                                    {
                                        id: 'YEhmF',
                                        title: 'Checklist',
                                        todos: [
                                            {
                                                id: '212jX',
                                                title: 'To Do 1',
                                                isDone: false,
                                            },
                                        ],
                                    },
                                ],
        - An empty array for activities (e.g., activities: [])
        - A key urls with object for the board's image (e.g., urls: {
        regular: 'https://res.cloudinary.com/dkckt1l7i/image/upload/v1731148742/gradiant-rainbow_phdwu0.svg'})

        Please format your response as JSON.`

        const response = await genAI.chat.completions.create({
            model: 'gpt-3.5-turbo', // or gpt-3.5-turbo
            messages: [{ role: 'user', content: prompt }],
        })

        let boardStructure;
        try {
            boardStructure = JSON.parse(response.choices[0].message.content)
        } catch (error) {
            console.error('Failed to parse AI response:', error)
            return res.status(500).json({ success: false, error: 'Invalid board structure generated' })
        }


        boardStructure.createdAt = Date.now()
        boardStructure.createdBy = {
            _id: '6737239f06c9b704f496443a',
            fullname: 'Gal Ben David',
            imgUrl: '/img/user/gal.png',
        }
        const addedAiBoard = await boardService.add(boardStructure)

        res.json(addedAiBoard)
    } catch (error) {
        console.error('Error generating board:', error);
        res.status(500).json({ success: false, error: 'Failed to generate board' })
    }
}