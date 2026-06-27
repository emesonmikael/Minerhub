using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using MinerHub.Shared.Models;

namespace MinerHub.Server.Hubs
{
    public class MiningHub : Hub
    {
        // Broadcasts real-time computer state changes to all listening clients (i.e. web dashboards)
        public async Task BroadcastTelemetry(string computerId, MiningStatus status)
        {
            await Clients.All.SendAsync("ReceiveTelemetry", computerId, status);
        }

        // Broadcaster for logging events
        public async Task BroadcastLog(LogEntry log)
        {
            await Clients.All.SendAsync("ReceiveLog", log);
        }

        public override async Task OnConnectedAsync()
        {
            // Logs and manages connection IDs for connected Windows Agents or Browsers
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}
