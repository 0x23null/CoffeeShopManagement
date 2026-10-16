using System.ComponentModel.DataAnnotations;

namespace CoffeeShop.Application.DTOs.Orders;

public class UpdateOrderItemRequest
{
    [Required(ErrorMessage = "Mã món không được để trống")]
    public int ProductId { get; set; }

    [Required(ErrorMessage = "Số lượng không được để trống")]
    [Range(1, 100, ErrorMessage = "Số lượng phải từ 1 đến 100")]
    public int Quantity { get; set; }
}
