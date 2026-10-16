using System.ComponentModel.DataAnnotations;

namespace CoffeeShop.Application.DTOs.Products;

public class UpdateProductRequest
{
    [Required(ErrorMessage = "Danh mục không được để trống")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Tên món không được để trống")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Đơn giá không được để trống")]
    [Range(0.01, 10000000, ErrorMessage = "Đơn giá phải lớn hơn 0")]
    public decimal Price { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}
