using Microsoft.EntityFrameworkCore;
using CoffeeShop.Infrastructure.Data;
using CoffeeShop.Application.DTOs.Tables;
using CoffeeShop.Domain.Entities;
using CoffeeShop.Application.Services;
using Xunit;

namespace CoffeeShop.Tests;

public class TableServiceTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_DuplicateTableName_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        context.CafeTables.Add(new CafeTable { TableId = 1, TableName = "Bàn 01", Status = "Available", IsActive = true });
        await context.SaveChangesAsync();

        var service = new TableService(context);
        var request = new CreateTableRequest { TableName = "Bàn 01" };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(request));
    }

    [Fact]
    public async Task DeleteAsync_OccupiedTable_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var table = new CafeTable { TableId = 2, TableName = "Bàn 02", Status = "Occupied", IsActive = true };
        context.CafeTables.Add(table);
        await context.SaveChangesAsync();

        var service = new TableService(context);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.DeleteAsync(2));
    }
}
