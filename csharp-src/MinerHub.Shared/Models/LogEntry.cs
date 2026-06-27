using System;
using System.ComponentModel.DataAnnotations;

namespace MinerHub.Shared.Models
{
    public class LogEntry
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        public string? ComputerId { get; set; }

        [MaxLength(100)]
        public string? ComputerName { get; set; }

        [Required]
        [MaxLength(20)]
        public string Type { get; set; } = "info"; // info, success, warning, error

        [Required]
        public string Message { get; set; } = string.Empty;
    }
}
