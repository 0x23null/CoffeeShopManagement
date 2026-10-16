using System.ComponentModel.DataAnnotations;

namespace CoffeeShop.Application.DTOs.Tables;

public class UpdateTableRequest
{
    [Required(ErrorMessage = "Tên bàn không được để trống")]
    [MaxLength(50)]
    public string TableName { get; set; } = string.Empty;

    public string Status { get; set; } = "Available";
    public bool IsActive { get; set; } = true;
}
