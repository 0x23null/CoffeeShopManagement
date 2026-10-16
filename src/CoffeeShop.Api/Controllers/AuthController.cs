using Microsoft.AspNetCore.Mvc;
using CoffeeShop.Application.DTOs.Auth;
using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.Interfaces;

namespace CoffeeShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        return Ok(ApiResponse<LoginResponse>.Ok(response, "Đăng nhập thành công"));
    }
}
