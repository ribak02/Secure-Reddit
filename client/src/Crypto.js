import forge from 'node-forge'

const DB_NAME = 'forumDB' // Name of your database
const DB_VERSION = 3 // Version of your database
const STORE_NAME = 'groupKeys'

async function openDatabase() {
  return new Promise((resolve, reject) => {
    // Open (or create) the database
    const openRequest = indexedDB.open(DB_NAME, DB_VERSION)

    // Create the schema
    openRequest.onupgradeneeded = function (e) {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    openRequest.onsuccess = function (e) {
      resolve(e.target.result)
    }

    openRequest.onerror = function (e) {
      reject(e.target.error)
    }
  })
}

export async function generateKeyPair() {
  const rsaKeyPair = forge.pki.rsa.generateKeyPair() // use according to your requirement
  const publicKey = forge.pki.publicKeyToPem(rsaKeyPair.publicKey)
  const privateKey = forge.pki.privateKeyToPem(rsaKeyPair.privateKey)
  return { publicKey, privateKey }
}

export async function storePrivateKey(privateKey) {
  // Create a blob from the private key string
  const blob = new Blob([privateKey], { type: 'text/plain' })

  // Create a link element for downloading
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'userPrivateKey.pem' // File name for download

  // Append the link to the document and trigger the download
  document.body.appendChild(link)
  link.click()

  // Clean up: remove the link element from the document
  document.body.removeChild(link)
}

async function getGroupKey(groupName) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('groupKeys', 'readonly')
    const store = transaction.objectStore('groupKeys')
    const request = store.get(groupName)

    request.onsuccess = function (event) {
      // Get the result (CryptoKey) from the request
      const groupKey = event.target.result
      if (groupKey) {
        resolve(groupKey)
      } else {
        reject(new Error('Group key not found'))
      }
    }

    request.onerror = function (event) {
      reject(new Error('Error retrieving group key: ' + event.target.error))
    }
  })
}

export async function getDecryptedGroupKey(groupName, privateKeyPem) {
  const encryptedGroupKey = await getGroupKey(groupName)
  console.log(encryptedGroupKey)

  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)
  const decryptedGroupKey = privateKey.decrypt(
    forge.util.decode64(encryptedGroupKey),
    'RSA-OAEP',
    {
      md: forge.md.sha256.create(),
    }
  )

  // Convert the raw binary string to a byte array
  const decryptedGroupKeyBytes = forge.util.binary.raw.decode(decryptedGroupKey)
  return decryptedGroupKeyBytes
}

export async function storeEncryptedGroupKey(groupName, encryptedGroupKey) {
  const db = await openDatabase() // Function to open/create IndexedDB database
  const transaction = db.transaction('groupKeys', 'readwrite')
  const store = transaction.objectStore('groupKeys')

  await store.put(encryptedGroupKey, groupName)
}

export async function clearStoredGroupKeys() {
  const db = await openDatabase() // Reuse your existing function to open/create IndexedDB
  const transaction = db.transaction('groupKeys', 'readwrite')
  const store = transaction.objectStore('groupKeys')

  // Clear all entries in the 'groupKeys' store
  await store.clear()
}

export async function encryptContentWithGroupKey(groupKey, content) {
  try {
    // Convert Uint8Array groupKey to binary string
    const keyBinaryString = forge.util.binary.raw.encode(
      new Uint8Array(groupKey)
    )

    const iv = forge.random.getBytesSync(12) // Generate a random IV
    const cipher = forge.cipher.createCipher('AES-GCM', keyBinaryString)
    cipher.start({ iv: iv })
    cipher.update(forge.util.createBuffer(content))
    if (!cipher.finish()) {
      throw new Error('Cipher failed to finish')
    }

    const encryptedContent = cipher.output.getBytes()
    const tag = cipher.mode.tag.getBytes() // Get the authentication tag

    return {
      encryptedContent: forge.util.encode64(encryptedContent),
      iv: forge.util.encode64(iv),
      tag: forge.util.encode64(tag),
    }
  } catch (error) {
    console.error('Error in encryptContentWithGroupKey:', error)
  }
}

export async function decryptContentWithGroupKey(
  groupKey,
  encryptedContent,
  iv,
  tag
) {
  try {
    // Convert Uint8Array groupKey to a forge-compatible format
    let forgeKey = forge.util.createBuffer(groupKey)

    const decipher = forge.cipher.createDecipher('AES-GCM', forgeKey)

    decipher.start({
      iv: forge.util.decode64(iv), // iv should be a base64-encoded string
      tag: forge.util.decode64(tag), // tag should be a base64-encoded string
    })

    decipher.update(
      forge.util.createBuffer(forge.util.decode64(encryptedContent))
    )

    if (decipher.finish()) {
      const decryptedContent = decipher.output.getBytes()
      return decryptedContent // Return the decrypted content as a binary string
    } else {
      throw new Error(
        'Decryption failed, possibly due to an incorrect key or tampered data.'
      )
    }
  } catch (error) {
    console.error('Error in decryptContentWithGroupKey:', error)
  }
}
