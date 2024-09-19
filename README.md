# Secure-Reddit

This project focuses on the development of a secure discussion forum, similar to "Reddit," where discussions are held with maximum confidentiality and privacy. The system ensures that only authorized participants can engage in discussions and access the content.

## Implementation and Design

### System Overview
The secure discussion forum is built using **Node.js** for the backend and **React** for the frontend. Key features of the implementation include:

- **Backend**: Developed with **Express.js**, it handles user authentication, group management, and data transactions.
- **Frontend**: A **React-based** application offering a user-friendly, terminal-like interface for seamless interaction.
- **Database**: The database is a **MariaDB SQL** instance that stores user and group data.

### 2.1 Design and Workflow

#### User Registration and Key Generation
- Upon registration, each user generates an **RSA public-private key pair**. 
  - **Public Key**: Stored on the server and used to encrypt data for the user.
  - **Private Key**: Stored locally on the user's hard drive and never leaves the user's device, ensuring maximum security.

#### Authentication with JWT Tokens
- After login, the server issues a **JSON Web Token (JWT)**, stored in an **HttpOnly cookie** to secure the session.
- JWTs maintain stateless user sessions, ideal for a distributed application.

#### Group Creation and Join Requests
- Users can create or request to join groups.
- Each group has a unique **AES 256 symmetric key**, used to encrypt group posts. This key is securely stored and encrypted by the server’s **AES-CBC key**.

#### Storage of Encrypted Group Keys
- Encrypted group keys are stored securely in the user's **IndexedDB**, a client-side storage solution, to ensure that only authorized users can access and decrypt group messages.

#### Creating and Viewing Posts
- To create or view posts, users must provide their private key.
  - **Post Encryption**: The decrypted group key is used to encrypt the content before sending it to the server.
  - **Post Decryption**: To view posts, users decrypt the content using the group key and their private key.

### Conclusion
This secure discussion forum combines modern cryptographic practices and a user-centric approach to maximize confidentiality and security. By decentralizing key storage, using robust authentication mechanisms, and ensuring the confidentiality of communications through encryption, this platform represents a secure space for confidential discussions.

## 2.2 Technologies

- **Node-Forge for Encryption**: Used for RSA key generation, group key encryption, and secure message handling.
- **CORS**: Implemented to control cross-origin requests and protect against cross-site scripting (XSS) attacks.
- **HTTPS with Self-Signed Certificate**: Ensures encrypted communication between the client and server.
- **JWT for Authentication**: Provides stateless, scalable session management, secured in HttpOnly cookies.
- **IndexedDB for Key Storage**: Client-side storage for encrypted group keys.
- **Rate Limiting**: Protects the server from denial-of-service (DoS) attacks.
- **Data-at-Rest Encryption**: Ensures sensitive data, such as group keys, remain encrypted even when stored.
- **Input Validation and Sanitization**: Prevents injection attacks by validating and sanitizing user inputs.
- **API Security**: Ensures secure interactions using JWT, HTTPS, and CORS policies.

## Security Features

- **Private Key Storage on Hard Drive**: Decentralizes sensitive data, enhancing security by avoiding server-side storage of private keys.
- **Encrypted Group Keys in IndexedDB**: Ensures that group conversations remain confidential and accessible only to intended users.
- **Data-at-Rest Encryption**: Encrypts data before storing it, protecting against unauthorized access to stored data.
- **API Security**: Combines JWT authentication, HTTPS, and CORS policies for secure and verified communication between the server and clients.

## Conclusion
The secure discussion forum’s design prioritizes privacy, security, and user experience. Each element, from cryptographic practices to input validation, is chosen to maximize security and confidentiality while maintaining usability and performance.
