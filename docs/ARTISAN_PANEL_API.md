# Artisan Panel API - Theo Backend

## Endpoints dành cho role ARTISAN

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/artisans/me` | Lấy thông tin nghệ nhân của user hiện tại |
| GET | `/api/artisans/me/schedules` | Lịch trình tour của nghệ nhân |
| PUT | `/api/artisans/me` | Cập nhật profile nghệ nhân (fullName, specialization, bio, workshopAddress, provinceId, profileImageUrl) |

## Fallback (khi backend chưa có /me)

- `getMyArtisan`: GET `/api/artisans/public` + GET `/api/users/me` → tìm artisan có `user.id === currentUser.id`
- `getMySchedules`: GET `/api/tour-schedules` → filter theo `tour.artisan.id`
- `updateMyArtisanProfile`: PUT `/api/artisans/{id}`

## Request/Response

### GET /api/artisans/me
**Response:** ArtisanResponse (id, fullName, specialization, bio, profileImageUrl, provinceId, workshopAddress, ...)

### GET /api/artisans/me/schedules
**Response:** TourSchedule[] (tour, tourDate, startTime, maxSlots, bookedSlots, status, ...)

### PUT /api/artisans/me
**Request body:**
```json
{
  "fullName": "string",
  "specialization": "string",
  "bio": "string",
  "workshopAddress": "string",
  "provinceId": number,
  "profileImageUrl": "string"
}
```
