using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SanalDepo.Api.Entities;

namespace SanalDepo.Api.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<SanalDepoContext>();

            // migration'ları uygula
            await context.Database.MigrateAsync();

            // Daha önce data yüklenmişse tekrar ekleme
            if (await context.Warehouses.AnyAsync())
                return;

            var warehouse = new Warehouse
            {
                Name = "Merkez Depo",
                Code = "DEP-A",
                Address = "Merkez depo adresi",
                Racks = new List<Rack>()
            };

            int rackCount = 5;      // 4 RAF
            int levelCount = 4;      // 4 SEVİYE
            int slotsPerLevel = 5;   // Her seviyede 5 GÖZ

            for (int r = 1; r <= rackCount; r++)
            {
                var rack = new Rack
                {
                    Code = $"R{r}",
                    Levels = new List<RackLevel>()
                };

                for (int l = 1; l <= levelCount; l++)
                {
                    var level = new RackLevel
                    {
                        LevelNumber = l,
                        Slots = new List<Slot>()
                    };

                    for (int s = 1; s <= slotsPerLevel; s++)
                    {
                        var slotCode = $"DEP-A-R{r:D2}-L{l:D2}-S{s:D2}";

                        level.Slots.Add(new Slot
                        {
                            Code = slotCode,
                            Boxes = new List<Box>()
                        });
                    }

                    rack.Levels.Add(level);
                }

                warehouse.Racks.Add(rack);
            }

            await context.Warehouses.AddAsync(warehouse);
            await context.SaveChangesAsync();
        }
    }
}
