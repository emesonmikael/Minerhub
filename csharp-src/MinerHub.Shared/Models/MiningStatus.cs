using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MinerHub.Shared.Models
{
    public class MiningStatus
    {
        [Key]
        [ForeignKey("Computer")]
        public string ComputerId { get; set; } = string.Empty;

        public double Hashrate { get; set; } = 0.0;

        [MaxLength(50)]
        public string Worker { get; set; } = "default";

        public double CpuUsage { get; set; } = 0.0;

        public double RamUsage { get; set; } = 0.0;

        public double Temperature { get; set; } = 0.0;

        public long MiningTimeSeconds { get; set; } = 0;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual Computer? Computer { get; set; }
    }
}
