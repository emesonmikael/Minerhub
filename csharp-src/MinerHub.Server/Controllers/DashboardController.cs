using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MinerHub.Database;
using Microsoft.AspNetCore.Authorization;

namespace MinerHub.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Enforces JWT Authentication
    public class DashboardController : ControllerBase
    {
        private readonly MinerHubDbContext _context;

        public DashboardController(MinerHubDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetDashboard()
        {
            var computers = _context.Computers.Include(c => c.MiningStatus).ToList();
            
            var totalHashrate = computers
                .Where(c => c.Status == "online" && c.MiningStatus != null)
                .Sum(c => c.MiningStatus!.Hashrate);

            var onlineCount = computers.Count(c => c.Status == "online");
            var offlineCount = computers.Count(c => c.Status == "offline");

            double averageCpu = 0;
            var onlineWithStatus = computers.Where(c => c.Status == "online" && c.MiningStatus != null).ToList();
            if (onlineWithStatus.Any())
            {
                averageCpu = onlineWithStatus.Average(c => c.MiningStatus!.CpuUsage);
            }

            var settings = _context.Settings.FirstOrDefault() ?? new Shared.Models.Settings();

            return Ok(new
            {
                TotalHashrate = totalHashrate,
                OnlineCount = onlineCount,
                OfflineCount = offlineCount,
                AverageCpu = Math.Round(averageCpu, 1),
                SystemTime = DateTime.UtcNow,
                Settings = settings
            });
        }
    }
}
