namespace CoffeeShop.Domain.Entities;

public class CafeTable
{
    public int TableId { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string Status { get; set; } = "Available"; // "Available" | "Occupied"
    public bool IsActive { get; set; } = true;

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
