using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MinerHub.Agent.Services;

namespace MinerHub.Agent
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .UseWindowsService(options =>
                {
                    options.ServiceName = "MinerHubAgent";
                })
                .ConfigureServices((hostContext, services) =>
                {
                    // Register XMRig Process Manager
                    services.AddSingleton<XMRigManager>();

                    // Register background monitoring service
                    services.AddHostedService<MinerService>();
                });
    }
}
