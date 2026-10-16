namespace CoffeeShop.Application.DTOs.Products;

public class ProductSearchQuery
{
    public string? Keyword { get; set; }
    public int? CategoryId { get; set; }
    public bool? Status { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
