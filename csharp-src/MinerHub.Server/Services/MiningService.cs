using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using MinerHub.Database;
using MinerHub.Server.Hubs;
using MinerHub.Shared.Models;

namespace MinerHub.Server.Services
{
    public class MiningService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<MiningService> _logger;
        private readonly IHubContext<MiningHub> _hubContext;

        public MiningService(IServiceProvider services, ILogger<MiningService> logger, IHubContext<MiningHub> hubContext)
        {
            _services = services;
            _logger = logger;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("MinerHub Core Background Worker is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _services.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<MinerHubDbContext>();
                        var computers = context.Computers.ToList();

                        var now = DateTime.UtcNow;
                        foreach (var comp in computers)
                        {
                            // If we haven't seen a ping from the computer in over 45 seconds, flag it as offline
                            if (comp.Status == "online" && (now - comp.LastSeen).TotalSeconds > 45)
                            {
                                comp.Status = "offline";
                                
                                context.Logs.Add(new LogEntry
                                {
                                    Timestamp = DateTime.UtcNow,
                                    ComputerId = comp.Id,
                                    ComputerName = comp.Name,
                                    Type = "error",
                                    Message = $"Conexão perdida com {comp.Name}. O Agent parou de responder."
                                });

                                _logger.LogWarning($"PC {comp.Name} flagged offline due to timeout.");
                                
                                await _hubContext.Clients.All.SendAsync("ComputerOffline", comp.Id);
                            }
                        }

                        await context.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred during agent health monitoring cycle.");
                }

                // Check nodes every 15 seconds
                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
            }

            _logger.LogInformation("MinerHub Core Background Worker is stopping.");
        }
    }
}
