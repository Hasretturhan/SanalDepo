using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SanalDepo.Api.Data;
using SanalDepo.Api.Entities;

namespace SanalDepo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly SanalDepoContext _context;

    public WarehousesController(SanalDepoContext context)
    {
        _context = context;
    }

    // GET: api/warehouses
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Warehouse>>> GetWarehouses()
    {
        var warehouses = await _context.Warehouses.ToListAsync();
        return Ok(warehouses);
    }

    // GET: api/warehouses/5
    // Bu endpoint; depo + raf + level + slotları birlikte getirir
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Warehouse>> GetWarehouse(int id)
    {
        var warehouse = await _context.Warehouses
            .Include(w => w.Racks)
                .ThenInclude(r => r.Levels)
                    .ThenInclude(l => l.Slots)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (warehouse == null)
        {
            return NotFound();
        }

        return Ok(warehouse);
    }

    // POST: api/warehouses
    // Yeni depo oluşturmak için
    [HttpPost]
    public async Task<ActionResult<Warehouse>> CreateWarehouse(Warehouse warehouse)
    {
        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();

        // 201 Created + eklenen kaydı döndür
        return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, warehouse);
    }
}
