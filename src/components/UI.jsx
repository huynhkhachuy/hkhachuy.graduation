// src/components/UI.jsx
import { atom, useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// ===== Ảnh trang =====
const pictures = [
  "DSC00680", "2", "3", "4", "5", "6", "7", "8", "9", "10", "17", "18", "11", "12", "13", "14", "15", "16",
];

// ===== Atoms =====
export const pageAtom = atom(0);
export const bgmVolumeAtom = atom(0.5);
export const bgmPlayingAtom = atom(false);

// ===== Pages =====
export const pages = [{ front: "book-cover", back: pictures[0] }];
for (let i = 1; i < pictures.length - 1; i += 2) {
  pages.push({
    front: pictures[i % pictures.length],
    back: pictures[(i + 1) % pictures.length],
  });
}
pages.push({ front: pictures[pictures.length - 1], back: "book-back" });

const RevealText = ({ text, className = "", delay = 0.03 }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const chars = Array.from(ref.current.querySelectorAll("[data-char]"));
    gsap.fromTo(
      chars,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power3.out",
        stagger: delay,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 95%",
          once: true,
        },
      }
    );
  }, []);

  return (
    <p ref={ref} className={className}>
      {text.split("").map((c, i) => (
        <span
          key={i}
          data-char
          className="inline-block will-change-transform"
        >
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </p>
  );
};

// ===== UI =====
export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);

  // BGM state
  const [bgmVolume, setBgmVolume] = useAtom(bgmVolumeAtom);
  const [isPlaying, setIsPlaying] = useAtom(bgmPlayingAtom);
  const [isMutedAutoplay, setIsMutedAutoplay] = useState(false); // đang autoplay dạng mute?
  const audioRef = useRef(null);

  // Âm lật trang
  useEffect(() => {
    const sfx = new Audio("/audios/page-flip-01a.mp3");
    sfx.play().catch(() => { });
  }, [page]);

  // Init & Autoplay logic
  useEffect(() => {
    const el = new Audio("/audios/hand.mp3");
    el.loop = true;
    el.volume = bgmVolume;
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    audioRef.current = el;

    const tryUnmutePlay = async () => {
      if (!audioRef.current) return;
      // thử phát có tiếng
      try {
        audioRef.current.muted = false;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsMutedAutoplay(false);
      } catch {
        // nếu bị chặn → phát mute
        try {
          audioRef.current.muted = true;
          await audioRef.current.play();
          setIsPlaying(true);
          setIsMutedAutoplay(true);
        } catch {
          // nếu vẫn bị chặn (hiếm), chờ người dùng tương tác
          setIsPlaying(false);
          setIsMutedAutoplay(false);
        }
      }
    };

    // chạy ngay khi mở trang
    tryUnmutePlay();

    // Khi có tương tác đầu tiên → bỏ mute nếu đang mute
    const unlock = async () => {
      if (!audioRef.current) return;
      if (isMutedAutoplay || audioRef.current.muted) {
        try {
          audioRef.current.muted = false;
          // iOS cần call play() lại sau khi unmute
          if (audioRef.current.paused) await audioRef.current.play();
          setIsMutedAutoplay(false);
          setIsPlaying(true);
        } catch {
          // nếu vẫn fail thì giữ nút Play để user bấm
        }
      }
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      el.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng bộ âm lượng
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = bgmVolume;
    }
  }, [bgmVolume]);

  // Play / Pause
  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (isPlaying) {
        el.pause();
        setIsPlaying(false);
      } else {
        // nếu đang mute-autoplay thì bỏ mute
        if (isMutedAutoplay || el.muted) el.muted = false;
        await el.play();
        setIsPlaying(true);
        setIsMutedAutoplay(false);
      }
    } catch {
      // nếu vẫn bị chặn thì sẽ cần click thêm (trên iOS) – giao diện vẫn hiện nút Play
    }
  };

  return (
    <>
        <main className="pointer-events-none select-none z-10 fixed inset-0 min-h-[100svh] flex justify-between flex-col">
        <a
          className="pointer-events-auto mt-10 ml-10"
          href="https://lessons.wawasensei.dev/courses/react-three-fiber"
        >
          <img className="w-20" src="/images/wawasensei-white.png" alt="Logo" />
        </a>

        {/* ===== Nút chuyển trang (4 nút gộp) ===== */}
        <div className="w-full pointer-events-auto flex justify-center pb-[calc(env(safe-area-inset-bottom)+100px)] sm:pb-5">
          <div
            className="flex items-center gap-2 px-4 py-2
               text-white rounded-full 
               border border-white/25 
               backdrop-blur-xl 
               bg-white/10 
               shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]
               hover:bg-white/15 transition-all duration-200"
          >
            {/* Cover */}
            <button
              className={`px-3 py-1 rounded-full text-[11px] sm:text-xs uppercase tracking-wide transition-all duration-200
        ${page === 0
                  ? "bg-white/90 text-black border border-white"
                  : "bg-white/10 border border-white/20 hover:bg-white/20"
                }`}
              onClick={() => setPage(0)}
            >
              COVER
            </button>

            {/* ← Prev */}
            <button
              className="rounded-full p-1.5 bg-white/10 border border-white/20 hover:bg-white/20 transition"
              onClick={() => setPage(Math.max(0, page - 1))}
              aria-label="Previous page"
            >
              <FiArrowLeft size={13} />
            </button>

            {/* → Next */}
            <button
              className="rounded-full p-1.5 bg-white/10 border border-white/20 hover:bg-white/20 transition"
              onClick={() => setPage(Math.min(pages.length - 1, page + 1))}
              aria-label="Next page"
            >
              <FiArrowRight size={13} />
            </button>

            {/* Back */}
            <button
              className={`px-3 py-1 rounded-full text-[11px] sm:text-xs uppercase tracking-wide transition-all duration-200
        ${page === pages.length
                  ? "bg-white/90 text-black border border-white"
                  : "bg-white/10 border border-white/20 hover:bg-white/20"
                }`}
              onClick={() => setPage(pages.length)}
            >
              BACK
            </button>
          </div>
        </div>
      </main>

      {/* ===== BGM Controls ===== */}
      <div className="pointer-events-auto fixed left-4 bottom-[calc(env(safe-area-inset-bottom)+24px)] sm:left-5 sm:bottom-5 z-50">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-3 py-1.5 text-white shadow-lg hover:bg-white/20 transition-all duration-200">
          <button
            onClick={togglePlay}
            className="rounded-full p-1.5 hover:bg-white/20 transition"
            aria-label={isPlaying ? "Pause" : "Play"}
            title={
              isMutedAutoplay
                ? "Nhấn để bật tiếng"
                : isPlaying
                  ? "Tạm dừng"
                  : "Phát"
            }
          >
            {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} />}
          </button>

          <div className="flex items-center gap-1">
            {bgmVolume > 0 && !(audioRef.current?.muted) ? (
              <FiVolume2 size={13} />
            ) : (
              <FiVolumeX size={13} />
            )}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={bgmVolume}
              onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
              className="w-20 sm:w-32 h-0.5 accent-white cursor-pointer"
              aria-label="Background music volume"
            />
          </div>

          <span className="hidden sm:inline text-[10px] opacity-70 font-mono w-8 text-right">
            {Math.round(bgmVolume * 100)}%
          </span>
        </div>

        {isPlaying && isMutedAutoplay && (
          <div className="mt-2 text-[11px] text-white/90 bg-black/40 border border-white/15 px-2 py-1 rounded-md">
            Đang phát im lặng — nhấn Play để bật tiếng
          </div>
        )}
      </div>

      {/* ===== Time & Location ===== */}
      <div className="fixed right-6 bottom-[calc(env(safe-area-inset-bottom)+180px)] sm:bottom-28 z-40 text-right pointer-events-none select-none">
        <RevealText
          text="11:00 — 25.10.2025"
          className="text-white/95 text-sm md:text-base font-semibold tracking-wide drop-shadow"
        />
        <RevealText
          text="FPT University Can Tho Campus"
          className="text-white/80 text-xs md:text-sm mt-1 drop-shadow"
          delay={0.02}
        />
      </div>

      {/* Ticker chữ chạy */}
      <div className="fixed inset-0 flex items-center -rotate-2 select-none z-0">
        <div className="relative">
          <div className="bg-white/0 animate-horizontal-scroll flex items-center gap-8 w-max px-8">
            <h1 className="shrink-0 text-white text-10xl font-black ">Huynh Khac Huy</h1>
            <h2 className="shrink-0 text-white text-8xl italic font-light">Graduation</h2>
            <h2 className="shrink-0 text-white text-12xl font-bold">Ceremony</h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">11:00</h2>
            <h2 className="shrink-0 text-white text-9xl font-medium">25.10.2025</h2>
            <h2 className="shrink-0 text-white text-9xl font-extralight italic">FPT University</h2>
            <h2 className="shrink-0 text-white text-13xl font-bold">Software Engineering</h2>
            <h2 className="shrink-0 text-transparent text-13xl font-bold outline-text italic">Creative</h2>
          </div>

          <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-8 px-8 w-max">
            <h1 className="shrink-0 text-white text-10xl font-black ">Huynh Khac Huy</h1>
            <h2 className="shrink-0 text-white text-8xl italic font-light">Graduation</h2>
            <h2 className="shrink-0 text-white text-12xl font-bold">Ceremony</h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">11:00</h2>
            <h2 className="shrink-0 text-white text-9xl font-medium">25.10.2025</h2>
            <h2 className="shrink-0 text-white text-9xl font-extralight italic">FPT University</h2>
            <h2 className="shrink-0 text-white text-13xl font-bold">Software Engineering</h2>
            <h2 className="shrink-0 text-transparent text-13xl font-bold outline-text italic">Creative</h2>
          </div>
        </div>
      </div>
    </>
  );
};
