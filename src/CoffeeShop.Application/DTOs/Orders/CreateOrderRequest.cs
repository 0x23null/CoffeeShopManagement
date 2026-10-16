using System.ComponentModel.DataAnnotations;

namespace CoffeeShop.Application.DTOs.Orders;

public class CreateOrderRequest
{
    [Required(ErrorMessage = "Bàn không được để trống")]
    public int TableId { get; set; }
}
