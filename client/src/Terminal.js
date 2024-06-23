import React, { useState, useEffect } from 'react'
import './Terminal.css'
import {
  loginService,
  logoutService,
  registerService,
  requestJoinGroupService,
  acceptJoinRequestService,
  createGroupService,
  myGroupsService,
  myGroupsRequestsService,
  checkSessionService,
  createPostService,
  getGroupPostsService,
} from './Service.js'

import {
  getDecryptedGroupKey,
  encryptContentWithGroupKey,
  decryptContentWithGroupKey,
  storeEncryptedGroupKey,
  clearStoredGroupKeys,
} from './Crypto.js'

const Terminal = () => {
  const [output, setOutput] = useState(
    'Welcome to the Secure Discussion Forum.\nType "register" or "login" followed by required arguments.\nType "help" for a list of commands\n'
  )
  const [input, setInput] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  const [isWaitingForInput, setIsWaitingForInput] = useState(false)
  const [inputPromiseResolve, setInputPromiseResolve] = useState(null)

  useEffect(() => {
    const checkSession = async () => {
      const response = await checkSessionService()
      if (response) {
        setLoggedIn(true)
        writeToTerminal('You are already logged in\n')
      }
    }

    checkSession()
  }, [])

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      if (isWaitingForInput && inputPromiseResolve) {
        inputPromiseResolve(input)
        setInputPromiseResolve(null)
        setIsWaitingForInput(false)
        setInput('') // Clear the input after it's captured
      } else {
        processCommand(input)
        setInput('')
      }
    }
  }

  const waitForUserInput = () => {
    setIsWaitingForInput(true)
    return new Promise((resolve) => {
      setInputPromiseResolve(() => resolve)
    })
  }

  const help = async (args) => {
    if (args.length !== 0) {
      writeToTerminal('Usage: help\n')
      return
    }
    writeToTerminal(
      'Commands:\n -> Auth: login | register | logout\n -> Groups: mygroups | creategroup | joingroup | acceptrequest | myrequests\n -> Posts: createpost | viewposts \n'
    )
  }

  const register = async (args) => {
    if (args.length !== 2) {
      writeToTerminal('Usage: register <username> <password>\n')
      return
    }
    if (loggedIn) {
      writeToTerminal('Already logged in. Please log out before registering.\n')
      return
    }

    writeToTerminal((await registerService(args)) + '\n')
  }

  const login = async (args) => {
    if (args.length !== 2) {
      writeToTerminal('Usage: login <username> <password>\n')
      return
    }
    if (loggedIn) {
      writeToTerminal(
        'Already logged in. Please log out before trying to log in again.\n'
      )
      return
    }
    const response = await loginService(args)
    let message
    if (response === 'Login successful') {
      setLoggedIn(true)
      message = 'Logged in as: ' + args[0]
    } else {
      message = response
    }
    writeToTerminal(message + '\n')
  }

  const logout = async (args) => {
    if (args.length !== 0) {
      writeToTerminal('Usage: logout\n')
      return
    }
    if (!loggedIn) {
      writeToTerminal('Not logged in\n')
      return
    }
    setLoggedIn(false)
    writeToTerminal((await logoutService()) + '\n')
  }

  const createGroup = async (args) => {
    if (args.length !== 1) {
      writeToTerminal('Usage: creategroup <group_name>\n')
      return
    }
    if (!loggedIn) {
      writeToTerminal('Must log in before using this command\n')
      return
    }
    writeToTerminal((await createGroupService(args)) + '\n')
  }

  const myGroups = async (args) => {
    if (args.length !== 0) {
      writeToTerminal('Usage: mygroups\n')
      return
    }
    if (!loggedIn) {
      writeToTerminal('You must be logged in to view your groups.\n')
      return
    }

    try {
      const groups = await myGroupsService()

      if (groups.length === 0) {
        writeToTerminal('You are not a member of any groups.\n')
        return
      }

      const groupsDisplay = groups
        .map((group) => `Group: ${group.name}, Code: ${group.group_code}`)
        .join('\n')
      writeToTerminal(`Your Groups:\n${groupsDisplay}\n`)
    } catch (error) {
      writeToTerminal('Error: ' + error.message + '\n')
    }
  }

  const myGroupsRequests = async (args) => {
    if (args.length !== 0) {
      writeToTerminal('Usage: myrequests\n')
      return
    }
    if (!loggedIn) {
      writeToTerminal('You must be logged in to view join requests.\n')
      return
    }

    const joinRequests = await myGroupsRequestsService()

    if (joinRequests.length === 0) {
      writeToTerminal('There are no pending join requests.\n')
      return
    }

    const requestsDisplay = joinRequests
      .map(
        (req) =>
          `Group: ${req.group_name}, Requester: ${req.requester_username}`
      )
      .join('\n')
    writeToTerminal(`Pending Join Requests:\n${requestsDisplay}\n`)
  }

  const requestJoinGroup = async (args) => {
    if (args.length !== 1) {
      writeToTerminal('Usage: joingroup <group_code>\n')
      return
    }
    if (!loggedIn) {
      writeToTerminal('Must log in before using this command\n')
      return
    }
    writeToTerminal((await requestJoinGroupService(args[0])) + '\n')
  }

  const acceptJoinRequest = async (args) => {
    if (args.length !== 2) {
      writeToTerminal('Usage: acceptrequest <username> <group_name>\n')
      return
    }
    if (!loggedIn) {
      writeToTerminal('Must log in before using this command\n')
      return
    }
    writeToTerminal((await acceptJoinRequestService(args)) + '\n')
  }

  const createPost = async (args) => {
    if (args.length < 2) {
      writeToTerminal('Usage: createpost <group_name> <content>\n')
      return
    }
    if (!loggedIn) {
      writeToTerminal('You must be logged in to create a post.\n')
      return
    }
    const groupName = args[0]
    const content = args.slice(1).join(' ')

    writeToTerminal('Enter your private key to create a post:\n')
    const privateKey = await waitForUserInput() // Function to wait for user input
    console.log(privateKey)

    try {
      const groupKey = await getDecryptedGroupKey(groupName, privateKey)
      const encryptedContent = await encryptContentWithGroupKey(
        groupKey,
        content
      )
      writeToTerminal(
        (await createPostService(groupName, encryptedContent)) + '\n'
      )
    } catch (error) {
      writeToTerminal('Error: ' + error.message + '\n')
    }
  }

  const viewGroupPosts = async (args) => {
    if (args.length !== 1) {
      writeToTerminal('Usage: viewposts <group_name>\n')
      return
    }
    if (!loggedIn) {
      writeToTerminal('You must be logged in to view posts.\n')
      return
    }

    const groupName = args[0]
    writeToTerminal('Enter your private key to view posts:\n')
    const privateKey = await waitForUserInput() // Function to wait for user input

    try {
      const posts = await getGroupPostsService(groupName)
      const groupKey = await getDecryptedGroupKey(groupName, privateKey) // Assuming the function now also takes the private key

      if (Array.isArray(posts)) {
        const postsDisplay = await Promise.all(
          posts.map(async (post) => {
            const decryptedContent = await decryptContentWithGroupKey(
              groupKey,
              post.content,
              post.iv,
              post.tag
            )
            return `Post: ${decryptedContent}`
          })
        )
        writeToTerminal(`Group Posts:\n${postsDisplay.join('\n')}\n`)
      } else {
        writeToTerminal(posts + '\n')
      }
    } catch (error) {
      writeToTerminal('Error: ' + error.message + '\n')
    }
  }

  // const createPost = async (args) => {
  //   if (args.length < 2) {
  //     writeToTerminal('Usage: createpost <group_name> <content>\n')
  //     return
  //   }
  //   if (!loggedIn) {
  //     writeToTerminal('You must be logged in to create a post.\n')
  //     return
  //   }
  //   const groupName = args[0]
  //   const content = args.slice(1).join(' ')

  //   try {
  //     const groupKey = await getDecryptedGroupKey(groupName)
  //     // console.log(groupKey)
  //     const encryptedContent = await encryptContentWithGroupKey(
  //       groupKey,
  //       content
  //     )
  //     console.log(encryptedContent)
  //     writeToTerminal(
  //       (await createPostService(groupName, encryptedContent)) + '\n'
  //     )
  //   } catch (error) {
  //     writeToTerminal('Error: ' + error.message + '\n')
  //   }

  //   //writeToTerminal((await createPostService(groupName, content)) + '\n')
  // }

  // const viewGroupPosts = async (args) => {
  //   if (args.length !== 1) {
  //     writeToTerminal('Usage: viewposts <group_id>\n')
  //     return
  //   }
  //   if (!loggedIn) {
  //     writeToTerminal('You must be logged in to view posts.\n')
  //     return
  //   }

  //   const groupName = args[0]

  //   try {
  //     const posts = await getGroupPostsService(groupName)
  //     const groupKey = await getDecryptedGroupKey(groupName)

  //     if (Array.isArray(posts)) {
  //       const postsDisplay = await Promise.all(
  //         posts.map(async (post) => {
  //           const decryptedContent = await decryptContentWithGroupKey(
  //             groupKey,
  //             post.content,
  //             post.iv,
  //             post.tag
  //           )
  //           return `Post: ${decryptedContent}`
  //         })
  //       )
  //       writeToTerminal(`Group Posts:\n${postsDisplay.join('\n')}\n`)
  //     } else {
  //       writeToTerminal(posts + '\n')
  //     }
  //   } catch (error) {
  //     writeToTerminal('Error: ' + error.message + '\n')
  //   }
  // }

  // Helper functions

  const writeToTerminal = (text) => {
    setOutput((prevOutput) => prevOutput + text)
  }

  const processCommand = (input) => {
    const sanitizedInput = input.trim().split(' ')
    const command = sanitizedInput[0].toLowerCase()
    const args = sanitizedInput.slice(1)

    switch (command) {
      case 'help':
        help(args)
        break
      case 'register':
        register(args)
        break
      case 'login':
        login(args)
        break
      case 'logout':
        logout(args)
        break
      case 'creategroup':
        createGroup(args)
        break
      case 'joingroup':
        requestJoinGroup(args)
        break
      case 'acceptrequest':
        acceptJoinRequest(args)
        break
      case 'mygroups':
        myGroups(args)
        break
      case 'myrequests':
        myGroupsRequests(args)
        break
      case 'createpost':
        createPost(args)
        break
      case 'viewposts':
        viewGroupPosts(args)
        break
      default:
        writeToTerminal(`'${command}' is not a recognized command.\n`)
        break
    }
  }

  return (
    <div className="terminal">
      <textarea className="terminal-output" value={output} readOnly />
      <input
        type="text"
        className="terminal-input"
        placeholder="Type your command..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

export default Terminal
