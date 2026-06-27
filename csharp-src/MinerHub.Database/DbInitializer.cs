using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MinerHub.Shared.Models;

namespace MinerHub.Database
{
    public static class DbInitializer
    {
        public static void Initialize(MinerHubDbContext context)
        {
            // Ensure database is created and migrations applied
            context.Database.EnsureCreated();

            // Seed computers if empty
            if (!context.Computers.Any())
            {
                var pc1 = new Computer
                {
                    Id = "pc-01",
                    Name = "PC-01-IntelCore",
                    IpAddress = "192.168.1.108",
                    Token = "tok_intel_99382",
                    Status = "online",
                    OperatingSystem = "Windows 11 Pro",
                    XmrigVersion = "v6.21.0",
                    CpuLimit = 80.0,
                    LastSeen = DateTime.UtcNow
                };

                var pc2 = new Computer
                {
                    Id = "pc-02",
                    Name = "PC-02-AMD-Ryzen",
                    IpAddress = "192.168.1.109",
                    Token = "tok_ryzen_88123",
                    Status = "online",
                    OperatingSystem = "Windows 10 Enterprise",
                    XmrigVersion = "v6.21.0",
                    CpuLimit = 100.0,
                    LastSeen = DateTime.UtcNow
                };

                var pc3 = new Computer
                {
                    Id = "pc-03",
                    Name = "PC-03-ServerXeon",
                    IpAddress = "192.168.1.110",
                    Token = "tok_xeon_11202",
                    Status = "offline",
                    OperatingSystem = "Windows Server 2022",
                    XmrigVersion = "v6.20.0",
                    CpuLimit = 50.0,
                    LastSeen = DateTime.UtcNow
                };

                context.Computers.AddRange(pc1, pc2, pc3);
                context.SaveChanges();

                // Seed statuses
                context.MiningStatuses.AddRange(
                    new MiningStatus
                    {
                        ComputerId = "pc-01",
                        Hashrate = 2450.0,
                        Worker = "worker_intel",
                        CpuUsage = 75.0,
                        RamUsage = 42.0,
                        Temperature = 68.0,
                        MiningTimeSeconds = 12540,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new MiningStatus
                    {
                        ComputerId = "pc-02",
                        Hashrate = 4120.0,
                        Worker = "worker_ryzen",
                        CpuUsage = 90.0,
                        RamUsage = 56.0,
                        Temperature = 74.0,
                        MiningTimeSeconds = 48312,
                        UpdatedAt = DateTime.UtcNow
                    }
                );

                // Seed initial log
                context.Logs.Add(new LogEntry
                {
                    Id = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.UtcNow,
                    Type = "success",
                    Message = "Banco de dados SQLite inicializado com computadores padrão."
                });

                context.SaveChanges();
            }
        }
    }
}
