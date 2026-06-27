using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using MinerHub.Database;
using MinerHub.Server.Hubs;
using MinerHub.Shared.Models;

namespace MinerHub.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires JWT Authentication
    public class ComputersController : ControllerBase
    {
        private readonly MinerHubDbContext _context;
        private readonly IHubContext<MiningHub> _hubContext;

        public ComputersController(MinerHubDbContext context, IHubContext<MiningHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetComputers()
        {
            var computers = await _context.Computers.Include(c => c.MiningStatus).ToListAsync();
            return Ok(computers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetComputer(string id)
        {
            var computer = await _context.Computers.Include(c => c.MiningStatus).FirstOrDefaultAsync(c => c.Id == id);
            if (computer == null) return NotFound(new { Error = "Computador não encontrado" });
            return Ok(computer);
        }

        [HttpPost]
        public async Task<IActionResult> CreateComputer([FromBody] Computer model)
        {
            if (string.IsNullOrEmpty(model.Name) || string.IsNullOrEmpty(model.IpAddress) || string.IsNullOrEmpty(model.Token))
            {
                return BadRequest(new { Error = "Nome, IP e Token são obrigatórios" });
            }

            model.Id = Guid.NewGuid().ToString();
            model.Status = "offline";
            model.LastSeen = DateTime.UtcNow;

            _context.Computers.Add(model);

            // Add log
            _context.Logs.Add(new LogEntry
            {
                Timestamp = DateTime.UtcNow,
                Type = "info",
                Message = $"Novo computador cadastrado no sistema: {model.Name} ({model.IpAddress})"
            });

            await _context.SaveChangesAsync();

            // Broadcast real-time update
            await _hubContext.Clients.All.SendAsync("ComputerCreated", model);

            return CreatedAtAction(nameof(GetComputer), new { id = model.Id }, model);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateComputer(string id, [FromBody] Computer model)
        {
            var computer = await _context.Computers.FindAsync(id);
            if (computer == null) return NotFound(new { Error = "Computador não encontrado" });

            computer.Name = model.Name;
            computer.IpAddress = model.IpAddress;
            computer.Token = model.Token;
            computer.CpuLimit = model.CpuLimit;

            _context.Logs.Add(new LogEntry
            {
                Timestamp = DateTime.UtcNow,
                ComputerId = id,
                ComputerName = computer.Name,
                Type = "info",
                Message = $"Configurações atualizadas: Nome: {model.Name}, IP: {model.IpAddress}"
            });

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ComputerUpdated", computer);

            return Ok(computer);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComputer(string id)
        {
            var computer = await _context.Computers.FindAsync(id);
            if (computer == null) return NotFound(new { Error = "Computador não encontrado" });

            _context.Computers.Remove(computer);

            _context.Logs.Add(new LogEntry
            {
                Timestamp = DateTime.UtcNow,
                Type = "warning",
                Message = $"Computador excluído: {computer.Name} ({computer.IpAddress})"
            });

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ComputerDeleted", id);

            return Ok(new { Message = "Computador excluído com sucesso" });
        }

        // CONTROL ENDPOINTS - Commits command and notifies SignalR so Agents execute the requests
        [HttpPost("{id}/start")]
        public async Task<IActionResult> StartMiner(string id)
        {
            var computer = await _context.Computers.Include(c => c.MiningStatus).FirstOrDefaultAsync(c => c.Id == id);
            if (computer == null) return NotFound(new { Error = "Computador não encontrado" });

            // In production, Server sends HTTP POST /agent/start to the Agent IP address using the Agent Token
            // Or sends a command via SignalR directly to the connected Agent connection ID
            
            _context.Logs.Add(new LogEntry
            {
                Timestamp = DateTime.UtcNow,
                ComputerId = id,
                ComputerName = computer.Name,
                Type = "success",
                Message = $"Comando INICIAR enviado para o Agent em {computer.IpAddress}."
            });

            await _context.SaveChangesAsync();

            // Notify SignalR hub
            await _hubContext.Clients.All.SendAsync("CommandSent", new { ComputerId = id, Command = "start" });

            return Ok(new { Message = "Comando de iniciar enviado com sucesso" });
        }

        [HttpPost("{id}/stop")]
        public async Task<IActionResult> StopMiner(string id)
        {
            var computer = await _context.Computers.Include(c => c.MiningStatus).FirstOrDefaultAsync(c => c.Id == id);
            if (computer == null) return NotFound(new { Error = "Computador não encontrado" });

            _context.Logs.Add(new LogEntry
            {
                Timestamp = DateTime.UtcNow,
                ComputerId = id,
                ComputerName = computer.Name,
                Type = "warning",
                Message = $"Comando PARAR enviado para o Agent em {computer.IpAddress}."
            });

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("CommandSent", new { ComputerId = id, Command = "stop" });

            return Ok(new { Message = "Comando de parar enviado com sucesso" });
        }

        [HttpPost("{id}/restart")]
        public async Task<IActionResult> RestartMiner(string id)
        {
            var computer = await _context.Computers.Include(c => c.MiningStatus).FirstOrDefaultAsync(c => c.Id == id);
            if (computer == null) return NotFound(new { Error = "Computador não encontrado" });

            _context.Logs.Add(new LogEntry
            {
                Timestamp = DateTime.UtcNow,
                ComputerId = id,
                ComputerName = computer.Name,
                Type = "info",
                Message = $"Comando REINICIAR enviado para o Agent em {computer.IpAddress}."
            });

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("CommandSent", new { ComputerId = id, Command = "restart" });

            return Ok(new { Message = "Comando de reinicialização enviado com sucesso" });
        }

        [HttpPost("{id}/cpu")]
        public async Task<IActionResult> SetCpuLimit(string id, [FromBody] CpuLimitRequest request)
        {
            var computer = await _context.Computers.Include(c => c.MiningStatus).FirstOrDefaultAsync(c => c.Id == id);
            if (computer == null) return NotFound(new { Error = "Computador não encontrado" });

            if (request.Limit < 10 || request.Limit > 100)
            {
                return BadRequest(new { Error = "O limite de CPU deve estar entre 10 e 100" });
            }

            computer.CpuLimit = request.Limit;

            _context.Logs.Add(new LogEntry
            {
                Timestamp = DateTime.UtcNow,
                ComputerId = id,
                ComputerName = computer.Name,
                Type = "info",
                Message = $"Comando ALTERAR CPU para {request.Limit}% enviado para o Agent."
            });

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("CommandSent", new { ComputerId = id, Command = "cpu", Value = request.Limit });

            return Ok(new { Message = $"Comando de alteração de CPU enviado para {request.Limit}%" });
        }
    }

    public class CpuLimitRequest
    {
        public double Limit { get; set; }
    }
}
