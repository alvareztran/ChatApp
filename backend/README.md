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
| `/auth/signup` | POST | Register with `username`, `email`, `password` (8–72 bytes), and `displayName` |
| `/auth/signin` | POST | Sign in with `username` and `password`; returns an access token |
| `/auth/refresh`, `/auth/signout` | POST | Rotate the refresh token or revoke the current session |
| `/users/me` | GET, PATCH | Get or update the signed-in user's profile |
| `/users/me/avatar` | POST | Upload an avatar (`avatar` field, multipart). JPEG/PNG/WebP up to 2 MB; stored as 256×256 WebP under `/uploads/avatars` |
| `/users/search?keyword=...` | GET | Search for users (maximum 20 results) |
| `/users/:user_id` | GET | Get a public user profile |
| `/friends` | GET | List the signed-in user's friends |
| `/friends/:friend_id` | DELETE | Remove a friendship |
| `/friend_requests` | POST | Send a request using `toUserId` and optional `message` |
| `/friend_requests/received` | GET | List pending incoming requests |
| `/friend_requests/:requestId/accept`, `/reject` | PATCH | Accept or reject an incoming request |
| `/conversations` | GET, POST | List or create conversations (`participants`, `type`, optional `name`) |
| `/conversations/:conversation_id` | GET, DELETE | Read or delete a conversation |
| `/messages` | POST | Send with `conversationId`, and `content` or `imgUrl` |
| `/messages/conversation/:conversation_id` | GET | List messages (`limit` is capped at 100) |
| `/messages/:message_id` | DELETE | Delete a message you sent |

Signup and sign-in are rate limited to 30 requests per 15 minutes per IP.
Public user responses never include `email` or `phone`; only `/users/me` and the
sign-up/sign-in responses expose the account's own contact fields.

Passwords are hashed by the server with bcrypt; clients should send the original
password over HTTPS, not pre-hash it. Passwords must be 8–72 bytes. Responses
never include stored passwords.

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
