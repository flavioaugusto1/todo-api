import express from 'express'
import { randomUUID } from 'crypto'

const app = express()

app.use(express.json())

const users = []

function verifyUsernameExists(request, response, next) {
    const { username } = request.headers

    const user = users.find((user) => user.username === username)

    if (!user) {
        return response.status(404).json({ error: 'Usuário não encontrado' })
    }

    request.user = user
    next()
}

app.post('/users', (request, response) => {
    const { name, username } = request.body

    users.push({
        id: randomUUID(),
        name,
        username,
        todos: [],
    })

    response.status(201).send()
})

app.use(verifyUsernameExists)

app.get('/todos', (request, response) => {
    const { user } = request

    return response.json(user.todos)
})

app.post('/todos', (request, response) => {
    const { user } = request
    const { title, deadline } = request.body

    const newTask = {
        id: randomUUID(),
        title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date(),
    }

    user.todos.push(newTask)

    return response.status(200).json(newTask)
})

app.put('/todos/:id', (request, response) => {
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

app.patch('/todos/:id/done', (request, response) => {
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

app.delete('/todos/:id', (request, response) => {
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
