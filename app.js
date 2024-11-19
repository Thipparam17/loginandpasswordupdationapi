const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const bcrypt = require('bcrypt')
let db = null

const initializedbandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server started')
    })
  } catch (e) {
    console.log(`Db error ${e.message}`)
    process.exit(1)
  }
}
initializedbandserver()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedpassword = await bcrypt.hash(password, 10)
  const selectQuery = `select * from user where username = '${username}'`
  const dbuser = await db.get(selectQuery)
  if (dbuser === undefined) {
    const createqurey = `insert into user (
      username,name,password,gender,location
    )
    values (
      '${username}',
      '${name}',
      '${hashedpassword}',
      '${gender}',
      '${location}'
    )
    `
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const dbresponse = await db.run(createqurey)
      const newuserid = dbresponse.lastID
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//api-2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectquery = `select * from user where username='${username}'`
  const dbuser = await db.get(selectquery)
  if (dbuser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const ispassword = await bcrypt.compare(password, dbuser.password)
    if (ispassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectquery = `select * from user where username='${username}'`
  const dbuser = await db.get(selectquery)
  if (dbuser === undefined) {
    response.status(400)
    response.send('user not registerd')
  } else {
    const ispassword = await bcrypt.compare(oldPassword, dbuser.password)
    if (ispassword === true) {
      const newpasswordlength = newPassword.length
      if (newpasswordlength < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptedpassword = await bcrypt.hash(newPassword, 10)
        const updatedpassword = `update user set password ='${encryptedpassword}'
      where username='${username}'`
        await db.run(updatedpassword)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
