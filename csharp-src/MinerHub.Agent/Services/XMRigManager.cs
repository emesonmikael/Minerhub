using System;
using System.Diagnostics;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace MinerHub.Agent.Services
{
    public class XMRigManager
    {
        private readonly ILogger<XMRigManager> _logger;
        private Process? _xmrigProcess;
        private CancellationTokenSource? _logReaderCts;
        private double _cpuLimit = 100.0;
        private bool _isMining = false;

        public event Action<double>? OnHashrateUpdated;
        public event Action<string>? OnLogReceived;

        public XMRigManager(ILogger<XMRigManager> logger)
        {
            _logger = logger;
        }

        public bool IsMining => _isMining;
        public double CpuLimit => _cpuLimit;

        public async Task<bool> StartAsync(string poolUrl, string walletAddress, string algo, string workerName, double cpuLimit)
        {
            if (_isMining) return true;

            _cpuLimit = cpuLimit;
            string xmrigPath = Path.Combine(AppContext.BaseDirectory, "xmrig", "xmrig.exe");

            // Mock check: in a real environment we make sure XMRig is installed
            if (!File.Exists(xmrigPath))
            {
                _logger.LogWarning($"XMRig executable not found at: {xmrigPath}. Running in simulated XMRig mode.");
                return StartSimulatedMining();
            }

            try
            {
                // Calculate thread counts based on CPU limit (e.g., limit CPU affinity or thread count)
                int maxThreads = CalculateThreads(cpuLimit);
                string arguments = $"-o {poolUrl} -u {walletAddress} -p {workerName} -a {algo} --threads={maxThreads}";

                _xmrigProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = xmrigPath,
                        Arguments = arguments,
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        CreateNoWindow = true
                    }
                };

                _xmrigProcess.Start();
                _isMining = true;
                _logReaderCts = new CancellationTokenSource();

                // Start reading console output to parse Hashrate
                _ = Task.Run(() => ReadStandardOutputAsync(_xmrigProcess.StandardOutput, _logReaderCts.Token));

                _logger.LogInformation($"XMRig process started successfully with {maxThreads} threads.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start local XMRig process.");
                _isMining = false;
                return false;
            }
        }

        public Task StopAsync()
        {
            if (!_isMining) return Task.CompletedTask;

            _logger.LogInformation("Stopping XMRig mining...");
            _logReaderCts?.Cancel();

            if (_xmrigProcess != null && !_xmrigProcess.HasExited)
            {
                try
                {
                    _xmrigProcess.Kill();
                    _xmrigProcess.Dispose();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error killing XMRig process.");
                }
            }

            _xmrigProcess = null;
            _isMining = false;
            OnHashrateUpdated?.Invoke(0.0);

            return Task.CompletedTask;
        }

        public async Task ChangeCpuLimitAsync(double limit, string pool, string wallet, string algo, string worker)
        {
            _cpuLimit = limit;
            _logger.LogInformation($"Applying new CPU limit: {limit}%.");
            
            if (_isMining)
            {
                // To safely update threads or affinity, we restart the mining process with new thread arguments
                await StopAsync();
                await StartAsync(pool, wallet, algo, worker, limit);
            }
        }

        private int CalculateThreads(double cpuLimit)
        {
            int logicalCores = Environment.ProcessorCount;
            int threadCount = (int)Math.Ceiling(logicalCores * (cpuLimit / 100.0));
            return Math.Max(1, threadCount);
        }

        private async Task ReadStandardOutputAsync(StreamReader reader, CancellationToken token)
        {
            // Regex to match XMRig speed output, e.g.: speed 10s/60s/15m 2450.5 2440.2 2430.1 H/s max 2510.0 H/s
            var speedRegex = new Regex(@"speed 10s\/60s\/15m\s+(\d+\.?\d*)\s+");

            while (!token.IsCancellationRequested && !reader.EndOfStream)
            {
                string? line = await reader.ReadLineAsync(token);
                if (line != null)
                {
                    OnLogReceived?.Invoke(line);

                    var match = speedRegex.Match(line);
                    if (match.Success && double.TryParse(match.Groups[1].Value, out double hashrate))
                    {
                        OnHashrateUpdated?.Invoke(hashrate);
                    }
                }
            }
        }

        // SIMULATED MINING ENGINE (for demonstration if no actual xmrig.exe is present on the PC)
        private bool _simulatedRunning = false;
        private double _simulatedHashrate = 0.0;

        private bool StartSimulatedMining()
        {
            _isMining = true;
            _simulatedRunning = true;
            _logger.LogInformation("XMRig Simulator started.");

            _ = Task.Run(async () =>
            {
                var random = new Random();
                double baseHashrate = 2500.0 * (_cpuLimit / 100.0);

                while (_simulatedRunning)
                {
                    double variance = (random.NextDouble() - 0.5) * 100.0;
                    _simulatedHashrate = baseHashrate + variance;

                    OnHashrateUpdated?.Invoke(_simulatedHashrate);
                    OnLogReceived?.Invoke($"[XMRig Simulator] speed 10s/60s/15m {_simulatedHashrate:F1} {_simulatedHashrate * 0.98:F1} H/s max {baseHashrate * 1.05:F1} H/s");

                    await Task.Delay(5000);
                }
            });

            return true;
        }
    }
}
