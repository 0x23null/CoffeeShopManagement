using System.ComponentModel.DataAnnotations;

namespace CoffeeShop.Application.DTOs.Users;

public class UpdateUserRequest
{
    [Required(ErrorMessage = "Vai trò không được để trống")]
    public int RoleId { get; set; }

    [Required(ErrorMessage = "Họ và tên không được để trống")]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    public string? NewPassword { get; set; }

    public bool IsActive { get; set; } = true;
}
