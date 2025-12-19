// src/Warehouse3D.tsx
import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import QRCode from "react-qr-code";
import { Warehouse, Rack, RackLevel, Slot, Box } from "./types";

const API_BASE = "http://localhost:5204";

type Props = {
  warehouse: Warehouse;
  onSlotSelected: (slot: Slot, box: Box | null) => void;
  selectedSlotId: number | null; // 👈 dışarıdan gelen seçili göz
};

// Kutu (slot/koli) boyutları
const BOX_WIDTH = 1;
const BOX_HEIGHT = 0.5;
const BOX_DEPTH = 0.5;
const SLOT_GAP = 0.2;
const LEVEL_GAP = 0.4;
const RACK_GAP = 2;

type SlotInstance = {
  slot: Slot;
  position: [number, number, number];
  box: Box | null;
};

// Depo yapısına göre HER slot için koordinat üret
function buildSlotInstances(
  warehouse: Warehouse,
  boxes: Box[]
): SlotInstance[] {
  const instances: SlotInstance[] = [];

  warehouse.racks.forEach((rack: Rack, rackIndex: number) => {
    const rackZ = rackIndex * (BOX_DEPTH + RACK_GAP);

    rack.levels
      .slice()
      .sort((a, b) => a.levelNumber - b.levelNumber)
      .forEach((level: RackLevel, levelIndex: number) => {
        const levelY =
          levelIndex * (BOX_HEIGHT + LEVEL_GAP) + BOX_HEIGHT / 2;

        level.slots.forEach((slot: Slot, slotIndex: number) => {
          const x =
            slotIndex * (BOX_WIDTH + SLOT_GAP) + BOX_WIDTH / 2;

          const box = boxes.find((b) => b.slotId === slot.id) ?? null;

          const position: [number, number, number] = [x, levelY, rackZ];

          instances.push({
            slot,
            position,
            box,
          });
        });
      });
  });

  return instances;
}

type SlotMeshesProps = {
  instances: SlotInstance[];
  onSelect: (slot: Slot, box: Box | null) => void;
  selectedSlotId: number | null;
};

const SlotMeshes: React.FC<SlotMeshesProps> = ({
  instances,
  onSelect,
  selectedSlotId,
}) => (
  <>
    {instances.map((inst) => {
      const hasBox = !!inst.box;
      const isSelected =
        selectedSlotId !== null && selectedSlotId === inst.slot.id;

      const qrValue = inst.box
        ? `CODE:${inst.box.boxCode};PRODUCT:${
            inst.box.productName ?? ""
          };QTY:${inst.box.quantity}`
        : "";

      // QR’ı kutunun ön yüzünde sağ alt köşe gibi düşün:
      const qrLocalPos: [number, number, number] = [
        BOX_WIDTH / 2 - 0.55, // biraz içeriden sağ
        -BOX_HEIGHT / 2 + 0.4,
        BOX_DEPTH / 2 + 0.001,
      ];

      return (
        <group key={inst.slot.id} position={inst.position}>
          {/* Kutu (slot) */}
          <mesh onClick={() => onSelect(inst.slot, inst.box)}>
            <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH]} />
            <meshStandardMaterial
              // 👇 Seçili göz yeşil, dolu göz kahverengi, boş göz gri
              color={
                isSelected
                  ? "#22c55e"
                  : hasBox
                  ? "#d2b48c"
                  : "#e5e7eb"
              }
            />
          </mesh>

          {/* Doluysa, bu kutuya sabitlenen QR */}
          {hasBox && inst.box?.boxCode && (
            <Html
              position={qrLocalPos}
              transform
              occlude
              distanceFactor={6}
            >
              <div
                className="slot-qr-label"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(inst.slot, inst.box);
                }}
              >
                <QRCode value={qrValue} size={18} />
              </div>
            </Html>
          )}
        </group>
      );
    })}
  </>
);

const Warehouse3D: React.FC<Props> = ({
  warehouse,
  onSlotSelected,
  selectedSlotId,
}) => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Kolileri /api/boxes'tan çek
  useEffect(() => {
    const loadBoxes = async () => {
      try {
        setError(null);
        const res = await fetch(`${API_BASE}/api/boxes`);
        if (!res.ok) {
          throw new Error(`API hata kodu: ${res.status}`);
        }
        const data: Box[] = await res.json();
        setBoxes(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Koliler yüklenirken hata oluştu.");
      }
    };

    loadBoxes();
  }, []);

  const instances = buildSlotInstances(warehouse, boxes);

  return (
    <div className="three-container">
      <Canvas camera={{ position: [12, 8, 20], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <gridHelper args={[20, 20]} />

        <SlotMeshes
          instances={instances}
          onSelect={onSlotSelected}
          selectedSlotId={selectedSlotId}
        />

        <OrbitControls />
      </Canvas>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Warehouse3D;
