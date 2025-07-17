*************** Tech stack **************************
//langauges
--mern, typescript
//microservices
--chat, message, email, user (or) auth
//validations
--zod (frontend) & joi (backend)
//tools
-- react-hook-form, shadcn ui with zod resolvers, nodemailer, jwt(accesstoken and refreshtoken) and through cookies , react-virtual, socket-io & socket.io-client
, redis(upstash), rabbitmq with docker 

****************** Features *******************************
/// Aim to fullfill 60 to 70% of what chatApp Should have LEVEL:[INTERMEDIATE] 

(1) User Authentication
    --- Register/Login
    --- Password Hashing (bcrypt)
    --- Token based Authentication (JWT)
        --- accesstoken & refreshtoken

(2) Real Time Messaging
    --- One-to-one and Group and Broadcast messaging using socket.io 

(3) Chat ui
    --- Display Chat List ( Reverse chronological Order)
    --- Display User List ( chronological order)
    --- Display Message List  ( chronological order)

(4) Message Persistance or Caching 
    --- Store Messages in Redis for some Time

(5) Indicators
    --- Online
    --- lastSeen at
    --- Tying

(6) Message Status
    --- Sent, Delivered, Read

(7) Message Reactions
    --- LIke, 💖, 👍👎 on Messages

(8) Media Support
    --- Send images, files, videos,view them

(7) Pagination /infinite scroll
    --- load older messages on scroll

(9) Search Messages
    --- Search in chat history (text-based)

(10) End to end Encryption (E2EE)
    --- Encrpt messages on client and decrypt on client
    --- use libraries like crypto.js

(11) Threaded Replies & mentions
    --- Message threads (like slack/discord)
    --- Message forwarding & reply

(12) Editing & Deleting messages & All messages after 48 will be lost by default

(13) Read Reciept per user
    ---showing which users saw the message same as in whatsapp status

(14) Multi-device sync
    --- Sync sessinos across devices
    --- handle logout from another device

(15) Admin Controls
    --- Group admin features like pinning messages, mutting users

(16) Advanced File sharing
    --- drag/drop, preview, file type validations

(11) Rate limitting & spam Prevention
    --- Pervent abuse or spamming



***************  Frontend Routes **************************
***************  Backend Endpoints **************************

(1) User Authentication (Along with Auth Middleware)

    ---POST /auth/register

    ---POST /auth/login

    ---POST /auth/refresh-token

    ---POST /auth/logout

    ---GET /auth/me (verify token)

    ---GET /auth/users (all Users)
    
    ---POST /auth/logout-all (multi-device logout)

(2) User Management 

    ---GET /users/me (verify token)

    ---PATCH /users/me (update name, bio, photo)

    ---GET /users/:userID (GET SPECIFICE USER)

    ---GET /users (all Users)

(3) Chat Management (1-to-1)

    ---GET /chats (fetch recent chats)

    ---POST /chats (start new chat or group)

    ---GET /chats/:chatId

   ❌ <!-- ---PATCH /chats/:chatId (edit rename, mute, etc.) -->

    ---DELETE /chats/:chatId (delete for self)

(4) Group chat mangemant

    ---GET /groups (create group)

    ---POST /groups (create group)

    ---GET /groups/:groupId

    ---PATCH /groups/:groupId (update name, pic)

    ---POST /groups/:groupId/add-user

    ---POST /groups/:groupId/remove-user

    ---GET /groups/:groupId/members

(5) Message management

    ---POST /messages/send

    ---GET /messages/:chatId (pagination supported)

    ---GET /messages/thread/:messageId

    ---POST /messages/:messageId/reply

    ---POST /messages/:messageId/forward

    ---POST /messages/:messageId/reactions

    ---PATCH /messages/:messageId (edit message)

    ---DELETE /messages/:messageId (delete for me or everyone)

    ---GET /messages/:messageId/status (sent, delivered, read)

(6) Media 

    ---POST /media/upload

    ---GET /media/:fileId

    ---DELETE /media/:fileId

    ---GET /media/chat/:chatId

(7) Searches

    ---GET /search/messages?chatId=...&query=...

    ---GET /search/contacts?query=...

(8) Block

    ---POST /users/:userId/block

    ---DELETE /users/:userId/block

    ---GET /users/blocked
    
(9) Read Receipts and mark-delivery

    ---POST /messages/:messageId/mark-read

    ---GET /messages/:chatId/read-receipts

(10) Security & Encryption

    ---POST /keys/exchange

    ---GET /keys/:userId/public

(11) Device & Session Management

    ---GET /devices (list active sessions)

    ---POST /devices/logout/:deviceId

    ---POST /devices/sync

(12) Socket.IO Events (Real-Time)

    ---connect/disconnect

    ---user:typing

    ---message:send

    ---message:delivered

    ---message:read

    ---message:reaction

    ---chat:created

    ---chat:updated

    ---group:user-added

    ---group:user-removed

    ---user:online-status

*************** Schemas  **************************

