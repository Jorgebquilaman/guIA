using GuIA.Application.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GuIA.API.Controllers;

[Route("api/site-config")]
public sealed class SiteConfigController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetPublicSiteConfig(CancellationToken ct)
    {
        var context = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var config = await context.SiteConfigs.FirstOrDefaultAsync(ct);

        if (config == null)
        {
            return Ok(new { showMessage = true, messageText = "Bienvenido al Repositorio Institucional del IUPA. Este espacio reúne, preserva y difunde la producción académica, artística y cultural de nuestra comunidad." });
        }

        return Ok(new
        {
            showMessage = config.ShowMessage,
            messageText = config.MessageText,
            baseUrl = config.BaseUrl
        });
    }
}
