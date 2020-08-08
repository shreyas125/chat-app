const socket = io()
    //Elements
const $messageforms = document.querySelector('button')
const $messageforminput = document.querySelector('#mymsg')
const $sendloc = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')



//templates
const msgtemplate = document.querySelector('#message-template').innerHTML
const linktemplate = document.querySelector('#link-template').innerHTML
const sidebartemplate = document.querySelector('#sidebar-template').innerHTML

//
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScrol = () => {
    // new message element
    const $newmessage = $messages.lastElementChild
        //height of new message
    const newMessageStyle = getComputedStyle($newmessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newmessage.offsetHeight + newMessageMargin

    console.log(newMessageMargin)
    const visibleHeight = $messages.offsetHeight
    const contentHeight = $messages.scrollHeight
    const scrolOffset = $messages.scrollTop + visibleHeight
    if (contentHeight - newMessageHeight <= scrolOffset) {
        $messages.scrollTop = $messages.scrollHeight

    }


}

socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render(msgtemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')

    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScrol()
})

socket.on('locationmessage', (message) => {

    const newht = Mustache.render(linktemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')


    })
    $messages.insertAdjacentHTML('beforeend', newht)
    autoScrol()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebartemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html

})

$messageforms.addEventListener('click', (e) => {
    e.preventDefault()
    $messageforms.setAttribute('disabled', 'disabled')
    let data = $messageforminput.value
    socket.emit("data-sended", data, (error) => {
        $messageforms.removeAttribute('disabled')
        $messageforminput.value = ""
        $messageforminput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered')

    })

})
document.querySelector('#send-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser!!")
    }
    navigator.geolocation.getCurrentPosition((position) => {
        newpos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        $sendloc.setAttribute('disabled', 'disabled')
        socket.emit('sendLocation', newpos, (error) => {
            if (error) {
                return console.log(error)
            }
            console.log("Location is shared")
            $sendloc.removeAttribute('disabled')
        })

    })
})
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }

})