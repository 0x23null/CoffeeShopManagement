using System.Data;
using Microsoft.EntityFrameworkCore;
using CoffeeShop.Application.Interfaces;
using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Orders;
using CoffeeShop.Domain.Entities;

namespace CoffeeShop.Application.Services;

public class OrderService : IOrderService
{
    private readonly IApplicationDbContext _context;

    public OrderService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OrderResponse> CreateOrderAsync(int tableId, int staffId)
    {
        var table = await _context.CafeTables.FindAsync(tableId);
        if (table == null || !table.IsActive)
        {
            throw new KeyNotFoundException($"Không tìm thấy bàn có mã {tableId}");
        }

        // Rule: Table must be Available
        if (table.Status != "Available")
        {
            throw new InvalidOperationException($"Bàn '{table.TableName}' đang có khách ({table.Status}), không thể mở đơn mới.");
        }

        // Rule: A table can have at most one Open order
        var existingOpenOrder = await _context.Orders.AnyAsync(o => o.TableId == tableId && o.Status == "Open");
        if (existingOpenOrder)
        {
            throw new InvalidOperationException($"Bàn '{table.TableName}' đang có đơn hàng mở chưa thanh toán.");
        }

        var staff = await _context.Users.FindAsync(staffId);
        if (staff == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy nhân viên có mã {staffId}");
        }

        // Generate OrderCode: ORD-yyyyMMdd-XXXX
        var todayPrefix = $"ORD-{DateTime.Now:yyyyMMdd}-";
        var countToday = await _context.Orders.CountAsync(o => o.OrderCode.StartsWith(todayPrefix));
        var orderCode = $"{todayPrefix}{(countToday + 1):D4}";

        var order = new Order
        {
            OrderCode = orderCode,
            TableId = tableId,
            StaffId = staffId,
            CreatedAt = DateTime.Now,
            Status = "Open",
            TotalAmount = 0.00m
        };

        // Update Table status to Occupied
        table.Status = "Occupied";

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return await GetOrderByIdAsync(order.OrderId);
    }

    public async Task<OrderResponse> GetOrderByIdAsync(int orderId)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Table)
            .Include(o => o.Staff)
            .Include(o => o.OrderDetails)
                .ThenInclude(d => d.Product)
                    .ThenInclude(p => p.Category)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hóa đơn có mã {orderId}");
        }

        return new OrderResponse
        {
            OrderId = order.OrderId,
            OrderCode = order.OrderCode,
            TableId = order.TableId,
            TableName = order.Table?.TableName ?? $"Bàn #{order.TableId}",
            StaffId = order.StaffId,
            StaffName = order.Staff?.FullName ?? "Nhân viên",
            CreatedAt = order.CreatedAt,
            PaidAt = order.PaidAt,
            Status = order.Status,
            TotalAmount = order.TotalAmount,
            Items = order.OrderDetails.Select(d => new OrderDetailItemResponse
            {
                OrderDetailId = d.OrderDetailId,
                ProductId = d.ProductId,
                ProductName = d.Product?.Name ?? $"Món #{d.ProductId}",
                CategoryName = d.Product?.Category?.Name ?? "Khác",
                Quantity = d.Quantity,
                UnitPrice = d.UnitPrice,
                LineTotal = d.LineTotal
            }).ToList()
        };
    }

    public async Task<OrderResponse> AddOrUpdateItemAsync(int orderId, UpdateOrderItemRequest request)
    {
        var order = await _context.Orders
            .Include(o => o.OrderDetails)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy hóa đơn có mã {orderId}");

        // Rule: Only Open orders can be modified
        if (order.Status != "Open")
            throw new InvalidOperationException($"Không thể chỉnh sửa món ăn khi hóa đơn đã {order.Status}.");

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null || !product.IsActive)
            throw new KeyNotFoundException($"Không tìm thấy sản phẩm có mã {request.ProductId}");

        var item = order.OrderDetails.FirstOrDefault(d => d.ProductId == request.ProductId);
        if (item == null)
        {
            if (request.Quantity > 0)
            {
                item = new OrderDetail
                {
                    OrderId = orderId,
                    ProductId = product.ProductId,
                    Quantity = request.Quantity,
                    UnitPrice = product.Price,
                    LineTotal = request.Quantity * product.Price
                };
                order.OrderDetails.Add(item);
            }
        }
        else
        {
            if (request.Quantity <= 0)
            {
                order.OrderDetails.Remove(item);
            }
            else
            {
                item.Quantity = request.Quantity;
                item.UnitPrice = product.Price;
                item.LineTotal = item.Quantity * item.UnitPrice;
            }
        }

        // Recalculate order total amount
        order.TotalAmount = order.OrderDetails.Sum(d => d.LineTotal);

        await _context.SaveChangesAsync();

        return await GetOrderByIdAsync(orderId);
    }

    public async Task<OrderResponse> RemoveItemAsync(int orderId, int productId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderDetails)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy hóa đơn có mã {orderId}");

        if (order.Status != "Open")
            throw new InvalidOperationException($"Không thể xóa món khi đơn hàng đã {order.Status}.");

        var item = order.OrderDetails.FirstOrDefault(d => d.ProductId == productId);
        if (item != null)
        {
            order.OrderDetails.Remove(item);
            order.TotalAmount = order.OrderDetails.Sum(d => d.LineTotal);
            await _context.SaveChangesAsync();
        }

        return await GetOrderByIdAsync(orderId);
    }

    public async Task<bool> ProcessPaymentAsync(int orderId, PaymentRequest request)
    {
        // Rule: Atomic transaction
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var order = await _context.Orders
                .Include(o => o.Table)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
                throw new KeyNotFoundException($"Không tìm thấy hóa đơn có mã {orderId}");

            if (order.Status != "Open")
                throw new InvalidOperationException($"Hóa đơn này đã ở trạng thái {order.Status}, không thể thanh toán tiếp.");

            // Rule: Payment amount must be >= TotalAmount
            if (request.Amount < order.TotalAmount)
            {
                throw new InvalidOperationException($"Số tiền khách trả ({request.Amount:N0} đ) không đủ để thanh toán hóa đơn ({order.TotalAmount:N0} đ).");
            }

            // Create Payment record
            var payment = new Payment
            {
                OrderId = order.OrderId,
                PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "Cash" : request.PaymentMethod,
                Amount = request.Amount,
                PaidAt = DateTime.Now
            };
            _context.Payments.Add(payment);

            // Update Order
            order.Status = "Paid";
            order.PaidAt = DateTime.Now;

            // Update Table back to Available
            if (order.Table != null)
            {
                order.Table.Status = "Available";
            }
            else
            {
                var table = await _context.CafeTables.FindAsync(order.TableId);
                if (table != null) table.Status = "Available";
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> CancelOrderAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng có mã {orderId}");
        }

        if (order.Status != "Open")
        {
            throw new InvalidOperationException($"Chỉ có thể hủy đơn hàng đang mở (Open). Đơn hàng này đang ở trạng thái '{order.Status}'.");
        }

        order.Status = "Cancelled";

        // Giải phóng bàn về Available
        if (order.Table != null)
        {
            order.Table.Status = "Available";
        }
        else
        {
            var table = await _context.CafeTables.FindAsync(order.TableId);
            if (table != null) table.Status = "Available";
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PagedResult<OrderResponse>> SearchOrdersAsync(OrderSearchQuery query)
    {
        var items = new List<OrderResponse>();
        int totalCount = 0;

        var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = "sp_SearchOrderHistory";
            cmd.CommandType = CommandType.StoredProcedure;

            // @OrderCode
            var pCode = cmd.CreateParameter();
            pCode.ParameterName = "@OrderCode";
            pCode.Value = string.IsNullOrWhiteSpace(query.OrderCode) ? DBNull.Value : query.OrderCode.Trim();
            cmd.Parameters.Add(pCode);

            // @StaffId
            var pStaff = cmd.CreateParameter();
            pStaff.ParameterName = "@StaffId";
            pStaff.Value = query.StaffId.HasValue ? query.StaffId.Value : DBNull.Value;
            cmd.Parameters.Add(pStaff);

            // @TableId
            var pTable = cmd.CreateParameter();
            pTable.ParameterName = "@TableId";
            pTable.Value = query.TableId.HasValue ? query.TableId.Value : DBNull.Value;
            cmd.Parameters.Add(pTable);

            // @Status
            var pStatus = cmd.CreateParameter();
            pStatus.ParameterName = "@Status";
            pStatus.Value = string.IsNullOrWhiteSpace(query.Status) ? DBNull.Value : query.Status.Trim();
            cmd.Parameters.Add(pStatus);

            // @FromDate
            var pFrom = cmd.CreateParameter();
            pFrom.ParameterName = "@FromDate";
            pFrom.Value = query.FromDate.HasValue ? query.FromDate.Value : DBNull.Value;
            cmd.Parameters.Add(pFrom);

            // @ToDate
            var pTo = cmd.CreateParameter();
            pTo.ParameterName = "@ToDate";
            pTo.Value = query.ToDate.HasValue ? query.ToDate.Value : DBNull.Value;
            cmd.Parameters.Add(pTo);

            // @PageNumber
            var pPage = cmd.CreateParameter();
            pPage.ParameterName = "@PageNumber";
            pPage.Value = query.PageNumber > 0 ? query.PageNumber : 1;
            cmd.Parameters.Add(pPage);

            // @PageSize
            var pSize = cmd.CreateParameter();
            pSize.ParameterName = "@PageSize";
            pSize.Value = query.PageSize > 0 ? query.PageSize : 10;
            cmd.Parameters.Add(pSize);

            // @TotalCount OUTPUT
            var pTotalCount = cmd.CreateParameter();
            pTotalCount.ParameterName = "@TotalCount";
            pTotalCount.Direction = ParameterDirection.Output;
            pTotalCount.DbType = DbType.Int32;
            cmd.Parameters.Add(pTotalCount);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    items.Add(new OrderResponse
                    {
                        OrderId = reader.GetInt32(reader.GetOrdinal("OrderId")),
                        OrderCode = reader.GetString(reader.GetOrdinal("OrderCode")),
                        TableId = reader.GetInt32(reader.GetOrdinal("TableId")),
                        TableName = reader.GetString(reader.GetOrdinal("TableName")),
                        StaffId = reader.GetInt32(reader.GetOrdinal("StaffId")),
                        StaffName = reader.GetString(reader.GetOrdinal("StaffName")),
                        CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                        PaidAt = reader.IsDBNull(reader.GetOrdinal("PaidAt")) ? null : reader.GetDateTime(reader.GetOrdinal("PaidAt")),
                        Status = reader.GetString(reader.GetOrdinal("Status")),
                        TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount"))
                    });
                }
            }

            if (pTotalCount.Value != DBNull.Value && pTotalCount.Value != null)
            {
                totalCount = Convert.ToInt32(pTotalCount.Value);
            }
        }

        return new PagedResult<OrderResponse>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }
}
