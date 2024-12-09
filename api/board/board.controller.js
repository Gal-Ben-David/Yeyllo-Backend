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
            createdAt: Date.now(),
        }
        board.createdBy = loggedinUser || {
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
            isClosed: req.body.isClosed,
        }
        const updatedBoard = await boardService.update(board)

        socketService.broadcast({
            type: 'board-updated',
            data: updatedBoard,
            room: board._id,
            userId: loggedinUser?._id || {
                _id: '6737239f06c9b704f496443a',
                fullname: 'Abi Abambi',
                imgUrl: '/img/user/gal.png',
            },
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
    const { topic, urls } = req.body
    const firstUrl = urls.shift()

    const stringifiedUrls = JSON.stringify(
        urls.map((url) => url.small),
        null,
        2
    )

    try {
        const prompt = `Create a task board for the topic: ${topic}. The board should have the following structure:
                *please 4 groups, each group should has 4 or 6 tasks with different titles for each task and group
                each group and task should has a unique id, 
                for some task please replace the backgroundColor key in style with backgroundImage like this: style.backgroundImage = {
                { url, bgColor: #ffffff, imgId, source: 'fromAttach', isCover: false }
                } 
                put in the backgroundImage.url an image url from this array:${stringifiedUrls} and put inside the brackets url()
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

        we put an empty url() in backgroundImage field, please fill the url with image url from this array: ${stringifiedUrls} 

        make sure the returned object includes the following keys: title, isStarred, labels, members, groups, activities
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
        boardStructure.createdBy = {
            _id: '6737239f06c9b704f496443a',
            fullname: 'Gal Ben David',
            imgUrl: '/img/user/gal.png',
        }
        boardStructure.urls = firstUrl
        boardStructure.style = { backgroundImage: `url(${firstUrl.regular})` }

        const addedAiBoard = await boardService.add(boardStructure)

        res.json(addedAiBoard)
    } catch (error) {
        console.error('Error generating board:', error)
        res.status(500).json({ success: false, error: 'Failed to generate board' })
    }
}

//*for presentation

// const boardStructure = {
//     "title": "Trip to Japan Planning",
//     "isStarred": false,
//     "labels": [
//         {
//             "id": "l101",
//             "title": "Done",
//             "color": "#4BCE97"
//         },
//         {
//             "id": "l102",
//             "title": "Progress",
//             "color": "#F5CD47"
//         },
//         {
//             "id": "l103",
//             "title": "Not Started",
//             "color": "#FEA362"
//         }
//     ],
//     "members": [
//         {
//             "_id": "6737239f06c9b704f4964438",
//             "fullname": "Matan Odentz",
//             "imgUrl": "/img/user/team-matan.png",
//             "isAdmin": true
//         },
//         {
//             "_id": "6737239f06c9b704f4964439",
//             "fullname": "Ofer Koren",
//             "imgUrl": "/img/user/team-ofer.png",
//             "isAdmin": true
//         },
//         {
//             "_id": "6737239f06c9b704f496443a",
//             "fullname": "Gal Ben David",
//             "imgUrl": "/img/user/gal.png",
//             "isAdmin": true
//         }
//     ],
//     "groups": [
//         {
//             "id": "id003",
//             "title": "Travel Arrangements",
//             "style": {
//                 "backgroundColor": "#F8E6A0"
//             },
//             "tasks": [
//                 {
//                     "id": "task007",
//                     "title": "Purchase JR Pass",
//                     "status": "notStarted",
//                     "dueDate": "2024-12-05",
//                     "description": "Buy a Japan Rail Pass for transportation",
//                     "checklists": [],
//                     "memberIds": [],
//                     "labelIds": [
//                         "l103"
//                     ],
//                     "style": {
//                         "backgroundColor": "#FEA362"
//                     }
//                 }
//             ]
//         },
//         {
//             "id": "id001",
//             "title": "Accommodation",
//             "style": {
//                 "backgroundColor": "#BAF3DB"
//             },
//             "tasks": [
//                 {
//                     "id": "task001",
//                     "title": "Book Hotels",
//                     "coverSize": "half",
//                     "status": "inProgress",
//                     "dueDate": "2024-12-06",
//                     "description": "Research and book hotels for the trip",
//                     "checklists": [
//                         {
//                             "id": "checklist001",
//                             "title": "Hotel Options",
//                             "todos": [
//                                 {
//                                     "id": "todo001",
//                                     "title": "Check availability",
//                                     "isDone": false
//                                 },
//                                 {
//                                     "id": "todo002",
//                                     "title": "Compare prices",
//                                     "isDone": false
//                                 }
//                             ]
//                         }
//                     ],
//                     "memberIds": [
//                         "6737239f06c9b704f496443a"
//                     ],
//                     "labelIds": [
//                         "l102"
//                     ],
//                     "style": {
//                         "backgroundColor": "#F5CD47"
//                     }
//                 },
//                 {
//                     "id": "task002",
//                     "title": "Arrange Airbnb",
//                     "status": "notStarted",
//                     "dueDate": "2024-12-10",
//                     "description": "Explore Airbnb options for accommodation",
//                     "checklists": [
//                         {
//                             "id": "checklist002",
//                             "title": "Locations",
//                             "todos": [
//                                 {
//                                     "id": "todo003",
//                                     "title": "Research popular areas",
//                                     "isDone": false
//                                 }
//                             ]
//                         }
//                     ],
//                     "memberIds": [],
//                     "labelIds": [
//                         "l103",
//                         "l106"
//                     ],
//                     "style": {
//                         "backgroundColor": "#F87168"
//                     }
//                 }
//             ]
//         },
//         {
//             "id": "id002",
//             "title": "Sightseeing",
//             "style": {
//                 "backgroundColor": "#FDD0EC"
//             },
//             "tasks": [
//                 {
//                     "id": "task003",
//                     "title": "Visit Kyoto",
//                     "status": "notStarted",
//                     "dueDate": "2024-12-15",
//                     "description": "Plan a day trip to Kyoto",
//                     "checklists": [],
//                     "memberIds": [],
//                     "labelIds": [
//                         "l103"
//                     ],
//                     "style": {
//                         "backgroundImage": {
//                             "url": "url(https://images.unsplash.com/photo-1694827918768-2ed7d74c47c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NzM1Nzl8MHwxfHNlYXJjaHwzfHx0cmlwJTIwdG8lMjBqYXBhbnxlbnwwfHx8fDE3MzIwNTMyNTZ8MA&ixlib=rb-4.0.3&q=80&w=400)",
//                             "bgColor": "#ffffff",
//                             "imgId": "img001",
//                             "source": "fromAttach",
//                             "isCover": false
//                         }
//                     }
//                 },
//                 {
//                     "id": "task004",
//                     "title": "Explore Tokyo",
//                     "status": "notStarted",
//                     "dueDate": "2024-12-17",
//                     "description": "Create an itinerary for Tokyo",
//                     "checklists": [],
//                     "memberIds": [],
//                     "labelIds": [
//                         "l103"
//                     ],
//                     "style": {
//                         "backgroundColor": "#94C748"
//                     }
//                 },
//                 {
//                     "id": "task005",
//                     "title": "Visit Hiroshima",
//                     "status": "inProgress",
//                     "dueDate": "2024-12-27T00:00:00.000Z",
//                     "description": "Research historical sites in Hiroshima",
//                     "checklists": [],
//                     "memberIds": [],
//                     "labelIds": [
//                         "l103"
//                     ],
//                     "style": {
//                         "backgroundImage": {
//                             "url": "url(https://images.unsplash.com/photo-1694746275918-ee610b64151c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NzM1Nzl8MHwxfHNlYXJjaHw0fHx0cmlwJTIwdG8lMjBqYXBhbnxlbnwwfHx8fDE3MzIwNTMyNTZ8MA&ixlib=rb-4.0.3&q=80&w=400)",
//                             "bgColor": "#ffffff",
//                             "imgId": "img002",
//                             "source": "fromAttach",
//                             "isCover": false
//                         }
//                     },
//                     "startDate": null,
//                     "dueTime": "2024-11-20T19:48:49.707Z"
//                 }
//             ],
//             "isCollapse": false
//         },
//         {
//             "id": "id004",
//             "title": "Budget Planning",
//             "style": {
//                 "backgroundColor": "#CCE0FF"
//             },
//             "tasks": [
//                 {
//                     "id": "task006",
//                     "title": "Book Flights",
//                     "status": "notStarted",
//                     "dueDate": "2024-11-30",
//                     "description": "Book round-trip flights to Japan",
//                     "checklists": [
//                         {
//                             "id": "7bhomA",
//                             "title": "Checklist",
//                             "todos": []
//                         }
//                     ],
//                     "memberIds": [
//                         "6737239f06c9b704f4964439"
//                     ],
//                     "labelIds": [
//                         "l103"
//                     ],
//                     "style": {
//                         "backgroundColor": "#579DFF"
//                     }
//                 },
//                 {
//                     "id": "task008",
//                     "title": "Set Budget",
//                     "status": "notStarted",
//                     "dueDate": "2024-11-25",
//                     "description": "Determine total budget for the trip",
//                     "checklists": [],
//                     "memberIds": [],
//                     "labelIds": [
//                         "l103"
//                     ],
//                     "style": {
//                         "backgroundColor": "#FEA362"
//                     },
//                     "archivedAt": 1732093673921
//                 },
//                 {
//                     "id": "task009",
//                     "title": "Track Expenses",
//                     "status": "notStarted",
//                     "dueDate": "2025-01-05",
//                     "description": "Keep a record of all expenses during the trip",
//                     "checklists": [],
//                     "memberIds": [
//                         "6737239f06c9b704f4964438"
//                     ],
//                     "labelIds": [
//                         "l103"
//                     ],
//                     "style": {
//                         "backgroundColor": "#FEA362"
//                     }
//                 }
//             ]
//         }
//     ],
//     "activities": [
//         {
//             "txt": "added Checklist to card \"Book Flights\"",
//             "boardId": "673d091df8fd713a6e2d303a",
//             "groupId": "id004",
//             "taskId": "task006",
//             "byMember": {
//                 "_id": "673a4e6607432cd340d8bdb2",
//                 "fullname": "Guest",
//                 "imgUrl": "/img/user/user-default.png"
//             },
//             "createdAt": 1732053375510
//         }
//     ],
//     "createdAt": 1732053276863,
//     "createdBy": {
//         "_id": "6737239f06c9b704f496443a",
//         "fullname": "Gal Ben David",
//         "imgUrl": "/img/user/gal.png"
//     },
//     "urls": {
//         "raw": "https://images.unsplash.com/photo-1672024526452-496bea4e89b5?ixid=M3w2NzM1Nzl8MHwxfHNlYXJjaHwxfHx0cmlwJTIwdG8lMjBqYXBhbnxlbnwwfHx8fDE3MzIwNTMyNTZ8MA&ixlib=rb-4.0.3",
//         "full": "https://images.unsplash.com/photo-1672024526452-496bea4e89b5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w2NzM1Nzl8MHwxfHNlYXJjaHwxfHx0cmlwJTIwdG8lMjBqYXBhbnxlbnwwfHx8fDE3MzIwNTMyNTZ8MA&ixlib=rb-4.0.3&q=85",
//         "regular": "https://images.unsplash.com/photo-1672024526452-496bea4e89b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NzM1Nzl8MHwxfHNlYXJjaHwxfHx0cmlwJTIwdG8lMjBqYXBhbnxlbnwwfHx8fDE3MzIwNTMyNTZ8MA&ixlib=rb-4.0.3&q=80&w=1080",
//         "small": "https://images.unsplash.com/photo-1672024526452-496bea4e89b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NzM1Nzl8MHwxfHNlYXJjaHwxfHx0cmlwJTIwdG8lMjBqYXBhbnxlbnwwfHx8fDE3MzIwNTMyNTZ8MA&ixlib=rb-4.0.3&q=80&w=400",
//         "thumb": "https://images.unsplash.com/photo-1672024526452-496bea4e89b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NzM1Nzl8MHwxfHNlYXJjaHwxfHx0cmlwJTIwdG8lMjBqYXBhbnxlbnwwfHx8fDE3MzIwNTMyNTZ8MA&ixlib=rb-4.0.3&q=80&w=200",
//         "small_s3": "https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1672024526452-496bea4e89b5"
//     },
//     "style": {
//         "backgroundImage": "url(https://images.unsplash.com/photo-1672024526452-496bea4e89b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NzM1Nzl8MHwxfHNlYXJjaHwxfHx0cmlwJTIwdG8lMjBqYXBhbnxlbnwwfHx8fDE3MzIwNTMyNTZ8MA&ixlib=rb-4.0.3&q=80&w=1080)"
//     },
//     "isClosed": null
// }

/*



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
*/
