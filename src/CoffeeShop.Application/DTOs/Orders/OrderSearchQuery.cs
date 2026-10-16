namespace CoffeeShop.Application.DTOs.Orders;

public class OrderSearchQuery
{
    public string? OrderCode { get; set; }
    public int? StaffId { get; set; }
    public int? TableId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
