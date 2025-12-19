// src/App.tsx
import QRCode from "react-qr-code";
import React, { useEffect, useState } from "react";
import "./App.css";
import { Warehouse, Rack, RackLevel, Slot, Box } from "./types";
import Warehouse3D from "./Warehouse3D";
import WarehouseVR from "./WarehouseVR";
import AdminPanel from "./AdminPanel";

const API_BASE = "http://localhost:5204";

type SlotLocation = {
  slot: Slot;
  level: RackLevel;
  rack: Rack;
};

function findSlotLocation(
  warehouse: Warehouse,
  slotId: number
): SlotLocation | null {
  for (const rack of warehouse.racks) {
    for (const level of rack.levels) {
      for (const slot of level.slots) {
        if (slot.id === slotId) {
          return { slot, level, rack };
        }
      }
    }
  }
  return null;
}

function App() {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // tek state: liste / 3D / VR / admin
  const [view, setView] = useState<"list" | "3d" | "vr" | "admin">("3d");

  // 3D / VR seçili göz / koli
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);

  // Liste görünümünde kullanmak için koliler
  const [boxes, setBoxes] = useState<Box[]>([]);

  // Admin login
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Depo
  const loadWarehouse = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/warehouses/1`);
      if (!res.ok) {
        throw new Error(`API hata kodu: ${res.status}`);
      }
      const data: Warehouse = await res.json();
      setWarehouse(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  // Koliler (liste görünümü için)
  const loadBoxes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/boxes`);
      if (!res.ok) {
        throw new Error(`Boxes API hata kodu: ${res.status}`);
      }
      const data: Box[] = await res.json();
      setBoxes(data);
    } catch (err) {
      console.error("Boxes yüklenirken hata:", err);
      // Burada global hata vermiyoruz, sadece liste dolu görünmez
    }
  };

  useEffect(() => {
    loadWarehouse();
    loadBoxes();
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // DEMO: sabit kullanıcı adı/şifre
    if (adminUser === "admin" && adminPass === "123456") {
      setIsAdminAuthenticated(true);
      setLoginError(null);
      setAdminPass("");
    } else {
      setLoginError("Kullanıcı adı veya şifre hatalı.");
    }
  };

  if (loading) {
    return (
      <div className="app app--loading">
        <div className="app-shell">
          <p>Depo verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app app--error">
        <div className="app-shell">
          <p className="error">Hata: {error}</p>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="app">
        <div className="app-shell">
          <p>Depo bulunamadı.</p>
        </div>
      </div>
    );
  }

  const slotLocation =
    selectedSlot !== null
      ? findSlotLocation(warehouse, selectedSlot.id)
      : null;

  // Bir slottaki kolileri getir
  const getSlotBoxes = (slot: Slot): Box[] =>
    boxes.filter((b) => b.slotId === slot.id);

  // ───────────────────────── LISTE GÖRÜNÜMÜ ─────────────────────────
  const renderListView = () => (
    <div className="content-card">
      {warehouse.racks.length === 0 ? (
        <p>Bu depoda henüz raf yok.</p>
      ) : (
        warehouse.racks.map((rack: Rack) => (
          <section key={rack.id} className="rack">
            <h3>
              Raf: <span className="code">{rack.code}</span>
            </h3>
            <div className="levels">
              {rack.levels
                .slice()
                .sort((a, b) => a.levelNumber - b.levelNumber)
                .map((level: RackLevel) => (
                  <div key={level.id} className="level">
                    <div className="level-header">
                      Seviye {level.levelNumber}
                    </div>
                    <div className="slots">
                      {level.slots.map((slot: Slot) => {
                        const slotBoxes = getSlotBoxes(slot);
                        const hasBox = slotBoxes.length > 0;
                        const primaryBox = hasBox ? slotBoxes[0] : null;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            className={
                              hasBox ? "slot slot--filled" : "slot"
                            }
                            onClick={
                              hasBox
                                ? () => {
                                    setSelectedSlot(slot);
                                    setSelectedBox(primaryBox);
                                    setView("3d"); // 3D’ye geç → orada kutu yeşil
                                  }
                                : undefined
                            }
                          >
                            <span className="slot-code">{slot.code}</span>

                            {hasBox && primaryBox && (
                              <div className="slot-box-info">
                                <span className="slot-product">
                                  {primaryBox.productName}
                                </span>
                                <span className="slot-qty">
                                  {primaryBox.quantity} adet
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );

  // ───────────────────────── 3D GÖRÜNÜM ─────────────────────────
  const render3DView = () => (
    <>
      <div className="content-card content-card--canvas">
        <Warehouse3D
          warehouse={warehouse}
          selectedSlotId={selectedSlot?.id ?? null}
          onSlotSelected={(slot, box) => {
            setSelectedSlot(slot);
            setSelectedBox(box ?? null);
          }}
        />
      </div>

      <div className="slot-info-panel content-card">
        {slotLocation ? (
          <>
            <p className="slot-info-title">
              <strong>Seçili Göz:</strong> {slotLocation.slot.code}
            </p>
            <p>
              <strong>Konum:</strong>{" "}
              {warehouse.code ?? warehouse.name} /{" "}
              {slotLocation.rack.code} / Seviye{" "}
              {slotLocation.level.levelNumber}
            </p>

            {selectedBox ? (
              <>
                <p>
                  <strong>Koli Kodu:</strong> {selectedBox.boxCode}
                </p>
                <p>
                  <strong>Ürün Adı:</strong> {selectedBox.productName}
                </p>
                <p>
                  <strong>Miktar:</strong> {selectedBox.quantity} adet
                </p>

                <div className="box-qr-large">
                  {selectedBox.boxCode && (
                    <QRCode
                      value={`CODE:${selectedBox.boxCode};PRODUCT:${
                        selectedBox.productName ?? ""
                      };QTY:${selectedBox.quantity}`}
                      size={120}
                    />
                  )}
                </div>
              </>
            ) : (
              <p>
                Bu gözde henüz <strong>koli tanımlı değil</strong>.
              </p>
            )}

            <p className="info-note">
              3D sahnede herhangi bir göze (kutuya) veya dolu
              gözlerdeki QR’a tıklayarak konum detaylarını
              görüntüleyebilirsin.
            </p>
          </>
        ) : (
          <p>
            3D sahnede herhangi bir göze (kutuya) veya dolu
            gözlerdeki QR’a tıklayarak o konumun detaylarını
            görebilirsin.
          </p>
        )}
      </div>
    </>
  );

  // ───────────────────────── VR GÖRÜNÜM ─────────────────────────
  const renderVRView = () => (
    <>
      <div className="content-card content-card--canvas">
        <WarehouseVR
          warehouse={warehouse}
          selectedSlotId={selectedSlot?.id ?? null} // 👈 VR’ye de seçili slotu ver
          onSlotSelected={(slot: Slot, box: Box | null) => {
            setSelectedSlot(slot);
            setSelectedBox(box ?? null);
          }}
        />
      </div>

      <div className="slot-info-panel content-card">
        {slotLocation ? (
          <>
            <p className="slot-info-title">
              <strong>VR - Seçili Göz:</strong> {slotLocation.slot.code}
            </p>
            <p>
              <strong>Konum:</strong>{" "}
              {warehouse.code ?? warehouse.name} /{" "}
              {slotLocation.rack.code} / Seviye{" "}
              {slotLocation.level.levelNumber}
            </p>

            {selectedBox ? (
              <>
                <p>
                  <strong>Koli Kodu:</strong> {selectedBox.boxCode}
                </p>
                <p>
                  <strong>Ürün Adı:</strong> {selectedBox.productName}</p>
                <p>
                  <strong>Miktar:</strong> {selectedBox.quantity} adet
                </p>

                <div className="box-qr-large">
                  {selectedBox.boxCode && (
                    <QRCode
                      value={`CODE:${selectedBox.boxCode};PRODUCT:${
                        selectedBox.productName ?? ""
                      };QTY:${selectedBox.quantity}`}
                      size={120}
                    />
                  )}
                </div>
              </>
            ) : (
              <p>
                Bu gözde henüz <strong>koli tanımlı değil</strong>.
              </p>
            )}

            <p className="info-note">
              Bu sayfa VR görünüm mantığını göstermek içindir. Gerçek
              VR gözlük entegrasyonu ileride eklenebilir.
            </p>
          </>
        ) : (
          <p>
            VR sahnede herhangi bir göze (kutuya) tıklayarak o
            konumun detaylarını görebilirsin.
          </p>
        )}
      </div>
    </>
  );

  // ───────────────────────── ADMIN LOGIN / PANEL ─────────────────────────
  const renderAdminLogin = () => (
    <div className="admin-login content-card">
      <h3 className="admin-login-title">Admin Girişi</h3>
      <form onSubmit={handleAdminLogin} className="admin-login-form">
        <label>
          Kullanıcı Adı
          <input
            value={adminUser}
            onChange={(e) => setAdminUser(e.target.value)}
            required
          />
        </label>
        <label>
          Şifre
          <input
            type="password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            required
          />
        </label>
        <button type="submit">Giriş Yap</button>
        {loginError && <p className="error">{loginError}</p>}
      </form>
    </div>
  );

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <div className="app">
      <div className="app-shell">
        {/* HEADER */}
        <header className="app-header">
          <div>
            <h1>Sanal Depo</h1>
            <h2>
              Depo: {warehouse.name}{" "}
              <span className="code">
                ({warehouse.code ?? "Kodsuz"})
              </span>
            </h2>
            {warehouse.address && (
              <p className="address">{warehouse.address}</p>
            )}
          </div>
        </header>

        {/* VIEW TOGGLE */}
        <nav className="view-toggle">
          <button
            className={view === "list" ? "view-btn active" : "view-btn"}
            onClick={() => setView("list")}
          >
            Liste Görünümü
          </button>
          <button
            className={view === "3d" ? "view-btn active" : "view-btn"}
            onClick={() => setView("3d")}
          >
            3D Görünüm
          </button>
          <button
            className={view === "vr" ? "view-btn active" : "view-btn"}
            onClick={() => setView("vr")}
          >
            VR Görünüm
          </button>
          <button
            className={view === "admin" ? "view-btn active" : "view-btn"}
            onClick={() => setView("admin")}
          >
            Admin Paneli
          </button>
        </nav>

        {/* ANA İÇERİK */}
        <main className="app-main">
          {view === "list"
            ? renderListView()
            : view === "3d"
            ? render3DView()
            : view === "vr"
            ? renderVRView()
            : !isAdminAuthenticated
            ? renderAdminLogin()
            : (
              <div className="content-card">
                <AdminPanel
                  warehouse={warehouse}
                  reloadWarehouse={loadWarehouse}
                />
              </div>
            )}
        </main>
      </div>
    </div>
  );
}

export default App;
