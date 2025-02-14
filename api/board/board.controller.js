import { boardService } from './board.service.js'
import { loggerService } from '../../services/logger.service.js'
import { socketService } from '../../services/socket.service.js'
import genAI from '../../server.js'

export async function getBoards(req, res) {
    try {
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
            createdAt: Date.now(),
        }
        board.createdBy = loggedinUser || {
            _id: '6737239f06c9b704f496443a',
            fullname: 'Gal Ben David',
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
            isClosed: req.body.isClosed,
        }
        const updatedBoard = await boardService.update(board)

        socketService.broadcast({
            type: 'board-updated',
            data: updatedBoard,
            room: board._id,
            userId: loggedinUser?._id || '6737239f06c9b704f496443a',
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
        const updatedBoard = await boardService.findByIdAndUpdate(activity.boardId, activity)

        res.json(updatedBoard)
    } catch (err) {
        console.error('Failed to add activity', err)
        res.status(500).send({ error: 'Failed to add activity' })
    }
}

export async function generateAiBoard(req, res) {
    const { loggedinUser } = req
    if (!loggedinUser) loggedinUser = {
        _id: '6737239f06c9b704f496443a',
        fullname: 'Gal Ben David',
        imgUrl: '/img/user/gal.png',
    }

    const { topic, urls } = req.body
    const firstUrl = urls.shift()

    const stringifiedUrls = JSON.stringify(
        urls.map((url) => url.small),
        null,
        2
    )

    try {
        const prompt = `Create a task board for the topic: ${topic}. The board should have the following structure:
                - please 4 groups, each group should has 4 or 6 tasks with different titles for each task and group
                each group and task should has a unique id. 
                - For some task object please replace the 'backgroundColor' key in the style field with backgroundImage in this format: 
                style: {
                backgroundImage = { url: url(), bgColor: #ffffff, imgId, source: 'fromAttach', isCover: false }
                }
                for the task with 'backgroundImage' key in style, insert an image url from this array:${stringifiedUrls} into the brackets of the url,
                the final result for the backgroundImage.url for task is: backgroundImage.url: url(here the url you picked from ${stringifiedUrls})
                In imgId random a unique id.

                please pick random color from the following object for the backgroundColor in the key style in group.

                groupColorPalette = [
            { realColor: '#BAF3DB'},
            { realColor: '#F8E6A0'},
            {  realColor: '#FEDEC8'},
            { realColor: '#FFD5D2'},
            {  realColor: '#DFD8FD'},
            {  realColor: '#CCE0FF'},
            {  realColor: '#C6EDFB'},
            { realColor: '#D3F1A7'},
            {  realColor: '#FDD0EC'}
        ]

          please pick random color from the following object for the backgroundColor in the key style in task.
        const defaultLabels = [
            { id: 'l101', color: '#4BCE97', fontColor: '#164b35', title: '' },
            { id: 'l102', color: '#F5CD47', fontColor: '#533f04', title: '' },
            { id: 'l103', color: '#FEA362', fontColor: '#702e00', title: '' },
            { id: 'l104', color: '#F87168', fontColor: '#5d1f1a', title: '' },
            { id: 'l105', color: '#9F8FEF', fontColor: '#352c63', title: '' },
            { id: 'l106', color: '#579DFF', fontColor: '#09326c', title: '' },
        ]

        we put an empty url() in backgroundImage field, please fill the url with image url from this array: ${stringifiedUrls}. 
        Make sure the returned board object includes the following keys: title, isStarred, labels, members, groups, activities
        in each task please put in the members array one or more members from the board's members array, randomly.
        {
            title: 'choose a title related to the topic',
            isStarred: false,
            labels: [
                {
                    id: 'l101',
                    title: 'Done',
                    color: '#4BCE97',
                },
                {
                    id: 'l102',
                    title: 'Progress',
                    color: '#F5CD47',
                },
            ],
            members: [
                {
                    _id: '6737239f06c9b704f4964438',
                    fullname: 'Matan Odentz',
                    imgUrl: '/img/user/team-matan.png',
                    isAdmin: true
                },
                {
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
                }
            ],
            groups: [
                {
                    id: enter id in format: 'idxxxxx',
                    title: choose a title related to the topic,
                    style: { backgroundColor: "#BAF3DB" },
                    tasks: [
                        {
                            id: enter id in format: 'idxxxxx',
                            title: choose a title related to the topic,
                            coverSize: 'half',
                            status: 'inProgress',
                            dueDate: '2024-12-06',
                            description: choose a description related to the topic,
                            checklists: [
                                {
                                    id: enter id in format: 'idxxxxx',
                                    title: choose a title related to the topic,
                                    todos: [
                                        {
                                            id: enter id in format: 'idxxxxx',
                                            title: choose a title related to the topic,
                                            isDone: false,
                                        },
                                    ],
                                },
                            ],
                            memberIds: ['6737239f06c9b704f496443a'],
                            labelIds: ['l101', 'l102'],
                            style: {
                                backgroundColor: '#F5CD47',
                            }
                        }
                    ]
                }],
            activities: [],
        }

                Please format your response as JSON.`

        const response = await genAI.chat.completions.create({
            model: 'gpt-3.5-turbo', // or gpt-3.5-turbo
            messages: [{ role: 'user', content: prompt }],
        })

        let boardStructure
        try {
            boardStructure = JSON.parse(response.choices[0].message.content)
        } catch (error) {
            console.error('Failed to parse AI response:', error)
            return res.status(500).json({ success: false, error: 'Invalid board structure generated' })
        }

        boardStructure.createdAt = Date.now()
        boardStructure.createdBy = loggedinUser

        boardStructure.urls = firstUrl
        boardStructure.style = { backgroundImage: `url(${firstUrl.regular})` }

        const addedAiBoard = await boardService.add(boardStructure)
        const newActivity = {
            txt: `created this board by AI`,
            boardId: addedAiBoard._id,
            groupId: null,
            taskId: null,
            byMember: { _id: loggedinUser._id, fullname: loggedinUser.fullname, imgUrl: loggedinUser.imgUrl },
            createdAt: Date.now(),
        }

        await boardService.findByIdAndUpdate(addedAiBoard._id, newActivity)

        res.json(addedAiBoard)
    } catch (error) {
        console.error('Error generating board:', error)
        res.status(500).json({ success: false, error: 'Failed to generate board' })
    }
}