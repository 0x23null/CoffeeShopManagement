using Microsoft.EntityFrameworkCore;
using CoffeeShop.Application.Interfaces;
using CoffeeShop.Application.DTOs.Tables;
using CoffeeShop.Domain.Entities;

namespace CoffeeShop.Application.Services;

public class TableService : ITableService
{
    private readonly IApplicationDbContext _context;

    public TableService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TableResponse>> GetAllAsync(bool? activeOnly = null)
    {
        var query = _context.CafeTables.AsNoTracking();
        if (activeOnly.HasValue)
        {
            query = query.Where(t => t.IsActive == activeOnly.Value);
        }

        var tables = await query.ToListAsync();
        
        // Find all Open orders to associate with tables
        var openOrders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.Status == "Open")
            .ToListAsync();

        var openOrderDict = openOrders.ToDictionary(o => o.TableId);

        return tables.Select(t =>
        {
            openOrderDict.TryGetValue(t.TableId, out var openOrder);
            return new TableResponse
            {
                TableId = t.TableId,
                TableName = t.TableName,
                Status = openOrder != null ? "Occupied" : t.Status,
                IsActive = t.IsActive,
                CurrentOrderId = openOrder?.OrderId,
                CurrentOrderCode = openOrder?.OrderCode,
                CurrentOrderTotal = openOrder?.TotalAmount
            };
        }).ToList();
    }

    public async Task<TableResponse> GetByIdAsync(int id)
    {
        var table = await _context.CafeTables.FindAsync(id);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn có mã {id}");

        var openOrder = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TableId == id && o.Status == "Open");

        return new TableResponse
        {
            TableId = table.TableId,
            TableName = table.TableName,
            Status = openOrder != null ? "Occupied" : table.Status,
            IsActive = table.IsActive,
            CurrentOrderId = openOrder?.OrderId,
            CurrentOrderCode = openOrder?.OrderCode,
            CurrentOrderTotal = openOrder?.TotalAmount
        };
    }

    public async Task<TableResponse> CreateAsync(CreateTableRequest request)
    {
        var nameLower = request.TableName.Trim().ToLower();
        var exists = await _context.CafeTables.AnyAsync(t => t.TableName.ToLower() == nameLower);
        if (exists)
            throw new InvalidOperationException($"Bàn có tên '{request.TableName.Trim()}' đã tồn tại trong hệ thống.");

        var table = new CafeTable
        {
            TableName = request.TableName.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Available" : request.Status,
            IsActive = request.IsActive
        };

        _context.CafeTables.Add(table);
        await _context.SaveChangesAsync();

        return new TableResponse
        {
            TableId = table.TableId,
            TableName = table.TableName,
            Status = table.Status,
            IsActive = table.IsActive
        };
    }

    public async Task<TableResponse> UpdateAsync(int id, UpdateTableRequest request)
    {
        var table = await _context.CafeTables.FindAsync(id);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn có mã {id}");

        var nameLower = request.TableName.Trim().ToLower();
        var exists = await _context.CafeTables.AnyAsync(t => t.TableId != id && t.TableName.ToLower() == nameLower);
        if (exists)
            throw new InvalidOperationException($"Tên bàn '{request.TableName.Trim()}' đã bị trùng với bàn khác.");

        table.TableName = request.TableName.Trim();
        table.Status = request.Status;
        table.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return new TableResponse
        {
            TableId = table.TableId,
            TableName = table.TableName,
            Status = table.Status,
            IsActive = table.IsActive
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var table = await _context.CafeTables.FindAsync(id);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn có mã {id}");

        // Rule: TableServiceTests: Kiểm thử vô hiệu hóa bàn đang có trạng thái Occupied (kỳ vọng thất bại)
        var hasOpenOrder = await _context.Orders.AnyAsync(o => o.TableId == id && o.Status == "Open");
        if (table.Status == "Occupied" || hasOpenOrder)
        {
            throw new InvalidOperationException("Không thể xóa hoặc vô hiệu hóa bàn đang có khách ngồi (Occupied).");
        }

        var hasAnyOrder = await _context.Orders.AnyAsync(o => o.TableId == id);
        if (hasAnyOrder)
        {
            table.IsActive = false;
        }
        else
        {
            _context.CafeTables.Remove(table);
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
