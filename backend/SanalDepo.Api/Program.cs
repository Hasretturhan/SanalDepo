using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using SanalDepo.Api.Data;

var builder = WebApplication.CreateBuilder(args);

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Controller'lar + döngüsel referansları engelle
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        // Warehouse → Rack → Level → Slot → Box gibi
        // çift yönlü ilişkilerde döngü hatası olmasın
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// OpenAPI (Swagger şeması)
builder.Services.AddOpenApi();

// DbContext (EF Core + SQL Server)
builder.Services.AddDbContext<SanalDepoContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

/// ======================
///  VERİ TABANINI SEED ET
/// ======================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    // async metodu senkron bekliyoruz, top-level await kullanmıyoruz
    SeedData.InitializeAsync(services).GetAwaiter().GetResult();
}
/// ======================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);
app.UseAuthorization();

// Root'a basit mesaj (opsiyonel)
app.MapGet("/", () => "SanalDepo API çalışıyor ✅");

// Controller route'larını aktif et
app.MapControllers();

app.Run();
