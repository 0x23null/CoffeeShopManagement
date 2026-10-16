namespace CoffeeShop.Application.DTOs.Tables;

public class TableResponse
{
    public int TableId { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string Status { get; set; } = "Available"; // "Available" | "Occupied"
    public bool IsActive { get; set; }
    public int? CurrentOrderId { get; set; }
    public string? CurrentOrderCode { get; set; }
    public decimal? CurrentOrderTotal { get; set; }
}
