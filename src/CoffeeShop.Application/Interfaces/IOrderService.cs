using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Orders;

namespace CoffeeShop.Application.Interfaces;

public interface IOrderService
{
    Task<OrderResponse> CreateOrderAsync(int tableId, int staffId);
    Task<OrderResponse> GetOrderByIdAsync(int orderId);
    Task<OrderResponse> AddOrUpdateItemAsync(int orderId, UpdateOrderItemRequest request);
    Task<OrderResponse> RemoveItemAsync(int orderId, int productId);
    Task<bool> ProcessPaymentAsync(int orderId, PaymentRequest request);
    Task<bool> CancelOrderAsync(int orderId);
    Task<PagedResult<OrderResponse>> SearchOrdersAsync(OrderSearchQuery query);
}
