namespace CoffeeShop.Domain.Entities;

public class Payment
{
    public int PaymentId { get; set; }
    public int OrderId { get; set; }
    public string PaymentMethod { get; set; } = "Cash"; // "Cash" | "Transfer" | "Card"
    public decimal Amount { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.Now;

    public Order Order { get; set; } = null!;
}
