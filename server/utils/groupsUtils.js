const forge = require('node-forge')

function generateGroupCode(length = 6) {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function generateGroupKey() {
  return forge.random.getBytesSync(32)
}

function encryptWithPublicKey(publicKey, bufferData) {
  try {
    const forgePublicKey = forge.pki.publicKeyFromPem(publicKey)
    const encrypted = forgePublicKey.encrypt(bufferData, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    })
    return forge.util.encode64(encrypted)
  } catch (error) {
    console.error(error)
  }
}

// const crypto = require('crypto')

// function encryptGroupKey(groupKey) {
//   const algorithm = 'aes-256-cbc'
//   const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex') // Your encryption key
//   const iv = crypto.randomBytes(16) // Initialization vector

//   const cipher = crypto.createCipheriv(algorithm, key, iv)
//   let encrypted = cipher.update(groupKey, 'utf8', 'hex')
//   encrypted += cipher.final('hex')

//   return { encryptedData: encrypted, iv: iv.toString('hex') }
// }

// function decryptGroupKey(encryptedGroupKey, iv) {
//   const algorithm = 'aes-256-cbc'
//   const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex') // Your encryption key
//   const decipher = crypto.createDecipheriv(
//     algorithm,
//     key,
//     Buffer.from(iv, 'hex')
//   )

//   let decrypted = decipher.update(encryptedGroupKey, 'hex', 'utf8')
//   decrypted += decipher.final('utf8')

//   return decrypted
// }

function encryptGroupKey(groupKey) {
  const key = forge.util.hexToBytes(process.env.ENCRYPTION_KEY) // Convert hex key to bytes
  const iv = forge.random.getBytesSync(16) // Generate IV
  const newGroupKey = forge.util.bytesToHex(groupKey)

  const cipher = forge.cipher.createCipher('AES-CBC', key)
  cipher.start({ iv: iv })
  cipher.update(forge.util.createBuffer(newGroupKey, 'utf8'))
  cipher.finish()

  const encrypted = cipher.output.toHex() // Encrypted data in hexadecimal
  return { encryptedData: encrypted, iv: forge.util.bytesToHex(iv) }
}

function decryptGroupKey(encryptedGroupKey, iv) {
  const key = forge.util.hexToBytes(process.env.ENCRYPTION_KEY) // Convert hex key to bytes
  const decipher = forge.cipher.createDecipher('AES-CBC', key)
  decipher.start({ iv: forge.util.hexToBytes(iv) }) // Convert hex IV to bytes
  decipher.update(
    forge.util.createBuffer(forge.util.hexToBytes(encryptedGroupKey))
  )
  decipher.finish()

  return forge.util.decodeUtf8(decipher.output.getBytes()) // Decoded decrypted string
}

module.exports = {
  generateGroupCode,
  generateGroupKey,
  encryptWithPublicKey,
  encryptGroupKey,
  decryptGroupKey,
}
