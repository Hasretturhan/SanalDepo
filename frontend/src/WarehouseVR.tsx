// src/WarehouseVR.tsx
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import QRCode from "react-qr-code";
import * as THREE from "three";
import { Warehouse, Rack, RackLevel, Slot, Box } from "./types";

const API_BASE = "http://localhost:5204";

type Props = {
  warehouse: Warehouse;
  onSlotSelected: (slot: Slot, box: Box | null) => void;
  selectedSlotId: number | null; // 👈 VR’de seçili gözü bilmek için
};

// Kutu boyutları (slot/koli görseli)
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

// Depo yapısına göre HER slot için koordinat üretiyoruz.
// /api/boxes'tan gelen kolileri slotId üzerinden bu slotlara yerleştiriyoruz.
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

          // Bu slota ait koli var mı?
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
  selectedSlotId: number | null; // 👈 seçili slot
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

      return (
        <group key={inst.slot.id} position={inst.position}>
          {/* Slot kutusu */}
          <mesh onClick={() => onSelect(inst.slot, inst.box)}>
            <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH]} />
            <meshStandardMaterial
              color={
                isSelected
                  ? "#22c55e" // 👈 VR’de seçili olan kutu yeşil
                  : hasBox
                  ? "#d2b48c" // dolu kutu
                  : "#e5e7eb" // boş kutu
              }
            />
          </mesh>

          {/* Doluysa ön yüze QR */}
          {hasBox && inst.box?.boxCode && (
            <Html
              position={[
                BOX_WIDTH / 2 - 0.55, // biraz sağdan içeri
                BOX_HEIGHT / 2 + 0.001, // üst kenara yakın
                BOX_DEPTH / 2 + 0.001, // ön yüzün hemen dışında
              ]}
              transform
              occlude
              distanceFactor={6}
            >
              <div
                className="slot-qr-label"
                onClick={(e) => {
                  // QR'a tıklayınca da aynı slot/koli seçilsin
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

/**
 * WASD + Mouse (Orbit) ile gezinen insan kamerası
 *  - Mouse: OrbitControls (kamerayı döndür, tıkla, zoom yap → normal davranır)
 *  - W / A / S / D: kamerayı VE OrbitControls target'ını birlikte hareket ettirir
 *  - colliders: kutu bounding box'ları; içine girmeye çalışınca hareket engellenir
 */
type WalkableOrbitControlsProps = {
  colliders: THREE.Box3[];
};

const WalkableOrbitControls: React.FC<WalkableOrbitControlsProps> = ({
  colliders,
}) => {
  const { camera } = useThree();
  const controls = useRef<any>(null);

  const [moveForward, setMoveForward] = useState(false);
  const [moveBackward, setMoveBackward] = useState(false);
  const [moveLeft, setMoveLeft] = useState(false);
  const [moveRight, setMoveRight] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          setMoveForward(true);
          break;
        case "KeyS":
        case "ArrowDown":
          setMoveBackward(true);
          break;
        case "KeyA":
        case "ArrowLeft":
          setMoveLeft(true);
          break;
        case "KeyD":
        case "ArrowRight":
          setMoveRight(true);
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          setMoveForward(false);
          break;
        case "KeyS":
        case "ArrowDown":
          setMoveBackward(false);
          break;
        case "KeyA":
        case "ArrowLeft":
          setMoveLeft(false);
          break;
        case "KeyD":
        case "ArrowRight":
          setMoveRight(false);
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_state, delta) => {
    if (!controls.current) return;

    const speed = 6; // yürüme hızı
    const forwardSign = (moveForward ? 1 : 0) - (moveBackward ? 1 : 0);
    const sideSign = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);

    // Hareket yoksa sadece OrbitControls'u güncelle
    if (forwardSign === 0 && sideSign === 0) {
      controls.current.update();
      return;
    }

    // Mouse ile baktığın yönü temel alan "ileriye doğru" vektör
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward); // kamera nereye bakıyorsa
    forward.y = 0; // yukarı/aşağı eğimi yok say, göz hizasında yürü
    forward.normalize();

    // Sağa/sola hareket için sağ vektör
    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    move.addScaledVector(forward, forwardSign);
    move.addScaledVector(right, sideSign);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);

      const newPosition = camera.position.clone().add(move);

      // --- ÇARPIŞMA KONTROLÜ (KUTULAR DUVAR GİBİ) ---
      let blocked = false;
      for (const box of colliders) {
        // Kameranın biraz "çapı" varmış gibi düşün → hafif genişlet
        const expanded = box.clone().expandByScalar(0.15);
        if (expanded.containsPoint(newPosition)) {
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        camera.position.copy(newPosition);

        // Hedef noktayı da aynı vektör kadar kaydır → Orbit pivot'u seninle yürür
        controls.current.target.add(move);
      }
    }

    controls.current.update();
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={Math.PI / 4}
    />
  );
};

const WarehouseVR: React.FC<Props> = ({
  warehouse,
  onSlotSelected,
  selectedSlotId,
}) => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Kolileri doğrudan /api/boxes'tan çekiyoruz
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

  // Her slot için çarpışma kutusu (Box3) üret → kameranın içine girmesini engellemek için
  const colliders = useMemo(() => {
    const arr: THREE.Box3[] = [];
    for (const inst of instances) {
      const [x, y, z] = inst.position;
      const center = new THREE.Vector3(x, y, z);
      const size = new THREE.Vector3(
        BOX_WIDTH,
        BOX_HEIGHT,
        BOX_DEPTH
      );
      const box = new THREE.Box3().setFromCenterAndSize(center, size);
      arr.push(box);
    }
    return arr;
  }, [instances]);

  return (
    <div className="three-container">
      {/* İnsan boyuna yakın kamera konumu */}
      <Canvas camera={{ position: [4, 1.6, 15], fov: 75 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Zemin */}
        <gridHelper args={[40, 40]} />

        {/* Kutular */}
        <SlotMeshes
          instances={instances}
          onSelect={onSlotSelected}
          selectedSlotId={selectedSlotId}
        />

        {/* WASD + Mouse, çarpışma destekli kontrol */}
        <WalkableOrbitControls colliders={colliders} />
      </Canvas>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default WarehouseVR;
