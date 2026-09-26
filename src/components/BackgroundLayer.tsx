import PixelSnow from './fx/PixelSnow'
import { useTheme } from '../context/ThemeContext'

/**
 * Lapisan dekoratif global (React Bits — PixelSnow) yang menutupi
 * layar penuh di semua halaman publik.
 *
 * Dipasang sekali di PublicLayout, paling belakang (-z-20),
 * pointer-events-none supaya tidak halangi scroll/klik/Mode Edit.
 * Selalu aktif dari atas sampai bawah halaman — preset props di bawah
 * sengaja kalem (butir kecil, jarang, pelan, redup) supaya subtil.
 *
 * Warna butir mengikuti tema: putih di mode gelap, slate lembut di mode
 * cerah supaya tetap terlihat (tidak "hilang") tanpa terlalu mencolok.
 */
export default function BackgroundLayer() {
  const { theme } = useTheme()

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20 w-[100vw] h-[100vh] overflow-hidden"
      style={{ position: 'fixed' }}
    >
      <PixelSnow
        color={theme === 'light' ? '#94a3b8' : '#ffffff'}
        flakeSize={0.006}
        minFlakeSize={1.25}
        pixelResolution={220}
        speed={0.5}
        density={0.2}
        direction={115}
        brightness={0.7}
        depthFade={6}
        farPlane={5}
      />
    </div>
  )
}
