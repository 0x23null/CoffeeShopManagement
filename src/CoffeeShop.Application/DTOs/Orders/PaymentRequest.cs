using System.ComponentModel.DataAnnotations;

namespace CoffeeShop.Application.DTOs.Orders;

public class PaymentRequest
{
    [Required(ErrorMessage = "Phương thức thanh toán không được để trống")]
    public string PaymentMethod { get; set; } = "Cash"; // Cash, Transfer, Card

    [Required(ErrorMessage = "Số tiền thanh toán không được để trống")]
    [Range(0.0, 100000000, ErrorMessage = "Số tiền phải hợp lệ")]
    public decimal Amount { get; set; }
}
