import GradientWaves from './GradientWaves'

/**
 * Band dekoratif (React Bits — GradientWaves) yang dipasang di antara
 * section: gelombang 3D di-recolor ke palet tema (biru accent),
 * transparan & non-interaktif. Murni dekorasi: pointer-events-none
 * supaya tidak menghalangi scroll/klik/Mode Edit.
 */
export default function WavesBand() {
  return (
    <div
      aria-hidden
      className="fx-band fx-bg pointer-events-none relative isolate h-[30vh] w-full overflow-hidden sm:h-[38vh]"
    >
      <GradientWaves
        horizonColor="#0b1a35"
        waveColor="#2563eb"
        crestColor="#93c5fd"
        speed={0.28}
        amplitude={2.2}
        waveScale={0.7}
        waveRatio={0.9}
        swell={30}
        turbulence={18}
        tilt={1.08}
        zoom={1}
        height={4.8}
        fogDepth={13}
        detail="medium"
        brightness={0.55}
        opacity={0.5}
        mouseInteraction={false}
        parallaxStrength={0}
        grain={false}
        grainIntensity={0}
      />
    </div>
  )
}