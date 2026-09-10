import FaultyTerminal from './FaultyTerminal'

/**
 * Band dekoratif (React Bits — FaultyTerminal) penutup halaman:
 * "digital rain" biru sangat samar di bawah Contact, sebelum Footer.
 * Murni dekorasi: pointer-events-none, non-interaktif.
 */
export default function TerminalBand() {
  return (
    <div
      aria-hidden
      className="fx-band fx-bg pointer-events-none relative isolate h-[22vh] w-full overflow-hidden opacity-80 sm:h-[26vh]"
    >
      <FaultyTerminal
        scale={1.6}
        gridMul={[2, 1]}
        digitSize={1.3}
        timeScale={0.7}
        pause={false}
        scanlineIntensity={0.4}
        glitchAmount={0.5}
        flickerAmount={0.4}
        noiseAmp={0.6}
        chromaticAberration={0}
        dither={0}
        curvature={0.1}
        tint="#3b82f6"
        mouseReact={false}
        mouseStrength={0}
        pageLoadAnimation={false}
        brightness={0.35}
      />
    </div>
  )
}