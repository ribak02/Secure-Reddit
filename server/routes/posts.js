const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../utils/authUtils')

router.post('/create-post', authenticateToken, async (req, res) => {
  const { groupName, encryptedContent } = req.body
  const content = encryptedContent.encryptedContent
  const iv = encryptedContent.iv
  const tag = encryptedContent.tag
  const userId = req.user.userId
  let conn

  try {
    conn = await pool.getConnection()

    // First, get the group ID from the group name
    const groupQuery = 'SELECT id FROM groups WHERE name = ?'
    const groupResult = await conn.query(groupQuery, [groupName])
    if (groupResult.length === 0) {
      return res.status(404).send('Group not found')
    }
    const groupId = groupResult[0].id

    // Now, insert the post
    const insertQuery =
      'INSERT INTO posts (group_id, user_id, content, iv, tag) VALUES (?, ?, ?, ?, ?)'
    await conn.query(insertQuery, [groupId, userId, content, iv, tag])
    res.status(201).send('Post created successfully')
  } catch (error) {
    res.status(500).send('Error creating post')
  } finally {
    if (conn) conn.end()
  }
})

router.get('/group-posts/:groupName', authenticateToken, async (req, res) => {
  const groupName = req.params.groupName
  const userId = req.user.userId
  let conn

  try {
    conn = await pool.getConnection()

    // First, get the group ID from the group name
    const groupQuery = 'SELECT id FROM groups WHERE name = ?'
    const groupResult = await conn.query(groupQuery, [groupName])
    if (groupResult.length === 0) {
      return res.status(404).send('Group not found')
    }
    const groupId = groupResult[0].id

    // Check if the user is part of the group
    const memberQuery =
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?'
    const memberResult = await conn.query(memberQuery, [groupId, userId])
    if (memberResult.length === 0) {
      return res.status(403).send('Access denied')
    }

    // Now, retrieve the posts
    const query = 'SELECT * FROM posts WHERE group_id = ?'
    const posts = await conn.query(query, [groupId])
    res.json(posts)
  } catch (error) {
    res.status(500).send('Error retrieving posts')
  } finally {
    if (conn) conn.end()
  }
})

module.exports = router
