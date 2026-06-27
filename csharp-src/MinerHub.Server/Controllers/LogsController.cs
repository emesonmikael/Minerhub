using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MinerHub.Database;
using Microsoft.AspNetCore.Authorization;

namespace MinerHub.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // JWT Secure
    public class LogsController : ControllerBase
    {
        private readonly MinerHubDbContext _context;

        public LogsController(MinerHubDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs()
        {
            var logs = await _context.Logs
                .OrderByDescending(l => l.Timestamp)
                .Take(100)
                .ToListAsync();
            return Ok(logs);
        }
    }
}
