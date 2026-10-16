using Microsoft.EntityFrameworkCore;
using CoffeeShop.Infrastructure.Data;
using CoffeeShop.Application.DTOs.Orders;
using CoffeeShop.Domain.Entities;
using CoffeeShop.Application.Services;
using Xunit;

namespace CoffeeShop.Tests;

public class OrderServiceTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateOrderAsync_TwoParallelOrdersOnSameTable_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var table = new CafeTable { TableId = 1, TableName = "Bàn 01", Status = "Available", IsActive = true };
        var staff = new User { UserId = 1, Username = "staff1", RoleId = 2, FullName = "Nhân viên", IsActive = true };
        context.CafeTables.Add(table);
        context.Users.Add(staff);
        await context.SaveChangesAsync();

        var service = new OrderService(context);

        // First order - succeeds and sets table to Occupied
        var order1 = await service.CreateOrderAsync(table.TableId, staff.UserId);
        Assert.NotNull(order1);
        Assert.Equal("Open", order1.Status);

        // Act & Assert - second order on the same table must throw
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateOrderAsync(table.TableId, staff.UserId));
    }

    [Fact]
    public async Task AddOrUpdateItemAsync_WhenOrderIsAlreadyPaid_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var table = new CafeTable { TableId = 1, TableName = "Bàn 01", Status = "Available", IsActive = true };
        var staff = new User { UserId = 1, Username = "staff1", RoleId = 2, FullName = "Nhân viên", IsActive = true };
        var category = new Category { CategoryId = 1, Name = "Coffee", IsActive = true };
        var product = new Product { ProductId = 1, CategoryId = 1, Name = "Espresso", Price = 30000, IsActive = true };
        
        var paidOrder = new Order
        {
            OrderId = 10,
            OrderCode = "ORD-20260928-0001",
            TableId = 1,
            StaffId = 1,
            Status = "Paid",
            TotalAmount = 30000
        };

        context.CafeTables.Add(table);
        context.Users.Add(staff);
        context.Categories.Add(category);
        context.Products.Add(product);
        context.Orders.Add(paidOrder);
        await context.SaveChangesAsync();

        var service = new OrderService(context);
        var request = new UpdateOrderItemRequest { ProductId = 1, Quantity = 2 };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.AddOrUpdateItemAsync(paidOrder.OrderId, request));
    }

    [Fact]
    public async Task AddOrUpdateItemAsync_CalculatesTotalAmountCorrectly()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var table = new CafeTable { TableId = 1, TableName = "Bàn 01", Status = "Occupied", IsActive = true };
        var staff = new User { UserId = 1, Username = "staff1", RoleId = 2, FullName = "Nhân viên", IsActive = true };
        var category = new Category { CategoryId = 1, Name = "Coffee", IsActive = true };
        var product1 = new Product { ProductId = 1, CategoryId = 1, Name = "Cà phê Sữa", Price = 30000, IsActive = true };
        var product2 = new Product { ProductId = 2, CategoryId = 1, Name = "Bạc Xỉu", Price = 35000, IsActive = true };

        var order = new Order
        {
            OrderId = 1,
            OrderCode = "ORD-20260928-0001",
            TableId = 1,
            StaffId = 1,
            Status = "Open",
            TotalAmount = 0
        };

        context.CafeTables.Add(table);
        context.Users.Add(staff);
        context.Categories.Add(category);
        context.Products.AddRange(product1, product2);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var service = new OrderService(context);

        // Add 2 Cà phê Sữa (2 * 30,000 = 60,000)
        await service.AddOrUpdateItemAsync(order.OrderId, new UpdateOrderItemRequest { ProductId = 1, Quantity = 2 });

        // Add 1 Bạc Xỉu (1 * 35,000 = 35,000)
        var result = await service.AddOrUpdateItemAsync(order.OrderId, new UpdateOrderItemRequest { ProductId = 2, Quantity = 1 });

        // Assert: 60,000 + 35,000 = 95,000
        Assert.Equal(95000m, result.TotalAmount);
        Assert.Equal(2, result.Items.Count);
    }

    [Fact]
    public async Task CancelOrderAsync_WhenOrderIsOpen_CancelsOrderAndFreesTable()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var table = new CafeTable { TableId = 1, TableName = "Bàn 01", Status = "Occupied", IsActive = true };
        var order = new Order
        {
            OrderId = 1,
            OrderCode = "ORD-20261016-0001",
            TableId = 1,
            StaffId = 1,
            Status = "Open",
            TotalAmount = 50000
        };

        context.CafeTables.Add(table);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var service = new OrderService(context);

        // Act
        var result = await service.CancelOrderAsync(order.OrderId);

        // Assert
        Assert.True(result);
        var updatedOrder = await context.Orders.FindAsync(order.OrderId);
        var updatedTable = await context.CafeTables.FindAsync(table.TableId);

        Assert.Equal("Cancelled", updatedOrder!.Status);
        Assert.Equal("Available", updatedTable!.Status);
    }

    [Fact]
    public async Task CancelOrderAsync_WhenOrderIsAlreadyPaid_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var table = new CafeTable { TableId = 1, TableName = "Bàn 01", Status = "Available", IsActive = true };
        var paidOrder = new Order
        {
            OrderId = 1,
            OrderCode = "ORD-20261016-0001",
            TableId = 1,
            StaffId = 1,
            Status = "Paid",
            TotalAmount = 50000
        };

        context.CafeTables.Add(table);
        context.Orders.Add(paidOrder);
        await context.SaveChangesAsync();

        var service = new OrderService(context);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CancelOrderAsync(paidOrder.OrderId));
    }
}
