using Microsoft.EntityFrameworkCore;
using SanalDepo.Api.Entities;

namespace SanalDepo.Api.Data;

public class SanalDepoContext : DbContext
{
    public SanalDepoContext(DbContextOptions<SanalDepoContext> options) : base(options)
    {
    }

    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<Rack> Racks { get; set; }
    public DbSet<RackLevel> RackLevels { get; set; }
    public DbSet<Slot> Slots { get; set; }
    public DbSet<Box> Boxes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Box>()
            .HasIndex(b => b.BoxCode)
            .IsUnique();
    }
}
