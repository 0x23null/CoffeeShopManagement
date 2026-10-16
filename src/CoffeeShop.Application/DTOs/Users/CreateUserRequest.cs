using System.ComponentModel.DataAnnotations;

namespace CoffeeShop.Application.DTOs.Users;

public class CreateUserRequest
{
    [Required(ErrorMessage = "Vai trò không được để trống")]
    public int RoleId { get; set; }

    [Required(ErrorMessage = "Tên đăng nhập không được để trống")]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Họ và tên không được để trống")]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
