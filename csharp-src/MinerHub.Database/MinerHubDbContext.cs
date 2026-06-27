using Microsoft.EntityFrameworkCore;
using MinerHub.Shared.Models;

namespace MinerHub.Database
{
    public class MinerHubDbContext : DbContext
    {
        public DbSet<Computer> Computers { get; set; } = null!;
        public DbSet<MiningStatus> MiningStatuses { get; set; } = null!;
        public DbSet<LogEntry> Logs { get; set; } = null!;
        public DbSet<Settings> Settings { get; set; } = null!;

        public MinerHubDbContext(DbContextOptions<MinerHubDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure 1-to-1 relationship between Computer and MiningStatus
            modelBuilder.Entity<Computer>()
                .HasOne(c => c.MiningStatus)
                .WithOne(m => m.Computer)
                .HasForeignKey<MiningStatus>(m => m.ComputerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed default values if needed, or handle in Initializer
            modelBuilder.Entity<Settings>().HasData(new Settings
            {
                Id = "global",
                DefaultPool = "pool.monero.hashvault.pro:80",
                DefaultWallet = "44AFFq5kSiGbU2Xm74A4Zt1S... (Monero Wallet)",
                Algo = "rx/0",
                ApiPort = 3333
            });
        }
    }
}
