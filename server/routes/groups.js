const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../utils/authUtils')
const {
  generateGroupCode,
  generateGroupKey,
  encryptWithPublicKey,
  encryptGroupKey,
  decryptGroupKey,
} = require('../utils/groupsUtils')

// router.post('/create-group', authenticateToken, async (req, res) => {
//   const { groupName } = req.body
//   const userId = req.user.userId
//   const groupCode = generateGroupCode()
//   const groupKey = generateGroupKey() // Generate the group key
//   let conn

//   try {
//     conn = await pool.getConnection()
//     await conn.beginTransaction()

//     // Insert the new group along with the generated group key
//     const insertGroupQuery =
//       'INSERT INTO groups (name, group_code, group_key) VALUES (?, ?, ?)'
//     const groupResult = await conn.query(insertGroupQuery, [
//       groupName,
//       groupCode,
//       groupKey,
//     ])
//     const groupId = groupResult.insertId

//     // Insert the user as a member of the new group
//     await conn.query(
//       'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
//       [groupId, userId]
//     )

//     // Fetch user's public key
//     const userResult = await conn.query(
//       'SELECT public_key FROM users WHERE id = ?',
//       [userId]
//     )
//     const userPublicKey = userResult[0].public_key

//     // Encrypt the group key
//     const encryptedGroupKey = encryptWithPublicKey(userPublicKey, groupKey)

//     await conn.commit()
//     res.send({ groupCode, encryptedGroupKey })
//   } catch (error) {
//     if (conn) await conn.rollback()
//     res.status(500).send('Error creating group: ' + error.message)
//     console.log(error.message)
//   } finally {
//     if (conn) conn.end()
//   }
// })

router.post('/create-group', authenticateToken, async (req, res) => {
  const { groupName } = req.body
  const userId = req.user.userId
  const groupCode = generateGroupCode()
  const groupKey = generateGroupKey() // Generate the group key

  let conn

  try {
    // const dbEncryptedGroupKey = encryptGroupKey(groupKey) // Assuming encryptGroupKey properly encrypts the key

    conn = await pool.getConnection()
    await conn.beginTransaction()

    // Check if a group with the same name already exists
    const existingGroupQuery = 'SELECT id FROM groups WHERE name = ?'
    const existingGroup = await conn.query(existingGroupQuery, [groupName])
    if (existingGroup.length > 0) {
      // Group name already exists
      await conn.rollback()
      return res.status(409).send('Group name already exists') // 409 Conflict
    }

    // Insert the new group along with the generated group key
    const insertGroupQuery =
      'INSERT INTO groups (name, group_code, group_key) VALUES (?, ?, ?)'
    const groupResult = await conn.query(insertGroupQuery, [
      groupName,
      groupCode,
      groupKey,
    ])
    const groupId = groupResult.insertId

    // Insert the user as a member of the new group
    await conn.query(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, userId]
    )

    // Fetch user's public key
    const userResult = await conn.query(
      'SELECT public_key FROM users WHERE id = ?',
      [userId]
    )
    const userPublicKey = userResult[0].public_key

    // Encrypt the group key
    const encryptedGroupKey = encryptWithPublicKey(userPublicKey, groupKey)

    await conn.commit()
    res.send({ groupCode, encryptedGroupKey })
  } catch (error) {
    if (conn) await conn.rollback()
    res.status(500).send('Error creating group: ' + error.message)
    console.log(error.message)
  } finally {
    if (conn) conn.end()
  }
})

// router.post('/request-join-group', authenticateToken, async (req, res) => {
//   const { groupCode } = req.body
//   const userId = req.user.userId
//   let conn

//   try {
//     conn = await pool.getConnection()
//     const groupQuery = 'SELECT id FROM groups WHERE group_code = ?'
//     const group = await conn.query(groupQuery, [groupCode])

//     if (group.length === 0) {
//       res.status(404).send('Group not found')
//       return
//     }

//     const insertQuery =
//       'INSERT INTO group_join_requests (group_id, user_id) VALUES (?, ?)'
//     await conn.query(insertQuery, [group[0].id, userId])
//     res.send('Join request sent')
//   } catch (error) {
//     res.status(500).send('Error processing request')
//   } finally {
//     if (conn) conn.end()
//   }
// })

router.post('/request-join-group', authenticateToken, async (req, res) => {
  const { groupCode } = req.body
  const userId = req.user.userId
  let conn

  try {
    conn = await pool.getConnection()

    // Step 1: Fetch group information along with its key
    const groupQuery =
      'SELECT id, group_key, name FROM groups WHERE group_code = ?'
    const group = await conn.query(groupQuery, [groupCode])

    if (group.length === 0) {
      res.status(404).send('Group not found')
      return
    }

    const groupId = group[0].id
    const groupKey = group[0].group_key // Assuming it's in a suitable format for encryption
    const groupName = group[0].name

    // Step 2: Fetch user's public key
    const userQuery = 'SELECT public_key FROM users WHERE id = ?'
    const user = await conn.query(userQuery, [userId])

    if (user.length === 0) {
      res.status(404).send('User not found')
      return
    }

    const userPublicKey = user[0].public_key

    // Step 3: Encrypt the group key with the user's public key
    const encryptedGroupKey = encryptWithPublicKey(userPublicKey, groupKey)

    // Step 4: Insert join request
    const insertQuery =
      'INSERT INTO group_join_requests (group_id, user_id) VALUES (?, ?)'
    await conn.query(insertQuery, [groupId, userId])

    res.json({
      message: 'Join request sent',
      encryptedGroupKey: encryptedGroupKey,
      groupName: groupName,
    })
  } catch (error) {
    res.status(500).send('Error processing request: ' + error.message)
  } finally {
    if (conn) conn.end()
  }
})

router.post('/accept-join-request', authenticateToken, async (req, res) => {
  const { requestUsername, groupName } = req.body
  const userId = req.user.userId
  let conn

  try {
    conn = await pool.getConnection()

    // Fetch the group information
    const groupQuery = 'SELECT id FROM groups WHERE name = ?'
    const group = await conn.query(groupQuery, [groupName])

    if (group.length === 0) {
      res.status(404).send('Group not found')
      return
    }
    const groupId = group[0].id

    // Verify if the user is part of the group
    const memberQuery =
      'SELECT * FROM group_members WHERE user_id = ? AND group_id = ?'
    const member = await conn.query(memberQuery, [userId, groupId])

    if (member.length === 0) {
      res.status(403).send('Not a member of the group')
      return
    }

    // Find the join request ID using requestUsername
    const requestUserQuery = 'SELECT id FROM users WHERE username = ?'
    const requestUser = await conn.query(requestUserQuery, [requestUsername])

    if (requestUser.length === 0) {
      res.status(404).send('Request user not found')
      return
    }
    const requestUserId = requestUser[0].id

    const joinRequestQuery =
      'SELECT id FROM group_join_requests WHERE user_id = ? AND group_id = ? AND status = "pending"'
    const joinRequest = await conn.query(joinRequestQuery, [
      requestUserId,
      groupId,
    ])

    if (joinRequest.length === 0) {
      res.status(404).send('Join request not found')
      return
    }
    const requestId = joinRequest[0].id

    // Update the group_join_requests table
    const updateJoinRequestQuery =
      'UPDATE group_join_requests SET status = "accepted" WHERE id = ?'
    await conn.query(updateJoinRequestQuery, [requestId])

    // Add the requester to the group_members table
    const insertMemberQuery =
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)'
    await conn.query(insertMemberQuery, [groupId, requestUserId])

    res.send('Join request accepted and user added to the group')
  } catch (error) {
    res.status(500).send('Error processing request: ' + error.message)
  } finally {
    if (conn) conn.end()
  }
})

router.get('/my-groups', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  let conn

  try {
    conn = await pool.getConnection()
    const query = `
          SELECT g.id, g.name, g.group_code
          FROM groups AS g
          JOIN group_members AS gm ON g.id = gm.group_id
          WHERE gm.user_id = ?`
    const userGroups = await conn.query(query, [userId])
    res.json(userGroups)
  } catch (error) {
    res.status(500).send('Error fetching groups')
  } finally {
    if (conn) conn.end()
  }
})

// router.get('/my-groups', authenticateToken, async (req, res) => {
//   const userId = req.user.userId
//   let conn

//   try {
//     conn = await pool.getConnection()

//     // Modified query to also select the group_key
//     const query = `
//       SELECT g.id, g.name, g.group_code, g.group_key, g.iv
//       FROM groups AS g
//       JOIN group_members AS gm ON g.id = gm.group_id
//       WHERE gm.user_id = ?`

//     const userGroups = await conn.query(query, [userId])

//     // Fetch user's public key
//     const userResult = await conn.query(
//       'SELECT public_key FROM users WHERE id = ?',
//       [userId]
//     )
//     const userPublicKey = userResult[0].public_key

//     // Encrypt the group keys with the user's public key before sending them
//     const groupsWithEncryptedKeys = userGroups.map((group) => {
//       const dbDecryptedGroupKey = decryptGroupKey(group.group_key, group.iv)
//       console.log(dbDecryptedGroupKey)

//       const encryptedGroupKey = encryptWithPublicKey(
//         userPublicKey,
//         dbDecryptedGroupKey
//       )
//       return {
//         id: group.id,
//         name: group.name,
//         group_code: group.group_code,
//         encryptedGroupKey: encryptedGroupKey,
//       }
//     })

//     res.json(groupsWithEncryptedKeys)
//   } catch (error) {
//     res.status(500).send('Error fetching groups: ' + error.message)
//     console.log(error.message)
//   } finally {
//     if (conn) conn.end()
//   }
// })

router.get('/my-groups-requests', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  let conn

  try {
    conn = await pool.getConnection()

    // Get all group IDs where the user is a member
    const groupsQuery = `
      SELECT gm.group_id, g.name AS group_name
      FROM group_members AS gm
      JOIN groups AS g ON gm.group_id = g.id
      WHERE gm.user_id = ?`
    const groupsResult = await conn.query(groupsQuery, [userId])

    const groupIds = groupsResult.map((row) => row.group_id)

    if (groupIds.length === 0) {
      // User isn't a member of any groups
      return res.json([])
    }

    // Get all join requests for these groups including the requester's username
    const requestsQuery = `
      SELECT gjr.group_id, gjr.user_id, u.username AS requester_username, g.name AS group_name
      FROM group_join_requests AS gjr
      JOIN users AS u ON gjr.user_id = u.id
      JOIN groups AS g ON gjr.group_id = g.id
      WHERE gjr.group_id IN (?) AND gjr.status = 'pending'`
    const requestsResult = await conn.query(requestsQuery, [groupIds])
    res.json(requestsResult)
  } catch (error) {
    res.status(500).send('Error fetching join requests: ' + error.message)
  } finally {
    if (conn) conn.end()
  }
})

module.exports = router
