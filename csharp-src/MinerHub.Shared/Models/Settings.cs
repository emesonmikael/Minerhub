using System;
using System.ComponentModel.DataAnnotations;

namespace MinerHub.Shared.Models
{
    public class Settings
    {
        [Key]
        public string Id { get; set; } = "global";

        [Required]
        [MaxLength(200)]
        public string DefaultPool { get; set; } = "pool.monero.hashvault.pro:80";

        [Required]
        [MaxLength(200)]
        public string DefaultWallet { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Algo { get; set; } = "rx/0";

        public int ApiPort { get; set; } = 3333;
    }
}
