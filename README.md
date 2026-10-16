# Hệ Thống Quản Lý Quán Cà Phê (Coffee Shop Management System)

Dự án được xây dựng theo chuẩn **Clean Layered Architecture** và tuân thủ toàn bộ yêu cầu trong **Technical Design Document (TDD)**:
- **Database**: Microsoft SQL Server (`MiniCoffeeShop`) với đầy đủ 8 thực thể chuẩn hóa, ràng buộc toàn vẹn, Indexing và 2 Stored Procedures bắt buộc (`sp_SearchProducts`, `sp_SearchOrderHistory`).
- **Backend API**: ASP.NET Core Web API (.NET 8), Entity Framework Core, Transaction thanh toán nguyên tử, phân quyền Role-based (Admin, Staff) với JWT Bearer Token.
- **Frontend Client**: ReactJS (Vite), Axios Interceptors, Context API, CSS giao diện ấm cúng theo phong cách quán cà phê hiện đại.
- **Unit Test**: XUnit kiểm thử nghiệp vụ bàn và đơn hàng (`TableServiceTests`, `OrderServiceTests`).

---

## 1. Cấu Trúc Dự Án

```
CoffeeShopManagement/
│
├── setup_database.sql                 # Script khởi tạo Database MiniCoffeeShop (8 bảng, SPs, Seed Data)
├── CoffeeShop.slnx                    # File Solution
│
├── CoffeeShop.Api/                    # ASP.NET Core Web API
│   ├── Controllers/                   # Auth, Categories, Products, Tables, Orders, Users, Reports
│   ├── Data/                          # AppDbContext, DbInitializer
│   ├── DTOs/                          # Request/Response/Search DTOs
│   ├── Entities/                      # 8 Entities: Role, User, Category, Product, CafeTable, Order, OrderDetail, Payment
│   ├── Middlewares/                   # GlobalExceptionMiddleware
│   ├── Services/                      # Interfaces & Implementations
│   ├── appsettings.json
│   └── Program.cs
│
├── CoffeeShop.Tests/                  # XUnit Unit Test Project
│   ├── TableServiceTests.cs           # Kiểm thử trùng tên bàn, cấm xóa bàn đang Occupied
│   └── OrderServiceTests.cs           # Kiểm thử cấm 2 đơn mở trên 1 bàn, cấm sửa đơn Paid, tính tổng tiền
│
└── CoffeeShop.Client/                 # ReactJS Frontend (Vite)
    ├── src/
    │   ├── api/                       # axiosClient, authApi, orderApi, productApi, tableApi, reportApi, ...
    │   ├── components/                # Navbar, Sidebar, Pagination (10/50/100), Modal, ProtectedRoute
    │   ├── contexts/                  # AuthContext
    │   ├── pages/                     # Login, POS/Sơ đồ bàn, OrderDetail, OrderHistory, Product, Category, User, Dashboard
    │   ├── App.jsx
    │   └── App.css
    └── package.json
```

---

## 2. Thông Tin Tài Khoản Đăng Nhập

| Tài khoản | Họ và tên | Mật khẩu | Vai trò (Role) | Chức năng truy cập |
|---|---|---|---|---|
| **staff** | Nguyễn Văn An | `Staff@123` | **Staff** | Sơ đồ bàn (POS), Mở bàn, Chọn món, Tính tiền, Lịch sử đơn hàng |
| **haind2** | Lê Hoàng Yến | `Staff@123` | **Staff** | Sơ đồ bàn (POS), Mở bàn, Chọn món, Tính tiền, Lịch sử đơn hàng |
| **admin** | Trần Quốc Bảo | `Admin@123` | **Admin** | Toàn quyền: Dashboard doanh thu, Quản lý sản phẩm, Danh mục, Bàn, Tài khoản |
| **haind1** | Nguyễn Đức Hải | `Admin@123` | **Admin** | Toàn quyền: Dashboard doanh thu, Quản lý sản phẩm, Danh mục, Bàn, Tài khoản |

---

## 3. Hướng Dẫn Khởi Chạy Dự Án

### Bước 1: Khởi động Backend API (.NET 8)
```powershell
cd d:\DotNetPractice\CoffeeShopManagement\CoffeeShop.Api
dotnet run --urls "http://localhost:5081"
```
- Swagger API UI: `http://localhost:5081/swagger`

### Bước 2: Khởi động Frontend React (Vite)
Mở một cửa sổ Terminal mới:
```powershell
cd d:\DotNetPractice\CoffeeShopManagement\CoffeeShop.Client
npm run dev
```
- Truy cập ứng dụng tại: `http://localhost:3000`

---

## 4. Kịch Bản Demo Chuẩn (7 Bước)

1. **Bước 1 (Đăng nhập Staff)**: Đăng nhập bằng `staff` / `Staff@123`. Thanh điều hướng chỉ hiển thị *Sơ đồ bàn (POS)* và *Lịch sử đơn hàng*, hoàn toàn ẩn các menu quản trị của Admin.
2. **Bước 2 (Mở bàn trống)**: Vào giao diện Sơ đồ bàn, chọn một bàn trống `Available` (ví dụ: *Bàn 03*) và nhấn nút **Tạo Order**.
3. **Bước 3 (Thêm món & tự tính tổng)**: Chọn thêm 2-3 món nước, thử nghiệm tăng/giảm số lượng (`+` / `-`). Tổng tiền hóa đơn tự động cập nhật ngay lập tức. Bàn đổi trạng thái sang `Occupied`.
4. **Bước 4 (Thanh toán nguyên tử)**: Nhấn **Thanh toán**, chọn *Tiền mặt*, nhập tiền khách đưa. Nhấn *Xác nhận thanh toán*. Order chuyển sang `Paid`, giải phóng bàn về lại `Available` trong cùng một Database Transaction.
5. **Bước 5 (Tra cứu lịch sử đơn hàng)**: Chuyển sang màn hình *Lịch sử đơn hàng*, gọi Stored Procedure `sp_SearchOrderHistory` lọc theo mã hóa đơn, khoảng thời gian, xem phân trang 10/50/100 dòng.
6. **Bước 6 (Đăng nhập Admin & CRUD sản phẩm)**: Đăng xuất, đăng nhập tài khoản `admin` / `Admin@123`. Vào *Quản lý sản phẩm*, gọi Stored Procedure `sp_SearchProducts` và thử nghiệm Thêm/Sửa sản phẩm.
7. **Bước 7 (Dashboard & Báo cáo)**: Mở màn hình *Dashboard*, quan sát các thẻ KPI doanh thu, biểu đồ cột 7 ngày gần nhất và bảng Top 5 món bán chạy nhất.
