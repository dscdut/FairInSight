# Code Review & Refactoring Notes

## Date: 2026-05-27
### Refactoring `UserRepository` & `BaseRepository`

**Nguyên nhân sửa chữa:**

1. **Vi phạm Clean Architecture ở hàm `insert`**:
   - Hàm `insert(createUserDto)` trong `UserRepository` trước đây nhận trực tiếp DTO (Data Transfer Object) từ tầng ngoài (Controller/Service). Điều này khiến Repository bị dính chặt (tightly coupled) vào cấu trúc dữ liệu của DTO, gây khó khăn cho việc bảo trì.
   - Trong Clean Architecture, Repository chỉ nên làm việc với dữ liệu đã được chuẩn bị sẵn cho Database (hoặc Domain Entity). Việc mapping DTO sang cấu trúc Data Model nên thuộc trách nhiệm của tầng Service.
   - Thêm vào đó, qua rà soát toàn bộ source code, hàm `insert` này thực chất **chưa từng được gọi ở đâu** (tầng Service hiện tại đang sử dụng hàm `create` được kế thừa từ `BaseRepository`). Vì vậy, hàm `insert` này là code thừa (dead code).

2. **Dư thừa code và chưa tận dụng `BaseRepository`**:
   - Các hàm như `findByEmail`, `findById`, `updateById`, `countActiveUsers` trước đây đều tự gọi lại `prisma.users...` và lặp lại logic thêm điều kiện `deleted_at: null`.
   - `BaseRepository` đã cung cấp sẵn các hàm `findOne`, `findById`, `update`, `count` có sẵn điều kiện lọc `deleted_at`. Việc lặp lại code làm giảm tính tái sử dụng và khiến code dài dòng không cần thiết.

3. **Lỗi Race Condition (TOCTOU) và Vấn đề Hiệu năng khi Insert**:
   - Trước đây, trong tầng Service (`user.service.js`), hàm `createOne` thực hiện kiểm tra `findByEmail` thủ công trước khi `insert`. Điều này sinh ra một nhịp chờ (round-trip) thừa thãi đến DB.
   - Nó cũng mở ra rủi ro Race Condition (Time-of-check to time-of-use), nếu 2 requests tạo cùng 1 email chạy đồng thời, cả 2 bước check đều "pass" và sẽ gây lỗi ở bước `insert`.
   - Việc xử lý (bắt `try/catch`) lỗi Database ở tầng Service khiến code bị rườm rà và sai trách nhiệm. Trách nhiệm bắt các lỗi như "Trùng lặp Unique Constraint" của Database cần nằm ở tầng BaseRepository.

**Các thay đổi đã thực hiện:**

- **`core/common/base.repository.js`**: 
  - Bổ sung tùy chọn `include` (optional) vào các phương thức `create` và `update` để có thể eager load các relations của Prisma dễ dàng hơn khi dùng generic repository.
  - Bổ sung hỗ trợ tham số `tx` (transaction) cho toàn bộ các phương thức (`findFirst`, `findMany`, `create`, `update`, `softDelete`, `hardDelete`, `count`). Điều này cho phép `BaseRepository` hoạt động tốt bên trong các Prisma `$transaction`.
  - Bổ sung Centralized Error Handling: Thêm hàm `handlePrismaError(error)` để tự động bắt các lỗi đặc thù của Prisma trong lúc `create` và `update`:
    - Bắt lỗi `P2002` (Unique Constraint) và ném ra `DuplicateException`.
    - Bắt lỗi `P2025` (Record not found) và ném ra `NotFoundException`.
    Cải tiến này giúp tất cả các entity kế thừa `BaseRepository` sẽ tự động có chung một chuẩn bắt lỗi DB. Đã bọc `try/catch` thêm cho `softDelete` và `hardDelete` để thừa hưởng cơ chế bắt lỗi này.
- **`core/common/enum/*`**:
  - Khai báo bổ sung role `LAWYER` vào `role.enum.js`.
  - Tạo mới file `user.enum.js` để định nghĩa các hằng số `UserStatus` (active, banned) và `UserActionType` (default, pending_lawyer).
- **`core/modules/user/interceptor/create-user.interceptor.js`**:
  - Đưa logic kiểm tra mật khẩu trùng khớp (`confirmPassword`) vào Joi schema thông qua `Joi.ref('password')`. Việc validate này thuộc về Input Validation nên được đẩy lên tầng chặn (Interceptor) là hoàn toàn chính xác.
- **`core/modules/user/user.repository.js`**:
  - Xoá bỏ hoàn toàn hàm `insert` bị dư thừa và vi phạm logic.
  - Sửa lại các hàm `findByEmail`, `findById`, `updateById`, và `countActiveUsers` để gọi trực tiếp các phương thức của class cha (`super.findOne`, `super.findById`, `super.update`, `super.count`), qua đó làm class ngắn gọn và đúng chuẩn thiết kế OOP/Architecture hơn.
  - Sửa đổi hàm `updateRole`, `updateRoleAndLawyerDetails` để tái sử dụng `super.update` và `super.findById` với context `tx`.
  - Fix Clean Architecture: Các hàm xử lý Lawyer Details (`upsertLawyerDetails` và `updateRoleAndLawyerDetails`) trước đây bị truyền trực tiếp `payload` (DTO từ client, chứa `licenseNumber`, `licenseIssuer`), hiện tại đã được tách ra để nhận `lawyerData` (dữ liệu đã được chuẩn bị sẵn cho DB). Logic mapping DTO -> DB Model đã được chuyển lên tầng Service (`user.service.js`).
- **`core/modules/user/services/user.service.js`**:
  - Cập nhật logic `updateUserRole` để mapping DTO (`payload.licenseNumber`, `payload.licenseIssuer`) sang cấu trúc database `lawyerData` (`license_number`, `bar_association`) trước khi truyền xuống Repository.
  - Tối ưu hoá hàm `createOne`: Gỡ bỏ logic rào lỗi thủ công `findByEmail` và vòng lặp `try/catch`. Ứng dụng giờ đây phó thác hoàn toàn việc chống trùng lặp vào Database Constraints, vừa đảm bảo tính toàn vẹn (integrity) vừa tiết kiệm 1 query (cải thiện hiệu năng). Ngoài ra, logic validate `password` và `confirm_password` cũng đã được gỡ bỏ khỏi Service vì đã được Joi lo liệu.
  - Tối ưu hoá hàm `upsertOne`: Tương tự như `createOne`, gỡ bỏ hoàn toàn 2 queries dư thừa là `findById` (kiểm tra tồn tại) và `findByEmail` (kiểm tra trùng lặp email). Giờ đây chỉ thực hiện đúng 1 query duy nhất là `updateById`, phần bắt lỗi User không tồn tại (P2025) hay Email trùng lặp (P2002) đã được tự động xử lý mượt mà ở `BaseRepository.handlePrismaError()`. DTO cũng được rà soát và mapping cẩn thận bằng spread.
  - Tối ưu hoá và Fix Bug hàm `deleteUser`: Gỡ bỏ logic `findById` thừa thãi. Đồng thời fix bug logic `if (result.count === 0)` sai cú pháp (do `softDelete` dùng Prisma `update` không trả về `count`). Giờ đây hàm uỷ thác hoàn toàn cho `P2025` của Prisma thông qua `BaseRepository` để báo lỗi 404 nếu xoá một user không tồn tại, chỉ tốn đúng 1 query.
  - Tối ưu hoá hàm `banUser` và `unbanUser`:
    - Gỡ bỏ câu lệnh dư thừa `if (reason && reason.length > 500)` vì logic này đã được lo liệu hoàn toàn bởi `BanUserInterceptor` (Joi Input Validation).
    - Tiết kiệm 1 DB Query: Trước đây code thực hiện fetch lại `user` sau khi update để trả về dữ liệu mới. Hiện tại đã tận dụng luôn object `user` được fetch ở đầu hàm, kết hợp với việc cập nhật state tĩnh trên vùng nhớ để trả về luôn, giúp 2 hàm này giảm từ 3 queries xuống chỉ còn 2 queries.
  - Fix Clean Architecture & Security (Mass Assignment): Thay vì dùng spread operator `...userData` để ném toàn bộ dữ liệu từ DTO vào hàm `create` của Repository (gây rủi ro Mass Assignment nếu hacker truyền thêm các trường nhạy cảm như `role_id`), logic tạo mới đã được sửa lại để mapping tường minh (`explicit mapping`) từ DTO sang DB Model (`userModel`).
  - Code Clean-up (Anti Magic Strings): Quét và gỡ bỏ toàn bộ các chuỗi hardcode (`'USER'`, `'lawyer'`, `'banned'`, `'active'`, `'pending_lawyer'`) trôi nổi trong các hàm `createOne`, `toUserListItem`, `updateUserRole`, `banUser`, `unbanUser` và `listBannedUsers`. Thay thế bằng các Enum/Constant (`Role`, `UserStatus`, `UserActionType`) vừa được tạo ở `core/common/enum`, giúp code tránh typo và cực kỳ dễ bảo trì/mở rộng.
