const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const Filter = require('bad-words')
const { generateMessage, generatelocationmsg } = require('./utils/messages')
const { addUser, removeUser, getUser, getuserroomname } = require("./utils/users")


const app = express()
const server = http.createServer(app)
const io = socketio(server)


const PORT = process.env.PORT || 3000
const publicdirectorypath = path.join(__dirname, '../public')
app.use(express.static(publicdirectorypath))


io.on('connection', (socket) => {
    console.log("New web socket connection")

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getuserroomname(user.room)
        })

        callback()
    })
    socket.on('data-sended', (data, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(data)) {
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, data))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getuserroomname(user.room)
            })
        }
    })
    socket.on('sendLocation', (newpos, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationmessage', generatelocationmsg(user.username, `https://www.google.com/maps?q=${newpos.latitude},${newpos.longitude}`))
        callback()
    })





})

server.listen(PORT, () => {
    console.log("Listening on port " + PORT)

})