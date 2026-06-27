using System;
using System.ComponentModel.DataAnnotations;

namespace MinerHub.Shared.Models
{
    public class Computer
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(45)]
        public string IpAddress { get; set; } = "127.0.0.1";

        [Required]
        [MaxLength(100)]
        public string Token { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "offline"; // online, offline

        public double CpuLimit { get; set; } = 100.0;

        [MaxLength(50)]
        public string OperatingSystem { get; set; } = "Windows";

        [MaxLength(20)]
        public string XmrigVersion { get; set; } = "v6.21.0";

        public DateTime LastSeen { get; set; } = DateTime.UtcNow;

        // Navigation Property
        public virtual MiningStatus? MiningStatus { get; set; }
    }
}
