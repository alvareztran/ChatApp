# Chat backend

## Setup

1. Copy `.env.example` to `.env` and set MongoDB plus two distinct, random JWT secrets.
2. Run `npm install`.
3. Run `npm run dev`.

The API uses `Authorization: Bearer <accessToken>` for protected HTTP requests.
Sign-in returns `accessToken` and sets an HTTP-only `refreshToken` cookie. Send
credentials when calling `/api/auth/refresh` and `/api/auth/signout`.

## API

All routes are prefixed with `/api`.

| Route | Methods | Purpose |
| --- | --- | --- |
| `/auth/signup` | POST | Register with `username`, `email`, `password`, and `displayName` |
| `/auth/signin` | POST | Sign in with `username` and `password`; returns an access token |
| `/auth/refresh`, `/auth/signout` | POST | Rotate the refresh token or revoke the current session |
| `/users/me` | GET, PATCH | Get or update the signed-in user's profile |
| `/users/me/avatar` | POST | Upload an avatar (`avatar` field, multipart). JPEG/PNG/WebP; re-encoded to WebP under `/uploads/avatars` |
| `/users/search?keyword=...` | GET | Search for users |
| `/users/:user_id` | GET | Get a public user profile |
| `/friends` | GET | List the signed-in user's friends |
| `/friends/:friend_id` | DELETE | Remove a friendship |
| `/friend_requests` | POST | Send a request using `toUserId` and optional `message` |
| `/friend_requests/received` | GET | List pending incoming requests |
| `/friend_requests/:requestId/accept`, `/reject` | PATCH | Accept or reject an incoming request |
| `/conversations` | GET, POST | List or create conversations (`participants`, `type`, optional `name`). `direct` needs exactly 2 people; `group` needs at least 3 |
| `/conversations/:conversation_id` | GET, DELETE | Read or delete a conversation |
| `/messages` | POST | Send with `conversationId` and `content` and/or `imgUrl`; optional multipart field `image` (JPEG/PNG/WebP) |
| `/messages/conversation/:conversation_id` | GET | List messages |
| `/messages/:message_id` | DELETE | Delete a message you sent |

Public user responses never include `email` or `phone`; only `/users/me` and the
sign-up/sign-in responses expose the account's own contact fields.

Clients should send the original password over HTTPS, not pre-hash it. Responses
never include stored passwords.

## Uploads

Avatars and message images are processed with sharp and stored on disk under
`backend/uploads/` (git-ignored), then served statically at `/uploads/*`:

- Avatars are re-encoded to WebP (`/users/me/avatar`, field `avatar`).
- Message images are resized and re-encoded to WebP (`POST /messages`, field
  `image`) and removed when the message or its conversation is deleted.

## Socket.IO

Connect using the access token:

```js
io(API_URL, { auth: { token: accessToken }, withCredentials: true })
```

Each socket automatically joins a private `user:<userId>` room. Conversation
events are emitted to every participant's user room, so clients receive updates
without joining anything:

| Event | Payload |
| --- | --- |
| `conversation:new` | New conversation you participate in (populated conversation) |
| `conversation:deleted` | `{ conversationId }` |
| `message:new` | New message in any conversation you participate in (populated sender) |
| `message:deleted` | `{ conversationId, messageId, lastMessage }` |

Messages are persisted through the HTTP API before the `message:new` event is
emitted, so clients should deduplicate by message ID when they also receive the
HTTP response.
