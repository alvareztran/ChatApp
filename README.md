# Chattie

Ứng dụng chat thời gian thực gồm xác thực tài khoản, kết bạn, trò chuyện riêng/nhóm,
gửi ảnh và cập nhật tin nhắn tức thời qua Socket.IO. Frontend là SPA React, backend là
REST API + Socket.IO dùng MongoDB.

- Frontend (tham chiếu): https://mychattie.vercel.app
- API (tham chiếu): https://chatapp-rjpf.onrender.com/api

## Mục lục

- [Tính năng](#tính-năng)
- [Kiến trúc](#kiến-trúc)
- [Công nghệ](#công-nghệ)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Biến môi trường](#biến-môi-trường)
- [Scripts](#scripts)
- [Luồng hoạt động](#luồng-hoạt-động)
- [REST API](#rest-api)
- [Socket.IO](#socketio)
- [Tệp tải lên](#tệp-tải-lên)
- [Triển khai](#triển-khai)
- [Khắc phục sự cố](#khắc-phục-sự-cố)

## Tính năng

### Tài khoản và phiên đăng nhập

- Đăng ký bằng tên đăng nhập, email, mật khẩu và tên hiển thị.
- Đăng nhập trả về access token (JWT) và đặt refresh token trong cookie `HttpOnly`.
- Tự động làm mới access token khi gặp `401`; nhiều request đồng thời được xếp hàng
  chờ chung một lần refresh.

### Bạn bè

- Tìm người dùng theo username hoặc tên hiển thị.
- Gửi lời mời kết bạn kèm lời nhắn, xem lời mời đến, chấp nhận hoặc từ chối.
- Chặn gửi trùng: đã là bạn bè hoặc đã có lời mời đang chờ thì không gửi thêm.
- Xem danh sách bạn bè và huỷ kết bạn.

### Trò chuyện

- Trò chuyện riêng (đúng 2 người) và nhóm chat (tối thiểu 3 người, tính cả người tạo).
- Tạo nhóm cần tên nhóm; tạo lại trò chuyện riêng đã có sẽ trả về
  cuộc trò chuyện cũ thay vì tạo trùng.
- Danh sách hội thoại sắp xếp theo hoạt động gần nhất, kèm tin nhắn cuối và người gửi.
- Xem thành viên nhóm; xoá hội thoại (xoá kèm toàn bộ tin nhắn và ảnh đã tải lên).

### Tin nhắn

- Gửi tin nhắn văn bản hoặc ảnh JPEG/PNG/WebP.
- Có thể gửi ảnh kèm chú thích; ảnh được chọn trực tiếp trong ô soạn tin, xem trước và
  xoá trước khi gửi.
- Ảnh được xoay theo EXIF, thu nhỏ và chuyển sang WebP.
- Tải lịch sử tin nhắn theo thứ tự thời gian.
- Chỉ người gửi được xoá tin nhắn của mình; khi xoá tin cuối, hội thoại tự cập nhật
  tin nhắn cuối mới.

### Hồ sơ

- Cập nhật tên hiển thị, tiểu sử và số điện thoại.
- Tải ảnh đại diện JPEG/PNG/WebP; ảnh được cắt vuông và chuyển sang WebP.
- Email và số điện thoại chỉ hiển thị với chính chủ tài khoản.

### Thời gian thực

- Socket.IO xác thực bằng access token, mỗi kết nối tự vào phòng riêng `user:<userId>`.
- Tin nhắn mới, tin nhắn bị xoá, hội thoại mới/bị xoá được đẩy tới mọi thành viên mà
  client không cần join phòng hội thoại.
- Khi access token được refresh, client tạo lại kết nối socket với token mới.

## Kiến trúc

```
┌─────────────────────────────┐
│  Trình duyệt (React SPA)    │
│  React Router + Ant Design  │
└──────────┬──────────────────┘
           │ HTTPS (axios, Bearer access token, cookie refresh token)
           │ WSS   (Socket.IO, auth.token)
┌──────────▼──────────────────┐
│  Express 5 API + Socket.IO  │
│  controllers / middleware   │
└──────────┬──────────────────┘
           │ Mongoose
┌──────────▼──────────────────┐
│           MongoDB           │
└─────────────────────────────┘

Tệp tải lên: backend/uploads/{avatars,messages}
được phục vụ tĩnh tại /uploads/*
```

- **Backend** chia lớp rõ ràng: `routes` khai báo endpoint, `controllers` xử lý nghiệp vụ,
  `models` định nghĩa schema, `middleware` xác thực và upload, `utils` chứa token,
  lưu tệp và hàm dùng chung.
- **Frontend** tổ chức theo `pages` (màn hình), `components` (UI), `contexts` (auth/socket),
  `services` (gọi API) và `routes` (bảo vệ route).

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Backend | Node.js, Express 5, Mongoose 9, Socket.IO 4 |
| Xác thực | JWT access token + refresh token trong cookie `HttpOnly` |
| Upload | multer (bộ nhớ tạm) + sharp (resize/encode WebP) |
| Frontend | React 19, Vite 8, Ant Design 6, React Router 7, axios, socket.io-client |
| Dữ liệu | MongoDB |

## Cấu trúc thư mục

```
project/
├── backend/
│   ├── server.js                  # Khởi tạo Express, CORS, static, Socket.IO, error handler
│   ├── config/db.js               # Kết nối MongoDB
│   ├── routes/                    # auth, users, friends, friend_requests, conversations, messages
│   ├── controllers/               # Nghiệp vụ từng nhóm API
│   ├── models/                    # Định nghĩa schema Mongoose
│   ├── middleware/
│   │   ├── auth.js                # Xác thực Bearer token
│   │   ├── uploadAvatar.js        # multer cho ảnh đại diện
│   │   └── uploadMessageImage.js  # multer cho ảnh tin nhắn
│   ├── socket/index.js            # Xác thực socket + phòng user:<id>
│   ├── utils/
│   │   ├── tokens.js              # Ký/verify JWT, cấu hình cookie
│   │   ├── helpers.js             # asyncHandler, httpError, publicUser
│   │   ├── socket.js              # emit tới phòng của từng người dùng
│   │   ├── avatarStorage.js       # Lưu/xoá ảnh đại diện
│   │   └── messageStorage.js      # Lưu/xoá ảnh tin nhắn
│   ├── uploads/                   # Tệp tải lên (git-ignored)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx / main.jsx
│   │   ├── contexts/              # AuthContext, SocketContext
│   │   ├── routes/                # AppRoutes, ProtectedRoute
│   │   ├── pages/                 # Auth, Chat, Friends, FriendRequests, Search, Profile
│   │   ├── components/            # chat, conversation, layout, navigation, common
│   │   ├── services/              # api (axios + refresh), auth, user, friend, conversation, message
│   │   ├── socket/socket.js       # Quản lý một instance socket theo token
│   │   ├── utils/assetUrl.js      # Ghép URL ảnh tương đối với origin API
│   │   └── index.css              # Design tokens và style toàn cục
│   ├── vercel.json                # Rewrite SPA về index.html
│   ├── .env.example
│   └── package.json
└── README.md
```

## Yêu cầu môi trường

- Node.js **20.19+** (khuyến nghị 22 LTS)
- npm 10+
- MongoDB 6+ chạy local hoặc MongoDB Atlas

## Cài đặt và chạy

Thứ tự: chạy MongoDB → chạy backend → chạy frontend.

### 1. Backend

```bash
cd backend
cp .env.example .env
# Sửa .env: MONGODB_URL, JWT_SECRET, REFRESH_TOKEN_SECRET
npm install
npm run dev
```

API chạy tại `http://localhost:3000` (đổi bằng `PORT`). Tệp tĩnh tại
`http://localhost:3000/uploads/...`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Mặc định đã trỏ về http://localhost:3000
npm install
npm run dev
```

Mở `http://localhost:5173`, đăng ký tài khoản rồi đăng nhập.

### 3. Kiểm tra nhanh

- `GET http://localhost:3000/api/users/me` không có token trả về `401`.
- Đăng nhập trên giao diện, mở hai trình duyệt với hai tài khoản để thấy tin nhắn
  và danh sách hội thoại cập nhật tức thời.

## Biến môi trường

### Backend (`backend/.env`)

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `PORT` | `3000` | Cổng API |
| `MONGODB_URL` | — | Chuỗi kết nối MongoDB (bắt buộc) |
| `JWT_SECRET` | — | Khoá ký access token (bắt buộc) |
| `REFRESH_TOKEN_SECRET` | — | Khoá ký refresh token, phải khác `JWT_SECRET` (bắt buộc) |
| `ACCESS_TOKEN_TTL` | `15m` | Thời hạn access token; dùng đơn vị `s`, `m`, `h`, `d` |
| `REFRESH_TOKEN_TTL` | `7d` | Thời hạn refresh token, đồng thời là tuổi cookie refresh |
| `CLIENT_URL` | — | Origin được phép CORS, phân tách bằng dấu phẩy |
| `NODE_ENV` | — | Đặt `production` khi triển khai (khi đó bắt buộc có `CLIENT_URL`) |

Lưu ý:

- `CLIENT_URL` so khớp **chính xác** với origin trình duyệt gửi lên. Không thêm dấu `/`
  cuối: dùng `https://mychattie.vercel.app`, không dùng `https://mychattie.vercel.app/`.
- Ở môi trường phát triển, nếu `CLIENT_URL` để trống thì mọi origin đều được chấp nhận.
  Ở production, server từ chối khởi động nếu thiếu biến này.

### Frontend (`frontend/.env`)

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/api` | Base URL REST API (phải có `/api`) |
| `VITE_SOCKET_URL` | `http://localhost:3000` | URL máy chủ Socket.IO (không có `/api`) |

Vite nhúng biến `VITE_*` vào bundle lúc build, nên thay đổi biến trên Vercel cần build lại.

## Scripts

| Vị trí | Lệnh | Mục đích |
| --- | --- | --- |
| backend | `npm run dev` | Chạy API với nodemon |
| backend | `npm start` | Chạy API production |
| frontend | `npm run dev` | Vite dev server (5173) |
| frontend | `npm run build` | Build production vào `dist/` |
| frontend | `npm run preview` | Xem thử bản build |
| frontend | `npm run lint` | ESLint toàn bộ mã nguồn |

## Luồng hoạt động

### Đăng nhập và làm mới token

1. `POST /api/auth/signin` trả `accessToken` (JSON) và đặt `refreshToken` vào cookie
   `HttpOnly`.
2. Interceptor axios gắn `Authorization: Bearer <token>` cho mọi request.
3. Khi API trả `401`, interceptor gọi `POST /api/auth/refresh` đúng một lần; các request
   lỗi khác chờ trong hàng đợi rồi phát lại với token mới.
4. Nếu refresh thất bại, frontend xoá token và chuyển người dùng về trang đăng nhập.
5. `SocketContext` theo dõi token; token đổi thì ngắt socket cũ và kết nối lại với token mới.

### Gửi tin nhắn thời gian thực

1. Client gọi `POST /api/messages` (JSON hoặc multipart nếu có ảnh).
2. Server kiểm tra người gửi là thành viên hội thoại, lưu tin nhắn, cập nhật
   `lastMessage` của hội thoại.
3. Server phát `message:new` tới phòng `user:<id>` của mọi thành viên.
4. Client nhận qua socket hoặc qua response HTTP đều dùng `_id` để tránh trùng lặp.

### Tải ảnh

1. multer giữ tệp trong bộ nhớ và giới hạn loại/kích thước.
2. sharp xoay, resize và encode WebP; tệp ghi vào `uploads/{avatars,messages}`.
3. MongoDB chỉ lưu URL tương đối như `/uploads/messages/<user>-<uuid>.webp`.
4. Frontend dùng `assetUrl()` ghép URL tương đối với origin API để ảnh hiển thị đúng
   khi frontend và backend khác domain.
5. Khi xoá tin nhắn/hội thoại hoặc thay ảnh đại diện, tệp cũ được xoá khỏi đĩa.

## REST API

Mọi route dưới `/api`. Trừ nhóm `/auth/signup`, `/auth/signin`, `/auth/refresh`,
`/auth/signout`, tất cả yêu cầu header `Authorization: Bearer <accessToken>`.

### Auth

| Method | Đường dẫn | Body / ghi chú |
| --- | --- | --- |
| POST | `/auth/signup` | `username`, `email`, `password`, `displayName` |
| POST | `/auth/signin` | `username`, `password`; trả `accessToken` + cookie refresh |
| POST | `/auth/refresh` | Không body; dùng cookie `refreshToken`, xoay token |
| POST | `/auth/signout` | Không body; thu hồi refresh token hiện tại, trả `204` |

### Users

| Method | Đường dẫn | Ghi chú |
| --- | --- | --- |
| GET | `/users/me` | Hồ sơ của chính mình (có email, phone) |
| PATCH | `/users/me` | `displayName`, `bio`, `phone`, `avatarUrl`, `avatarId` |
| POST | `/users/me/avatar` | multipart, trường `avatar` |
| GET | `/users/search?keyword=` | Tìm theo username/tên hiển thị |
| GET | `/users/:user_id` | Hồ sơ công khai (không có email, phone) |

### Friends

| Method | Đường dẫn | Ghi chú |
| --- | --- | --- |
| GET | `/friends` | Trả `{ friendshipId, user }[]` |
| DELETE | `/friends/:friend_id` | `friend_id` là `friendshipId` |

### Friend requests

| Method | Đường dẫn | Ghi chú |
| --- | --- | --- |
| POST | `/friend_requests` | `toUserId`, `message` (tuỳ chọn) |
| GET | `/friend_requests/received` | Danh sách lời mời đang chờ |
| PATCH | `/friend_requests/:requestId/accept` | Chấp nhận, tạo quan hệ bạn bè |
| PATCH | `/friend_requests/:requestId/reject` | Từ chối |

### Conversations

| Method | Đường dẫn | Ghi chú |
| --- | --- | --- |
| GET | `/conversations` | Hội thoại của mình, mới hoạt động trước |
| POST | `/conversations` | `type` (`direct`/`group`), `participants[]`, `name` (nhóm) |
| GET | `/conversations/:conversation_id` | Chi tiết hội thoại |
| DELETE | `/conversations/:conversation_id` | Xoá hội thoại, tin nhắn và ảnh liên quan |

Quy tắc tạo hội thoại:

- `direct`: đúng 2 người sau khi gộp người tạo; nếu đã tồn tại thì trả `200` kèm hội thoại cũ.
- `group`: ít nhất 3 người sau khi gộp người tạo.
- Danh sách người tham gia được loại trùng; mọi ID phải tồn tại.

### Messages

| Method | Đường dẫn | Ghi chú |
| --- | --- | --- |
| POST | `/messages` | JSON `conversationId`, `content?`, `imgUrl?` hoặc multipart thêm trường `image` |
| GET | `/messages/conversation/:conversation_id?limit=` | Trả theo thứ tự thời gian |
| DELETE | `/messages/:message_id` | Chỉ người gửi được xoá |

Ví dụ đăng nhập và gửi ảnh:

```bash
# Đăng nhập (lưu cookie refreshToken)
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"matkhau123"}'

# Gửi tin nhắn kèm ảnh
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "conversationId=$CONVERSATION_ID" \
  -F "content=Ảnh mới" \
  -F "image=@./photo.jpg"
```

Tạo nhóm chat:

```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"group","name":"Nhóm dự án","participants":["<id1>","<id2>"]}'
```

Lỗi trả về dạng `{ "message": "..." }` bằng tiếng Việt, với mã trạng thái phù hợp
(`400`, `401`, `403`, `404`, `409`, `429`, `500`).

## Socket.IO

Kết nối bằng access token:

```js
import { io } from "socket.io-client";

const socket = io(SOCKET_URL, {
  auth: { token: accessToken },
  withCredentials: true,
});
```

Server xác thực JWT trong handshake, gắn `socket.userId` và cho socket vào phòng
`user:<userId>`. Client không cần join phòng hội thoại.

| Sự kiện | Payload | Khi nào |
| --- | --- | --- |
| `conversation:new` | Hội thoại đã populate người tham gia | Có hội thoại mới mà bạn tham gia |
| `conversation:deleted` | `{ conversationId }` | Hội thoại bạn tham gia bị xoá |
| `message:new` | Tin nhắn đã populate người gửi | Có tin nhắn mới trong hội thoại của bạn |
| `message:deleted` | `{ conversationId, messageId, lastMessage }` | Tin nhắn bị xoá |

Tin nhắn được lưu vào MongoDB **trước** khi phát sự kiện, nên response HTTP và sự kiện
socket có thể cùng tồn tại; client nên khử trùng theo `_id`.

## Tệp tải lên

| Loại | Định dạng | Nơi lưu |
| --- | --- | --- |
| Ảnh đại diện | JPEG/PNG/WebP | `backend/uploads/avatars/` |
| Ảnh tin nhắn | JPEG/PNG/WebP | `backend/uploads/messages/` |

- Ảnh được xoay theo EXIF, thu nhỏ và chuyển sang WebP trước khi lưu.
- Thư mục `backend/uploads/` bị git-ignore; server phục vụ tĩnh tại `/uploads`.
- Tên tệp gồm ID người dùng và UUID, phần mở rộng luôn là `.webp`.
- Ảnh đại diện cũ và ảnh tin nhắn bị xoá cùng tin nhắn/hội thoại được dọn khỏi đĩa.

## Triển khai

### Backend trên Render

1. Tạo Web Service trỏ tới thư mục `backend`, build `npm install`, start `npm start`.
2. Đặt biến môi trường:
   - `NODE_ENV=production`
   - `MONGODB_URL` (MongoDB Atlas)
   - `JWT_SECRET`, `REFRESH_TOKEN_SECRET` (hai chuỗi ngẫu nhiên dài, khác nhau)
   - `CLIENT_URL=https://mychattie.vercel.app` (nhiều origin thì phân tách bằng dấu phẩy,
     không có dấu `/` cuối)
3. `PORT` do Render cấp; không cần khai báo.

### Frontend trên Vercel

1. Import repo, chọn thư mục `frontend`, framework Vite, output `dist`.
2. Đặt biến môi trường **trước khi build**:
   - `VITE_API_URL=https://chatapp-rjpf.onrender.com/api`
   - `VITE_SOCKET_URL=https://chatapp-rjpf.onrender.com`
3. Giữ [frontend/vercel.json](frontend/vercel.json) để mọi đường dẫn SPA (như `/chat`)
   được rewrite về `index.html`, tránh `404` khi tải lại trang.
4. Đổi biến môi trường xong phải redeploy vì Vite nhúng giá trị lúc build.

### Lưu ý production

- Cookie refresh chỉ hoạt động khi cả hai phía dùng HTTPS.
- Origin trong `CLIENT_URL` phải trùng khớp tuyệt đối với origin trên trình duyệt.
- Render dùng đĩa tạm: ảnh trong `backend/uploads` sẽ mất sau mỗi lần deploy/restart.
  Nếu cần lưu ảnh lâu dài, chuyển sang object storage (S3, Cloudinary, R2...).

## Khắc phục sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
| --- | --- | --- |
| `blocked by CORS policy` | `CLIENT_URL` thiếu origin, thừa dấu `/`, hoặc chưa redeploy sau khi đổi env | Đặt đúng origin, không có `/` cuối, redeploy/restart backend |
| Tải lại `/chat` bị `404` trên Vercel | Thiếu rewrite SPA | Giữ `frontend/vercel.json` như trong repo |
| Đăng nhập xong vẫn bị đăng xuất | Cookie không được gửi: `NODE_ENV` chưa `production`, không dùng HTTPS, hoặc thiếu `withCredentials` | Kiểm tra env backend, HTTPS và cấu hình axios |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB chưa chạy | Khởi động MongoDB hoặc đổi `MONGODB_URL` sang Atlas |
| Ảnh tải lên bị `404` | Backend khác origin mà URL ảnh là tương đối | Dùng `assetUrl()` ở frontend và đặt đúng `VITE_API_URL` |
| Ảnh mất sau khi deploy Render | Đĩa tạm của Render | Dùng object storage cho production |
| Socket báo `Invalid or expired access token` | Access token hết hạn | Đăng nhập lại; client sẽ tự refresh và tạo lại socket khi token đổi |
| `CLIENT_URL must be configured in production` | Thiếu biến khi `NODE_ENV=production` | Thêm `CLIENT_URL` rồi redeploy |

## Tài liệu liên quan

- [backend/README.md](backend/README.md) — chi tiết API và sự kiện socket.
- [frontend/README.md](frontend/README.md) — biến môi trường và scripts của frontend.
