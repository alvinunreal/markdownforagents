<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const stageRef = ref(null);
let animationFrameId = null;

onMounted(() => {
  const stage = stageRef.value;
  if (!stage) return;

  const glyphs = " .:-=+*#%@";
  let cols, rows;

  const handleResize = () => {
    cols = Math.ceil(window.innerWidth / 5) + 20;
    rows = Math.ceil(window.innerHeight / 10) + 20;
  };

  handleResize();
  window.addEventListener('resize', handleResize);

  function frame(time) {
    const t = time * 0.0003;
    const out = [];
    const k = glyphs.length / 2;

    for (let y = 0; y < rows; y++) {
      let rowString = "";
      const Y = (y / rows) * 2 - 1;

      for (let x = 0; x < cols; x++) {
        const X = (x / cols) * 2 - 1;
        const l = Math.hypot(X, Y);
        let a = Math.atan2(Y, X);
        let ch = " ";

        if (l < 1.5) {
          a += t * 0.5;
          const wave =
            Math.sin(l * 6 - t * 1.5) +
            Math.cos(a * 4 + t) * 0.5 +
            Math.sin(X * 3 + Y * 2 + t * 0.8) * 0.5;
          let char_idx = Math.floor((wave + 2) * (glyphs.length / 4));
          char_idx = Math.max(0, Math.min(glyphs.length - 1, char_idx));
          if (Math.random() > 0.98) char_idx = (char_idx + 2) % glyphs.length;
          ch = glyphs[char_idx];
        }

        rowString += ch;
      }
      out.push(rowString);
    }

    stage.innerHTML = out.map(r => `<div>${r}</div>`).join('');
    animationFrameId = requestAnimationFrame(frame);
  }

  animationFrameId = requestAnimationFrame(frame);

  onUnmounted(() => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
  });
});
</script>

<template>
  <div class="contents">
    <!-- ASCII shimmer layer -->
    <div
      ref="stageRef"
      class="fixed inset-0 z-0 ascii-bg w-screen h-screen select-none pointer-events-none whitespace-pre overflow-hidden"
    ></div>

    <!-- Ambient glow layers -->
    <div class="fixed inset-0 z-[1] pointer-events-none opacity-40">
      <div class="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-300/20 blur-[130px] rounded-full animate-pulse" style="animation-duration: 8s"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-200/30 blur-[150px] rounded-full" style="animation: pulse 12s infinite alternate-reverse"></div>
      <div class="absolute top-1/4 left-1/3 w-[40%] h-[40%] bg-violet-200/20 blur-[180px] rounded-full" style="animation-duration: 15s"></div>
    </div>

    <!-- Vignette -->
    <div class="fixed inset-0 z-[2] pointer-events-none" style="background: radial-gradient(ellipse at center, transparent 40%, #f7f7f4 100%)"></div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

.ascii-bg {
  font-family: 'VT323', monospace;
  font-size: 13px;
  line-height: 12px;
  opacity: 0.3;
  background: linear-gradient(135deg,
    #6366f1 0%,
    #8b5cf6 25%,
    #3b82f6 50%,
    #6366f1 75%,
    #8b5cf6 100%
  );
  background-size: 400% 400%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 20s ease infinite;
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
