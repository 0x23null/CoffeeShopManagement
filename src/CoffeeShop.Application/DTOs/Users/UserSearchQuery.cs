namespace CoffeeShop.Application.DTOs.Users;

public class UserSearchQuery
{
    public string? Keyword { get; set; }
    public int? RoleId { get; set; }
    public bool? IsActive { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
