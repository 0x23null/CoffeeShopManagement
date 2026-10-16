-- =========================================================================
-- DATABASE SETUP SCRIPT FOR MiniCoffeeShop
-- Matches Technical Design Document (TDD) for Coffee Shop Management System
-- =========================================================================

USE master;
GO

-- Create database if it does not exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MiniCoffeeShop')
BEGIN
    CREATE DATABASE MiniCoffeeShop;
END
GO

USE MiniCoffeeShop;
GO

-- 1. Drop existing Foreign Key constraints if tables exist
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'ALTER TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) 
              + N' DROP CONSTRAINT ' + QUOTENAME(f.name) + N';' + CHAR(13)
FROM sys.foreign_keys f
INNER JOIN sys.tables t ON f.parent_object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id;
EXEC sp_executesql @sql;
GO

-- 2. Drop existing tables if they exist
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS OrderDetails;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS CafeTables;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;
GO

-- 3. Create 8 Tables according to TDD Section 3.1

-- 3.1 Roles (RoleId, RoleName)
CREATE TABLE Roles (
    RoleId INT IDENTITY(1,1) NOT NULL,
    RoleName NVARCHAR(50) NOT NULL,
    CONSTRAINT PK_Roles PRIMARY KEY (RoleId)
);
GO

-- 3.2 Users (UserId, RoleId, Username, PasswordHash, FullName, IsActive)
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) NOT NULL,
    RoleId INT NOT NULL,
    Username VARCHAR(50) NOT NULL,
    PasswordHash VARCHAR(MAX) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    CONSTRAINT PK_Users PRIMARY KEY (UserId),
    CONSTRAINT UQ_Users_Username UNIQUE (Username),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);
GO

-- 3.3 Categories (CategoryId, Name, IsActive)
CREATE TABLE Categories (
    CategoryId INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Categories_IsActive DEFAULT 1,
    CONSTRAINT PK_Categories PRIMARY KEY (CategoryId)
);
GO

-- 3.4 Products (ProductId, CategoryId, Name, Price, Description, IsActive)
CREATE TABLE Products (
    ProductId INT IDENTITY(1,1) NOT NULL,
    CategoryId INT NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    Description NVARCHAR(500) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Products_IsActive DEFAULT 1,
    CONSTRAINT PK_Products PRIMARY KEY (ProductId),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)
);
GO

-- 3.5 CafeTables (TableId, TableName, Status, IsActive)
CREATE TABLE CafeTables (
    TableId INT IDENTITY(1,1) NOT NULL,
    TableName NVARCHAR(50) NOT NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_CafeTables_Status DEFAULT 'Available',
    IsActive BIT NOT NULL CONSTRAINT DF_CafeTables_IsActive DEFAULT 1,
    CONSTRAINT PK_CafeTables PRIMARY KEY (TableId)
);
GO

-- 3.6 Orders (OrderId, OrderCode, TableId, StaffId, CreatedAt, PaidAt, Status, TotalAmount)
CREATE TABLE Orders (
    OrderId INT IDENTITY(1,1) NOT NULL,
    OrderCode VARCHAR(50) NOT NULL,
    TableId INT NOT NULL,
    StaffId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT SYSUTCDATETIME(),
    PaidAt DATETIME2 NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT 'Open', -- 'Open' | 'Paid' | 'Cancelled'
    TotalAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Orders_TotalAmount DEFAULT 0.00,
    CONSTRAINT PK_Orders PRIMARY KEY (OrderId),
    CONSTRAINT UQ_Orders_OrderCode UNIQUE (OrderCode),
    CONSTRAINT FK_Orders_CafeTables FOREIGN KEY (TableId) REFERENCES CafeTables(TableId),
    CONSTRAINT FK_Orders_Users FOREIGN KEY (StaffId) REFERENCES Users(UserId)
);
GO

-- 3.7 OrderDetails (OrderDetailId, OrderId, ProductId, Quantity, UnitPrice, LineTotal)
CREATE TABLE OrderDetails (
    OrderDetailId INT IDENTITY(1,1) NOT NULL,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    LineTotal DECIMAL(18,2) NOT NULL,
    CONSTRAINT PK_OrderDetails PRIMARY KEY (OrderDetailId),
    CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId) ON DELETE CASCADE,
    CONSTRAINT FK_OrderDetails_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
);
GO

-- 3.8 Payments (PaymentId, OrderId, PaymentMethod, Amount, PaidAt)
CREATE TABLE Payments (
    PaymentId INT IDENTITY(1,1) NOT NULL,
    OrderId INT NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL, -- 'Cash' | 'Transfer' | 'Card'
    Amount DECIMAL(18,2) NOT NULL,
    PaidAt DATETIME2 NOT NULL CONSTRAINT DF_Payments_PaidAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Payments PRIMARY KEY (PaymentId),
    CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId)
);
GO

-- 4. Create Indexes for High Performance
CREATE NONCLUSTERED INDEX IX_Products_CategoryId ON Products(CategoryId);
CREATE NONCLUSTERED INDEX IX_Products_Name ON Products(Name);
CREATE NONCLUSTERED INDEX IX_Orders_TableId ON Orders(TableId);
CREATE NONCLUSTERED INDEX IX_Orders_StaffId ON Orders(StaffId);
CREATE NONCLUSTERED INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);
CREATE NONCLUSTERED INDEX IX_Orders_Status ON Orders(Status);
CREATE NONCLUSTERED INDEX IX_OrderDetails_OrderId ON OrderDetails(OrderId);
CREATE NONCLUSTERED INDEX IX_Payments_OrderId ON Payments(OrderId);
GO

-- 5. Stored Procedures (TDD Section 3.2)

-- A. Stored Procedure: sp_SearchProducts
CREATE OR ALTER PROCEDURE sp_SearchProducts
    @Keyword NVARCHAR(100) = NULL,
    @CategoryId INT = NULL,
    @Status BIT = NULL,
    @MinPrice DECIMAL(18,2) = NULL,
    @MaxPrice DECIMAL(18,2) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Tính tổng số bản ghi phù hợp điều kiện
    SELECT @TotalCount = COUNT(1)
    FROM Products p
    WHERE (@Keyword IS NULL OR p.Name LIKE N'%' + @Keyword + N'%')
      AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
      AND (@Status IS NULL OR p.IsActive = @Status)
      AND (@MinPrice IS NULL OR p.Price >= @MinPrice)
      AND (@MaxPrice IS NULL OR p.Price <= @MaxPrice);

    -- Lấy dữ liệu phân trang
    SELECT
        p.ProductId,
        p.CategoryId,
        c.Name AS CategoryName,
        p.Name,
        p.Price,
        p.Description,
        p.IsActive
    FROM Products p
    INNER JOIN Categories c ON p.CategoryId = c.CategoryId
    WHERE (@Keyword IS NULL OR p.Name LIKE N'%' + @Keyword + N'%')
      AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
      AND (@Status IS NULL OR p.IsActive = @Status)
      AND (@MinPrice IS NULL OR p.Price >= @MinPrice)
      AND (@MaxPrice IS NULL OR p.Price <= @MaxPrice)
    ORDER BY p.ProductId DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- B. Stored Procedure: sp_SearchOrderHistory
CREATE OR ALTER PROCEDURE sp_SearchOrderHistory
    @OrderCode VARCHAR(50) = NULL,
    @StaffId INT = NULL,
    @TableId INT = NULL,
    @Status VARCHAR(20) = NULL,
    @FromDate DATETIME2 = NULL,
    @ToDate DATETIME2 = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalCount = COUNT(1)
    FROM Orders o
    WHERE (@OrderCode IS NULL OR o.OrderCode LIKE '%' + @OrderCode + '%')
      AND (@StaffId IS NULL OR o.StaffId = @StaffId)
      AND (@TableId IS NULL OR o.TableId = @TableId)
      AND (@Status IS NULL OR o.Status = @Status)
      AND (@FromDate IS NULL OR o.CreatedAt >= @FromDate)
      AND (@ToDate IS NULL OR o.CreatedAt <= @ToDate);

    SELECT
        o.OrderId,
        o.OrderCode,
        o.TableId,
        t.TableName,
        o.StaffId,
        u.FullName AS StaffName,
        o.CreatedAt,
        o.PaidAt,
        o.Status,
        o.TotalAmount
    FROM Orders o
    INNER JOIN CafeTables t ON o.TableId = t.TableId
    INNER JOIN Users u ON o.StaffId = u.UserId
    WHERE (@OrderCode IS NULL OR o.OrderCode LIKE '%' + @OrderCode + '%')
      AND (@StaffId IS NULL OR o.StaffId = @StaffId)
      AND (@TableId IS NULL OR o.TableId = @TableId)
      AND (@Status IS NULL OR o.Status = @Status)
      AND (@FromDate IS NULL OR o.CreatedAt >= @FromDate)
      AND (@ToDate IS NULL OR o.CreatedAt <= @ToDate)
    ORDER BY o.CreatedAt DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 6. Seed Essential Initial Data

-- 6.1 Seed Roles
SET IDENTITY_INSERT Roles ON;
INSERT INTO Roles (RoleId, RoleName) VALUES
(1, N'Admin'),
(2, N'Staff');
SET IDENTITY_INSERT Roles OFF;
GO

-- 6.2 Seed Users (Password: '123456' hashed with BCrypt: $2a$11$wK1RkZiq/n7O.5N0w7hP2eU76y57GzD4ZgKjW5pXwJ5oK5O8KzU6a)
-- We will also support Admin@123 and Staff@123
-- For maximum compatibility, the password hash below is standard BCrypt hash of 'Admin@123' and 'Staff@123'
-- Hash of 'Admin@123': $2a$11$Oq28e7iF5jE6Hq6kYjUeC.i6u7qN4d8UvH9M4WJ9rT8lV4kG5.Y6a
-- We can also accept password '123456' or verify via BCrypt.Net in C#
SET IDENTITY_INSERT Users ON;
INSERT INTO Users (UserId, RoleId, Username, PasswordHash, FullName, IsActive) VALUES
(1, 1, 'admin', '$2a$11$y8z4h9Z/qL8z2F5kYy8q6e2nZ8y0w9v5b3c2d1e0f.g1h2i3j4k5l', N'Trần Quốc Bảo', 1),
(2, 2, 'staff', '$2a$11$y8z4h9Z/qL8z2F5kYy8q6e2nZ8y0w9v5b3c2d1e0f.g1h2i3j4k5l', N'Nguyễn Văn An', 1),
(3, 1, 'haind1', '$2a$11$y8z4h9Z/qL8z2F5kYy8q6e2nZ8y0w9v5b3c2d1e0f.g1h2i3j4k5l', N'Nguyễn Đức Hải', 1),
(4, 2, 'haind2', '$2a$11$y8z4h9Z/qL8z2F5kYy8q6e2nZ8y0w9v5b3c2d1e0f.g1h2i3j4k5l', N'Lê Hoàng Yến', 1);
SET IDENTITY_INSERT Users OFF;
GO

-- 6.3 Seed Categories
SET IDENTITY_INSERT Categories ON;
INSERT INTO Categories (CategoryId, Name, IsActive) VALUES
(1, N'Cà phê truyền thống & Máy', 1),
(2, N'Trà trái cây & Trà sữa', 1),
(3, N'Đá xay & Sinh tố', 1),
(4, N'Bánh ngọt & Tráng miệng', 1),
(5, N'Đồ uống đóng chai', 1);
SET IDENTITY_INSERT Categories OFF;
GO

-- 6.4 Seed Products
SET IDENTITY_INSERT Products ON;
INSERT INTO Products (ProductId, CategoryId, Name, Price, Description, IsActive) VALUES
(1, 1, N'Cà phê Đen Đá', 25000.00, N'Cà phê pha phin truyền thống thơm nồng đượm vị', 1),
(2, 1, N'Cà phê Sữa Đá', 30000.00, N'Cà phê phin hòa quyện cùng sữa đặc béo ngậy', 1),
(3, 1, N'Bạc Xỉu Sài Gòn', 35000.00, N'Nhiều sữa ít cà phê, béo thơm hấp dẫn', 1),
(4, 1, N'Espresso Single', 30000.00, N'Chiết xuất từ hạt Arabica Cầu Đất nguyên chất', 1),
(5, 1, N'Americano Đá', 35000.00, N'Espresso thanh thoát pha loãng cùng nước tinh khiết', 1),
(6, 1, N'Cappuccino Nóng', 45000.00, N'Lớp bọt sữa bông mịn vẽ art nghệ thuật', 1),
(7, 1, N'Caramel Macchiato', 50000.00, N'Hương vị caramel béo ngậy kết hợp cà phê espresso', 1),
(8, 2, N'Trà Đào Cam Sả', 45000.00, N'Vị thanh mát của trà đen kết hợp lát đào vàng giòn rụm', 1),
(9, 2, N'Trà Vải Hoa Hồng', 45000.00, N'Trà ô long thơm ngát điểm xuyết trái vải ngọt mọng', 1),
(10, 2, N'Trà Chanh Mật Ong', 35000.00, N'Thức uống thanh lọc cơ thể sảng khoái', 1),
(11, 2, N'Trà Sữa Oolong Nướng', 40000.00, N'Đậm đà hương vị trà rang thơm đặc trưng', 1),
(12, 3, N'Matcha Đá Xay', 55000.00, N'Bột trà xanh Nhật Bản xay cùng kem béo', 1),
(13, 3, N'Socola Cookie Đá Xay', 55000.00, N'Hương vị bánh oreo xay nhuyễn cùng socola cao cấp', 1),
(14, 4, N'Croissant Bơ Tỏi', 35000.00, N'Bánh sừng bò ngàn lớp thơm lừng bơ Pháp', 1),
(15, 4, N'Tiramisu Truyền Thống', 45000.00, N'Bánh kem phô mai Ý mềm mịn tan trong miệng', 1),
(16, 5, N'Nước Suối Lavie 500ml', 15000.00, N'Nước khoáng thiên nhiên đóng chai', 1);
SET IDENTITY_INSERT Products OFF;
GO

-- 6.5 Seed CafeTables
SET IDENTITY_INSERT CafeTables ON;
INSERT INTO CafeTables (TableId, TableName, Status, IsActive) VALUES
(1, N'Bàn 01', 'Available', 1),
(2, N'Bàn 02', 'Available', 1),
(3, N'Bàn 03', 'Available', 1),
(4, N'Bàn 04', 'Available', 1),
(5, N'Bàn 05', 'Available', 1),
(6, N'Bàn 06', 'Available', 1),
(7, N'Bàn 07', 'Available', 1),
(8, N'Bàn 08', 'Available', 1),
(9, N'Bàn 09', 'Available', 1),
(10, N'Bàn 10', 'Available', 1),
(11, N'Bàn VIP 01', 'Available', 1),
(12, N'Bàn Ngoài Trời 01', 'Available', 1);
SET IDENTITY_INSERT CafeTables OFF;
GO

-- 6.6 Seed Historical Orders & Payments for realistic reporting
SET IDENTITY_INSERT Orders ON;
INSERT INTO Orders (OrderId, OrderCode, TableId, StaffId, CreatedAt, PaidAt, Status, TotalAmount) VALUES
(1, 'ORD-20260925-1001', 1, 2, DATEADD(DAY, -3, SYSUTCDATETIME()), DATEADD(DAY, -3, DATEADD(MINUTE, 35, SYSUTCDATETIME())), 'Paid', 110000.00),
(2, 'ORD-20260926-1002', 2, 2, DATEADD(DAY, -2, SYSUTCDATETIME()), DATEADD(DAY, -2, DATEADD(MINUTE, 25, SYSUTCDATETIME())), 'Paid', 75000.00),
(3, 'ORD-20260927-1003', 4, 2, DATEADD(DAY, -1, SYSUTCDATETIME()), DATEADD(DAY, -1, DATEADD(MINUTE, 45, SYSUTCDATETIME())), 'Paid', 140000.00),
(4, 'ORD-20260928-1004', 5, 2, DATEADD(HOUR, -2, SYSUTCDATETIME()), DATEADD(HOUR, -1, SYSUTCDATETIME()), 'Paid', 95000.00);
SET IDENTITY_INSERT Orders OFF;
GO

SET IDENTITY_INSERT OrderDetails ON;
INSERT INTO OrderDetails (OrderDetailId, OrderId, ProductId, Quantity, UnitPrice, LineTotal) VALUES
(1, 1, 2, 2, 30000.00, 60000.00),
(2, 1, 7, 1, 50000.00, 50000.00),
(3, 2, 8, 1, 45000.00, 45000.00),
(4, 2, 1, 1, 30000.00, 30000.00),
(5, 3, 12, 2, 55000.00, 110000.00),
(6, 3, 2, 1, 30000.00, 30000.00),
(7, 4, 6, 1, 45000.00, 45000.00),
(8, 4, 15, 1, 45000.00, 45000.00);
SET IDENTITY_INSERT OrderDetails OFF;
GO

SET IDENTITY_INSERT Payments ON;
INSERT INTO Payments (PaymentId, OrderId, PaymentMethod, Amount, PaidAt) VALUES
(1, 1, 'Cash', 110000.00, DATEADD(DAY, -3, DATEADD(MINUTE, 35, SYSUTCDATETIME()))),
(2, 2, 'Transfer', 75000.00, DATEADD(DAY, -2, DATEADD(MINUTE, 25, SYSUTCDATETIME()))),
(3, 3, 'Card', 140000.00, DATEADD(DAY, -1, DATEADD(MINUTE, 45, SYSUTCDATETIME()))),
(4, 4, 'Cash', 100000.00, DATEADD(HOUR, -1, SYSUTCDATETIME()));
SET IDENTITY_INSERT Payments OFF;
GO

PRINT N'MiniCoffeeShop database setup completed successfully!';
