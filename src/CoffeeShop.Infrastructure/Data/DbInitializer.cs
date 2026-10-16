using Microsoft.EntityFrameworkCore;
using CoffeeShop.Domain.Entities;

namespace CoffeeShop.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        // 1. Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // 2. Ensure Stored Procedures exist
        await CreateStoredProceduresAsync(context);

        // 3. Seed Roles
        if (!await context.Roles.AnyAsync())
        {
            var roles = new List<Role>
            {
                new() { RoleId = 1, RoleName = "Admin" },
                new() { RoleId = 2, RoleName = "Staff" }
            };
            
            // Using ExecuteSqlRaw to handle IDENTITY insert cleanly if needed
            foreach (var r in roles)
            {
                await context.Database.ExecuteSqlRawAsync(
                    "IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleId = {0}) " +
                    "BEGIN SET IDENTITY_INSERT Roles ON; INSERT INTO Roles (RoleId, RoleName) VALUES ({0}, {1}); SET IDENTITY_INSERT Roles OFF; END",
                    r.RoleId, r.RoleName);
            }
        }

        // 4. Seed Users
        if (!await context.Users.AnyAsync())
        {
            string adminHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
            string staffHash = BCrypt.Net.BCrypt.HashPassword("Staff@123");

            var users = new List<User>
            {
                new() { RoleId = 1, Username = "admin", PasswordHash = adminHash, FullName = "Trần Quốc Bảo", IsActive = true },
                new() { RoleId = 2, Username = "staff", PasswordHash = staffHash, FullName = "Nguyễn Văn An", IsActive = true },
                new() { RoleId = 1, Username = "haind1", PasswordHash = adminHash, FullName = "Nguyễn Đức Hải", IsActive = true },
                new() { RoleId = 2, Username = "haind2", PasswordHash = staffHash, FullName = "Lê Hoàng Yến", IsActive = true }
            };

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
        }
        else
        {
            // Ensure passwords are valid BCrypt hashes if existing records had plain text
            var users = await context.Users.ToListAsync();
            bool modified = false;
            foreach (var u in users)
            {
                if (!u.PasswordHash.StartsWith("$2") || u.PasswordHash.Length < 20)
                {
                    u.PasswordHash = u.RoleId == 1 
                        ? BCrypt.Net.BCrypt.HashPassword("Admin@123") 
                        : BCrypt.Net.BCrypt.HashPassword("Staff@123");
                    u.IsActive = true;
                    modified = true;
                }
            }
            if (modified)
            {
                await context.SaveChangesAsync();
            }
        }

        // 5. Seed Categories
        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<Category>
            {
                new() { Name = "Cà phê truyền thống & Máy", IsActive = true },
                new() { Name = "Trà trái cây & Trà sữa", IsActive = true },
                new() { Name = "Đá xay & Sinh tố", IsActive = true },
                new() { Name = "Bánh ngọt & Tráng miệng", IsActive = true },
                new() { Name = "Đồ uống đóng chai", IsActive = true }
            };
            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }

        // 6. Seed Products
        if (!await context.Products.AnyAsync())
        {
            var catCoffee = await context.Categories.FirstAsync(c => c.Name.Contains("Cà phê"));
            var catTea = await context.Categories.FirstAsync(c => c.Name.Contains("Trà"));
            var catFreeze = await context.Categories.FirstAsync(c => c.Name.Contains("Đá xay"));
            var catBakery = await context.Categories.FirstAsync(c => c.Name.Contains("Bánh"));
            var catBottled = await context.Categories.FirstAsync(c => c.Name.Contains("chai"));

            var products = new List<Product>
            {
                new() { CategoryId = catCoffee.CategoryId, Name = "Cà phê Đen Đá", Price = 25000, Description = "Cà phê pha phin truyền thống thơm nồng đượm vị", IsActive = true },
                new() { CategoryId = catCoffee.CategoryId, Name = "Cà phê Sữa Đá", Price = 30000, Description = "Cà phê phin hòa quyện cùng sữa đặc béo ngậy", IsActive = true },
                new() { CategoryId = catCoffee.CategoryId, Name = "Bạc Xỉu Sài Gòn", Price = 35000, Description = "Nhiều sữa ít cà phê, béo thơm hấp dẫn", IsActive = true },
                new() { CategoryId = catCoffee.CategoryId, Name = "Espresso Single", Price = 30000, Description = "Chiết xuất từ hạt Arabica Cầu Đất nguyên chất", IsActive = true },
                new() { CategoryId = catCoffee.CategoryId, Name = "Americano Đá", Price = 35000, Description = "Espresso thanh thoát pha loãng cùng nước tinh khiết", IsActive = true },
                new() { CategoryId = catCoffee.CategoryId, Name = "Cappuccino Nóng", Price = 45000, Description = "Lớp bọt sữa bông mịn vẽ art nghệ thuật", IsActive = true },
                new() { CategoryId = catCoffee.CategoryId, Name = "Caramel Macchiato", Price = 50000, Description = "Hương vị caramel béo ngậy kết hợp cà phê espresso", IsActive = true },
                new() { CategoryId = catTea.CategoryId, Name = "Trà Đào Cam Sả", Price = 45000, Description = "Vị thanh mát của trà đen kết hợp lát đào vàng giòn rụm", IsActive = true },
                new() { CategoryId = catTea.CategoryId, Name = "Trà Vải Hoa Hồng", Price = 45000, Description = "Trà ô long thơm ngát điểm xuyết trái vải ngọt mọng", IsActive = true },
                new() { CategoryId = catTea.CategoryId, Name = "Trà Chanh Mật Ong", Price = 35000, Description = "Thức uống thanh lọc cơ thể sảng khoái", IsActive = true },
                new() { CategoryId = catTea.CategoryId, Name = "Trà Sữa Oolong Nướng", Price = 40000, Description = "Đậm đà hương vị trà rang thơm đặc trưng", IsActive = true },
                new() { CategoryId = catFreeze.CategoryId, Name = "Matcha Đá Xay", Price = 55000, Description = "Bột trà xanh Nhật Bản xay cùng kem béo", IsActive = true },
                new() { CategoryId = catFreeze.CategoryId, Name = "Socola Cookie Đá Xay", Price = 55000, Description = "Hương vị bánh oreo xay nhuyễn cùng socola cao cấp", IsActive = true },
                new() { CategoryId = catBakery.CategoryId, Name = "Croissant Bơ Tỏi", Price = 35000, Description = "Bánh sừng bò ngàn lớp thơm lừng bơ Pháp", IsActive = true },
                new() { CategoryId = catBakery.CategoryId, Name = "Tiramisu Truyền Thống", Price = 45000, Description = "Bánh kem phô mai Ý mềm mịn tan trong miệng", IsActive = true },
                new() { CategoryId = catBottled.CategoryId, Name = "Nước Suối Lavie 500ml", Price = 15000, Description = "Nước khoáng thiên nhiên đóng chai", IsActive = true }
            };
            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }

        // 7. Seed CafeTables
        if (!await context.CafeTables.AnyAsync())
        {
            var tables = new List<CafeTable>
            {
                new() { TableName = "Bàn 01", Status = "Available", IsActive = true },
                new() { TableName = "Bàn 02", Status = "Available", IsActive = true },
                new() { TableName = "Bàn 03", Status = "Available", IsActive = true },
                new() { TableName = "Bàn 04", Status = "Available", IsActive = true },
                new() { TableName = "Bàn 05", Status = "Available", IsActive = true },
                new() { TableName = "Bàn 06", Status = "Available", IsActive = true },
                new() { TableName = "Bàn 07", Status = "Available", IsActive = true },
                new() { TableName = "Bàn 08", Status = "Available", IsActive = true },
                new() { TableName = "Bàn 09", Status = "Available", IsActive = true },
                new() { TableName = "Bàn 10", Status = "Available", IsActive = true },
                new() { TableName = "Bàn VIP 01", Status = "Available", IsActive = true },
                new() { TableName = "Bàn Ngoài Trời 01", Status = "Available", IsActive = true }
            };
            await context.CafeTables.AddRangeAsync(tables);
            await context.SaveChangesAsync();
        }
    }

    private static async Task CreateStoredProceduresAsync(AppDbContext context)
    {
        string spSearchProducts = @"
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

    SELECT @TotalCount = COUNT(1)
    FROM Products p
    WHERE (@Keyword IS NULL OR p.Name LIKE N'%' + @Keyword + N'%')
      AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
      AND (@Status IS NULL OR p.IsActive = @Status)
      AND (@MinPrice IS NULL OR p.Price >= @MinPrice)
      AND (@MaxPrice IS NULL OR p.Price <= @MaxPrice);

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
END;";

        string spSearchOrderHistory = @"
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
END;";

        await context.Database.ExecuteSqlRawAsync(spSearchProducts);
        await context.Database.ExecuteSqlRawAsync(spSearchOrderHistory);
    }
}
