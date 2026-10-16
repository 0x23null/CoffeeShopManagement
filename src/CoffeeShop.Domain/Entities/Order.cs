namespace CoffeeShop.Domain.Entities;

public class Order
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public int TableId { get; set; }
    public int StaffId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? PaidAt { get; set; }
    public string Status { get; set; } = "Open"; // "Open" | "Paid" | "Cancelled"
    public decimal TotalAmount { get; set; } = 0.00m;

    public CafeTable Table { get; set; } = null!;
    public User Staff { get; set; } = null!;
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
