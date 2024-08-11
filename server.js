import express from 'express'
import { v4, validate } from 'uuid'

const app = express()

app.use(express.json())

const users = []

// function verifyUsernameExists(request, response, next) {
//     const { username } = request.headers

//     const user = users.find((user) => user.username === username)

//     if (!user) {
//         return response.status(404).json({ error: 'Usuário não encontrado' })
//     }

//     request.user = user
//     next()
// }

function checksCreateTodosUserAvailability(request, response, next) {
    const { id } = request.headers

    const user = users.find((user) => user.id === id)

    if ((!user.pro && user.todos.length < 10) || user.pro) {
        next()
    }

    return response
        .status(400)
        .json({ error: 'Você não pode cadastrar mais tasks' })
}

function checksTodoExists(request, response, next) {
    const userID = request.headers.id
    const { id } = request.params

    if (!validate(id)) {
        return response
            .status(400)
            .json({ error: 'Você informou um ID de task inválido' })
    }

    const user = users.find((user) => user.id === userID)

    if (!user) {
        return response
            .status(400)
            .json({ error: 'Você informou um usuário que não existe' })
    }

    const verifyIfExistTaskInUser = user.todos.some((task) => task.id === id)

    if (!verifyIfExistTaskInUser) {
        return response.status(400).json({
            error: 'Você informou uma task que não existe para esse usuário',
        })
    }

    next()
}

function findUserById(request, response, next) {
    const { id } = request.headers

    const user = users.find((user) => user.id === id)

    if (!user) {
        return response.status(404).json({ error: 'Usuário não encontrado' })
    }

    request.user = user
    next()
}

app.post('/users', (request, response) => {
    const { name, username } = request.body

    const newUser = {
        id: v4(),
        name,
        pro: false,
        username,
        todos: [],
    }

    users.push(newUser)

    response.status(201).json({ id: newUser.id })
})

app.use(findUserById)

app.get('/todos', checksCreateTodosUserAvailability, (request, response) => {
    const { user } = request

    return response.json(user.todos)
})

app.post('/todos', (request, response) => {
    const { user } = request
    const { title, deadline } = request.body

    const newTask = {
        id: v4(),
        title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date(),
    }

    user.todos.push(newTask)

    return response.status(200).json(newTask)
})

app.put('/todos/:id', checksTodoExists, (request, response) => {
    const { user } = request
    const { id } = request.params
    const { title, deadline } = request.body

    const task = user.todos.find((task) => {
        return task.id == id
    })

    if (!task) {
        return response.status(404).send({ error: 'Task não localizada' })
    }

    task.title = title ?? task.title
    task.deadline = deadline ? new Date(deadline) : task.deadline

    return response.send({ message: 'Tarefa atualizada com sucesso' })
})

app.patch('/todos/:id/done', checksTodoExists, (request, response) => {
    const { user } = request
    const { id } = request.params

    const task = user.todos.find((task) => {
        return task.id === id
    })

    if (!task) {
        return response.status(404).send({ error: 'Task não localizada' })
    }

    task.done = true

    return response.status(204).send()
})

app.delete('/todos/:id', checksTodoExists, (request, response) => {
    const { user } = request
    const { id } = request.params

    const taskPositionInList = user.todos.findIndex((task) => {
        return task.id === id
    })

    if (taskPositionInList < 0) {
        return response.status(404).send({ error: 'Task não localizada' })
    }

    user.todos.splice(taskPositionInList, 1)

    return response.status(204).json({ message: 'Tarefa deletada com sucesso' })
})

app.listen(3333, () => {
    console.log('Server is running')
})
