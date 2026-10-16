using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Orders;
using CoffeeShop.Application.Interfaces;

namespace CoffeeShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Staff")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<OrderResponse>>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(staffIdClaim, out var staffId))
        {
            return Unauthorized(ApiResponse<OrderResponse>.Fail("Không xác định được danh tính nhân viên tạo đơn."));
        }

        var result = await _orderService.CreateOrderAsync(request.TableId, staffId);
        return Ok(ApiResponse<OrderResponse>.Ok(result, "Mở đơn hàng thành công"));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<OrderResponse>>> GetOrderById(int id)
    {
        var result = await _orderService.GetOrderByIdAsync(id);
        return Ok(ApiResponse<OrderResponse>.Ok(result));
    }

    [HttpPost("{id}/items")]
    public async Task<ActionResult<ApiResponse<OrderResponse>>> AddOrUpdateItem(int id, [FromBody] UpdateOrderItemRequest request)
    {
        var result = await _orderService.AddOrUpdateItemAsync(id, request);
        return Ok(ApiResponse<OrderResponse>.Ok(result, "Cập nhật món thành công"));
    }

    [HttpDelete("{id}/items/{productId}")]
    public async Task<ActionResult<ApiResponse<OrderResponse>>> RemoveItem(int id, int productId)
    {
        var result = await _orderService.RemoveItemAsync(id, productId);
        return Ok(ApiResponse<OrderResponse>.Ok(result, "Xóa món khỏi đơn hàng thành công"));
    }

    [HttpPost("{id}/payment")]
    public async Task<ActionResult<ApiResponse<bool>>> ProcessPayment(int id, [FromBody] PaymentRequest request)
    {
        var result = await _orderService.ProcessPaymentAsync(id, request);
        return Ok(ApiResponse<bool>.Ok(result, "Thanh toán đơn hàng thành công, bàn đã được giải phóng"));
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<ApiResponse<bool>>> CancelOrder(int id)
    {
        var result = await _orderService.CancelOrderAsync(id);
        return Ok(ApiResponse<bool>.Ok(result, "Hủy đơn hàng thành công, bàn đã được giải phóng"));
    }

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderResponse>>>> SearchOrders([FromQuery] OrderSearchQuery query)
    {
        var result = await _orderService.SearchOrdersAsync(query);
        return Ok(ApiResponse<PagedResult<OrderResponse>>.Ok(result));
    }
}
