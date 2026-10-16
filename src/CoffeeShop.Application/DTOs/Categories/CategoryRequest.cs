using System.ComponentModel.DataAnnotations;

namespace CoffeeShop.Application.DTOs.Categories;

public class CategoryRequest
{
    [Required(ErrorMessage = "Tên danh mục không được để trống")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
