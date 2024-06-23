import axios from 'axios'
import {
  generateKeyPair,
  storePrivateKey,
  storeEncryptedGroupKey,
} from './Crypto'

axios.defaults.withCredentials = true

const serverUrl = 'https://kjb22.teaching.cs.st-andrews.ac.uk'

const registerService = async (args) => {
  const [username, password] = args

  try {
    const keyPair = await generateKeyPair()
    console.log(keyPair.privateKey)
    await storePrivateKey(keyPair.privateKey)

    // const publicKey = await exportPublicKey(keyPair)
    const publicKey = keyPair.publicKey

    const response = await axios.post(`${serverUrl}/auth/register`, {
      username,
      password,
      publicKey: publicKey,
    })

    return 'Registration Successful: ' + response.data
  } catch (error) {
    // Check if the error response exists and has a data property
    if (error.response && error.response.data) {
      return 'Registration Failed: ' + error.response.data
    } else {
      // If the error response does not have data or is not available
      return 'Registration Failed: ' + error.message
    }
  }
}

const loginService = async (args) => {
  const [username, password] = args
  try {
    const response = await axios.post(`${serverUrl}/auth/login`, {
      username,
      password,
    })
    // Check the response data to determine the status of the login attempt
    return response.data
  } catch (error) {
    return 'Login Failed: Error communicating with the server'
  }
}

const logoutService = async () => {
  try {
    const response = await axios.post(`${serverUrl}/auth/logout`)
    // Check the response data to determine the status of the logout attempt
    return response.data
  } catch (error) {
    return error.message
  }
}

const createGroupService = async (args) => {
  const groupName = args[0]
  try {
    const response = await axios.post(`${serverUrl}/groups/create-group`, {
      groupName,
    })
    const groupCode = response.data.groupCode
    const encryptedGroupKey = response.data.encryptedGroupKey
    console.log(encryptedGroupKey)

    // Store the encrypted group key in IndexedDB
    await storeEncryptedGroupKey(groupName, encryptedGroupKey)

    return 'Group created successfully. Group code: ' + groupCode
  } catch (error) {
    if (error.response.dat) {
      return 'Error creating group: ' + error.response.data
    }
    return 'Error creating group: ' + error.message
  }
}

const requestJoinGroupService = async (groupCode) => {
  try {
    const response = await axios.post(
      `${serverUrl}/groups/request-join-group`,
      {
        groupCode,
      }
    )
    const encryptedGroupKey = response.data.encryptedGroupKey
    const groupName = response.data.groupName
    // Store the encrypted group key in IndexedDB
    await storeEncryptedGroupKey(groupName, encryptedGroupKey)

    return 'Join request sent successfully. Appending approval'
  } catch (error) {
    return 'Error sending join request: ' + error.message
  }
}

const acceptJoinRequestService = async (args) => {
  const requestUsername = args[0]
  const groupName = args[1]
  try {
    await axios.post(`${serverUrl}/groups/accept-join-request`, {
      requestUsername,
      groupName,
    })
    return 'Join request accepted for ' + requestUsername + ' in ' + groupName
  } catch (error) {
    return 'Error accepting join request: ' + error.response.data
  }
}

const myGroupsService = async () => {
  try {
    const response = await axios.get(`${serverUrl}/groups/my-groups`)
    return response.data
  } catch (error) {
    return []
  }
}

const myGroupsRequestsService = async () => {
  try {
    const response = await axios.get(`${serverUrl}/groups/my-groups-requests`)
    return response.data
  } catch (error) {
    return []
  }
}
const checkSessionService = async () => {
  try {
    const response = await axios.get(`${serverUrl}/auth/check-session`)
    return response.data.loggedIn
  } catch (error) {
    return false
  }
}

const createPostService = async (groupName, encryptedContent) => {
  try {
    await axios.post(`${serverUrl}/posts/create-post`, {
      groupName,
      encryptedContent,
    })
    return 'Post created successfully'
  } catch (error) {
    return 'Error creating post: ' + error.message
  }
}

const getGroupPostsService = async (groupName) => {
  try {
    const response = await axios.get(
      `${serverUrl}/posts/group-posts/${groupName}`
    )
    return response.data
  } catch (error) {
    return 'Error retrieving posts: ' + error.message
  }
}

export {
  registerService,
  loginService,
  logoutService,
  createGroupService,
  requestJoinGroupService,
  acceptJoinRequestService,
  myGroupsService,
  myGroupsRequestsService,
  checkSessionService,
  createPostService,
  getGroupPostsService,
}
