using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MinerHub.Database;
using MinerHub.Server.Hubs;
using MinerHub.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add SQLite Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=minerhub.db";
builder.Services.AddDbContext<MinerHubDbContext>(options =>
    options.UseSqlite(connectionString, b => b.MigrationsAssembly("MinerHub.Server")));

// 2. Add JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "MinerHubSuperSecretLongKey2026!KeySecure";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "MinerHubServer",
        ValidAudience = "MinerHubClients",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

// 3. Add Controllers and SignalR
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

// 4. Configure Swagger with JWT Authorize button
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "MinerHub Server API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Insira seu token JWT desta forma: Bearer {seu_token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 5. Add Background Services (DI)
builder.Services.AddHostedService<MiningService>();

// 6. Setup CORS (for the frontend React web console)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", p =>
    {
        p.AllowAnyHeader()
         .AllowAnyMethod()
         .SetIsOriginAllowed(_ => true)
         .AllowCredentials();
    });
});

var app = builder.Build();

// Migrate and Seed Database on Startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<MinerHubDbContext>();
    try
    {
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred seeding the SQLite DB: {ex.Message}");
    }
}

// 7. Middlewares Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "MinerHub v1"));
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// Login Minimal API Route for easy testing!
app.MapPost("/api/auth/login", (LoginModel model) =>
{
    // Default system credentials as specified
    if (model.Username == "admin" && model.Password == "admin123")
    {
        // Simple JWT Generation for testing
        var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtSecret);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new System.Security.Claims.ClaimsIdentity(new[] 
            { 
                new System.Security.Claims.Claim("username", "admin"),
                new System.Security.Claims.Claim("role", "Administrator")
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = "MinerHubServer",
            Audience = "MinerHubClients",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return Results.Ok(new { Token = tokenHandler.WriteToken(token), Username = "admin" });
    }
    return Results.Unauthorized();
}).AllowAnonymous();

// Map routing endpoints
app.MapControllers();
app.MapHub<MiningHub>("/hubs/mining");

app.Run();

public class LoginModel
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
