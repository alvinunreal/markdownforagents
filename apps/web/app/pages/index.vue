<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';

useSeoMeta({
  title: 'Convert any URL to agent-ready markdown',
  description: 'Give it a URL, get back clean markdown with YAML frontmatter, interactable detection, and structured metadata. One request. No SDK. No auth.',
  ogTitle: 'MarkdownForAgents',
  ogDescription: 'Convert any URL to clean, structured markdown optimized for AI agents. YAML frontmatter, interactable detection, PageMap JSON. One request.',
  ogType: 'website',
  ogUrl: 'https://markdownforagents.com',
  ogImage: 'https://markdownforagents.com/og.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'MarkdownForAgents — Convert any URL to agent-ready markdown',
  twitterCard: 'summary_large_image',
  twitterTitle: 'MarkdownForAgents',
  twitterDescription: 'Convert any URL to clean, structured markdown for AI agents. One request. No SDK.',
  twitterImage: 'https://markdownforagents.com/og.png',
});

const stageRef = ref(null);
let animationFrameId = null;
const config = useRuntimeConfig();
const url = ref('');
const isProcessing = ref(false);
const resultMarkdown = ref('');
const resultMetadata = ref(null);
const conversionError = ref(null);
const copyStatus = ref('copy'); // 'copy' | 'copied'

const handleConvert = async () => {
  let targetUrl = url.value.trim();
  if (!targetUrl || isProcessing.value) return;
  
  // Normalize URL for display/fetching if protocol is missing
  if (!targetUrl.includes('://')) {
    targetUrl = `https://${targetUrl}`;
    url.value = targetUrl;
  }

  isProcessing.value = true;
  resultMarkdown.value = '';
  resultMetadata.value = null;
  conversionError.value = null;

  // Scroll to results
  setTimeout(() => {
    const resultsEl = document.getElementById('results');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);

  try {
    const apiBase = config.public.apiBase || 'https://markdownforagents.com';
    
    // In production, we hit the same domain, but in dev we hit the specified apiBase
    const fetchUrl = window.location.hostname === 'localhost' 
      ? `${apiBase}/map?url=${encodeURIComponent(targetUrl)}`
      : `/map?url=${encodeURIComponent(targetUrl)}`;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Conversion failed (${response.status})`);
    }
    
    const data = await response.json();
    resultMarkdown.value = data.content;
    resultMetadata.value = {
      title: data.title,
      pageType: data.page_type,
      stats: data.stats,
      url: data.url
    };
  } catch (err) {
    console.error(err);
    conversionError.value = err.message;
  } finally {
    isProcessing.value = false;
  }
};

const copyToClipboard = () => {
  if (!resultMarkdown.value) return;
  navigator.clipboard.writeText(resultMarkdown.value);
  copyStatus.value = 'copied';
  setTimeout(() => {
    copyStatus.value = 'copy';
  }, 2000);
};


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

const processAscii = (str) => {
  const lines = str.split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const minIndent = lines.reduce((min, line) => {
    if (line.length === 0) return min;
    const match = line.match(/^(\s*)/);
    const indent = match ? match[0].length : 0;
    return Math.min(min, indent);
  }, Infinity);
  return lines.map(line => line.slice(minIndent)).join('\n');
};

const activeVersion = ref(0);

const logoNW = processAscii(String.raw`
                                  $$\             $$\                                   
                                  $$ |            $$ |                                  
$$$$$$\$$$$\   $$$$$$\   $$$$$$\  $$ |  $$\  $$$$$$$ | $$$$$$\  $$\  $$\  $$\ $$$$$$$\  
$$  _$$  _$$\  \____$$\ $$  __$$\ $$ | $$  |$$  __$$ |$$  __$$\ $$ | $$ | $$ |$$  __$$\ 
$$ / $$ / $$ | $$$$$$$ |$$ |  \__|$$$$$$  / $$ /  $$ |$$ /  $$ |$$ | $$ | $$ |$$ |  $$ |
$$ | $$ | $$ |$$  __$$ |$$ |      $$  _$$<  $$ |  $$ |$$ |  $$ |$$ | $$ | $$ |$$ |  $$ |
$$ | $$ | $$ |\$$$$$$$ |$$ |      $$ | \$$\ \$$$$$$$ |\$$$$$$  |\$$$$$\$$$$  |$$ |  $$ |
\__| \__| \__| \_______|\__|      \__|  \__| \_______| \______/  \_____\____/ \__|  \__|
`);

const logoNE = processAscii(String.raw`
                                   /$$             /$$                                  
                                  | $$            | $$                                  
 /$$$$$$/$$$$   /$$$$$$   /$$$$$$ | $$   /$$  /$$$$$$$  /$$$$$$  /$$  /$$  /$$ /$$$$$$$ 
| $$_  $$_  $$ |____  $$ /$$__  $$| $$  /$$/ /$$__  $$ /$$__  $$| $$ | $$ | $$| $$__  $$
| $$ \ $$ \ $$  /$$$$$$$| $$  \__/| $$$$$$/ | $$  | $$| $$  \ $$| $$ | $$ | $$| $$  \ $$
| $$ | $$ | $$ /$$__  $$| $$      | $$_  $$ | $$  | $$| $$  | $$| $$ | $$ | $$| $$  | $$
| $$ | $$ | $$|  $$$$$$$| $$      | $$ \  $$|  $$$$$$$|  $$$$$$/|  $$$$$/$$$$/| $$  | $$
|__/ |__/ |__/ \_______/|__/      |__/  \__/ \_______/ \______/  \_____/\___/ |__/  |__/
`);

const logoSE = processAscii(String.raw`
                                   __              __                                   
                                  |  \            |  \                                  
 ______ ____    ______    ______  | $$   __   ____| $$  ______   __   __   __  _______  
|      \    \  |      \  /      \ | $$  /  \ /      $$ /      \ |  \ |  \ |  \|       \ 
| $$$$$$\$$$$\  \$$$$$$\|  $$$$$$\| $$_/  $$|  $$$$$$$|  $$$$$$\| $$ | $$ | $$| $$$$$$$\
| $$ | $$ | $$ /      $$| $$   \$$| $$   $$ | $$  | $$| $$  | $$| $$ | $$ | $$| $$  | $$
| $$ | $$ | $$|  $$$$$$$| $$      | $$$$$$\ | $$__| $$| $$__/ $$| $$_/ $$_/ $$| $$  | $$
| $$ | $$ | $$ \$$    $$| $$      | $$  \$$\ \$$    $$ \$$    $$ \$$   $$   $$| $$  | $$
 \$$  \$$  \$$  \$$$$$$$ \$$       \$$   \$$  \$$$$$$$  \$$$$$$   \$$$$$\$$$$  \$$   \$$
`);

const logoSW = processAscii(String.raw`
                                   __              __                                   
                                  /  |            /  |                                  
 _____  ____    ______    ______  $$ |   __   ____$$ |  ______   __   __   __  _______  
/     \/    \  /      \  /      \ $$ |  /  | /    $$ | /      \ /  | /  | /  |/       \ 
$$$$$$ $$$$  | $$$$$$  |/$$$$$$  |$$ |_/$$/ /$$$$$$$ |/$$$$$$  |$$ | $$ | $$ |$$$$$$$  |
$$ | $$ | $$ | /    $$ |$$ |  $$/ $$   $$<  $$ |  $$ |$$ |  $$ |$$ | $$ | $$ |$$ |  $$ |
$$ | $$ | $$ |/$$$$$$$ |$$ |      $$$$$$  \ $$ \__$$ |$$ \__$$ |$$ \_$$ \_$$ |$$ |  $$ |
$$ | $$ | $$ |$$    $$ |$$ |      $$ | $$  |$$    $$ |$$    $$/ $$   $$   $$/ $$ |  $$ |
$$/  $$/  $$/  $$$$$$$/ $$/       $$/   $$/  $$$$$$$/  $$$$$$/   $$$$$/$$$$/  $$/   $$/ 
`);

const allVersions = [logoNW, logoNE, logoSE, logoSW];
const activeLogo = computed(() => allVersions[activeVersion.value]);

const handleMouseMove = (e) => {
  const { clientX, clientY } = e;
  const { innerWidth, innerHeight } = window;
  const isRight = clientX > innerWidth / 2;
  const isBottom = clientY > innerHeight / 2;
  if (!isRight && !isBottom) activeVersion.value = 0;
  if (isRight && !isBottom) activeVersion.value = 1;
  if (isRight && isBottom) activeVersion.value = 2;
  if (!isRight && isBottom) activeVersion.value = 3;
};

onMounted(() => { window.addEventListener('mousemove', handleMouseMove); });
onUnmounted(() => { window.removeEventListener('mousemove', handleMouseMove); });

const forAgentsLetters = "for agents".split("");

// Docs data
const headers = [
  { name: 'X-Token-Count',         example: '42',             desc: 'Estimated token count of the response body' },
  { name: 'X-Page-Type',           example: 'article',        desc: 'Detected page category (article, product, search, listing, unknown)' },
  { name: 'X-Conversion-Strategy', example: 'ai-tomarkdown',  desc: 'Which conversion tier was used' },
  { name: 'X-Source-Format',       example: 'text/html',      desc: 'Original content-type of the upstream response' },
  { name: 'X-Generation-Ms',       example: '3.2',            desc: 'Enrichment processing time in milliseconds' },
];

const formats = [
  { ext: '.html', label: 'Web pages' },
  { ext: '.pdf',  label: 'PDF documents' },
  { ext: '.docx', label: 'Word documents' },
  { ext: '.xlsx', label: 'Excel spreadsheets' },
  { ext: '.pptx', label: 'PowerPoint files' },
  { ext: '.csv',  label: 'CSV data' },
  { ext: '.txt',  label: 'Plain text (passthrough)' },
  { ext: '.md',   label: 'Markdown (passthrough)' },
];

const errors = [
  { code: '400', desc: 'Missing url parameter' },
  { code: '403', desc: 'SSRF blocked — private IP, localhost, or unsafe scheme' },
  { code: '413', desc: 'Upstream response exceeds 2 MB' },
  { code: '415', desc: 'Unsupported content type (e.g. video/mp4)' },
  { code: '429', desc: 'Target site returned 429 (Too Many Requests)' },
  { code: '502', desc: 'Upstream returned an error' },
];

const constraints = [
  { value: '10s',     label: 'Fetch timeout' },
  { value: '2 MB',    label: 'Max response size' },
  { value: 'No auth', label: 'Required' },
];
</script>

<template>
  <div class="relative min-h-screen bg-[#f7f7f4] text-gray-800 font-mono selection:bg-slate-200 selection:text-slate-900">

    <!-- ASCII Background -->
    <div
      ref="stageRef"
      class="fixed inset-0 z-0 ascii-bg w-screen h-screen select-none pointer-events-none whitespace-pre overflow-hidden"
    ></div>

    <!-- Ambient Glow Layers -->
    <div class="fixed inset-0 z-[1] pointer-events-none opacity-40">
      <div class="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-300/20 blur-[130px] rounded-full animate-pulse" style="animation-duration: 8s"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-200/30 blur-[150px] rounded-full" style="animation: pulse 12s infinite alternate-reverse"></div>
      <div class="absolute top-1/4 left-1/3 w-[40%] h-[40%] bg-violet-200/20 blur-[180px] rounded-full" style="animation-duration: 15s"></div>
    </div>

    <!-- Vignette -->
    <div class="fixed inset-0 z-[2] pointer-events-none" style="background: radial-gradient(ellipse at center, transparent 40%, #f7f7f4 100%)"></div>

    <!-- Content -->
    <main class="relative z-10 w-full flex flex-col items-center px-6 pt-16 pb-32">

      <!-- ── Hero ── -->
      <header class="max-w-3xl w-full text-center">

        <div class="relative group select-none cursor-default py-6">
          <!-- ASCII Logo -->
          <!-- ASCII Logo -->
          <div class="flex justify-center relative h-[85px] min-[375px]:h-[105px] min-[430px]:h-[125px] sm:h-[160px] md:h-[210px] lg:h-[240px] items-center overflow-x-auto shrink-0">
            <pre :key="activeVersion"
              class="block font-bold text-[0.28rem] min-[375px]:text-[0.35rem] min-[430px]:text-[0.42rem] sm:text-[0.55rem] md:text-[0.72rem] lg:text-[0.85rem] leading-[1.2] text-gray-900 lg:text-transparent lg:bg-clip-text lg:bg-gradient-to-b lg:from-gray-900 lg:to-gray-600 whitespace-pre font-mono transition-none cursor-default mx-auto text-left origin-center">{{ activeLogo }}</pre>
          </div>

          <!-- "for agents" badge -->
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-3 px-5 py-1.5 rounded-full bg-white/40 backdrop-blur-md border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.03)] selection:bg-indigo-100">
              <svg class="w-3.5 h-3.5 text-indigo-400/80" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
              <div class="flex">
                <span v-for="(char, i) in forAgentsLetters" :key="i"
                  class="text-[10px] md:text-[12px] font-bold tracking-[0.6em] text-gray-800 select-none lowercase">
                  {{ char === ' ' ? '&nbsp;' : char }}
                </span>
              </div>
              <svg class="w-2.5 h-2.5 text-violet-400/80" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- URL Input -->
        <div class="mt-4 bg-[#f7f7f4]/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            v-model="url"
            type="text"
            placeholder="https://example.com/article..."
            class="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-300 font-mono text-sm py-2.5 px-4 rounded-xl"
            @keyup.enter="handleConvert"
          />
          <button 
            class="bg-gray-900 hover:bg-gray-700 text-[#f7f7f4] px-6 py-2.5 text-xs uppercase tracking-widest transition-all rounded-xl font-mono flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isProcessing"
            @click="handleConvert"
          >
            <span v-if="isProcessing" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ isProcessing ? 'Working...' : 'Convert' }}
          </button>
        </div>

      </header>

      <!-- ── Results Section ── -->
      <section v-if="resultMarkdown || isProcessing || conversionError" id="results" class="max-w-3xl w-full mt-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div class="glass-card overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-white/40 bg-white/10">
            <div class="flex items-center gap-2">
              <div v-if="conversionError" class="w-1.5 h-1.5 rounded-full bg-red-400"></div>
              <div v-else-if="isProcessing" class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <div v-else class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span class="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                {{ conversionError ? 'Conversion Error' : (isProcessing ? 'Converting...' : 'Conversion Result') }}
              </span>
            </div>
            <div v-if="!isProcessing && resultMarkdown" class="flex items-center gap-3">
              <button 
                @click="copyToClipboard"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 transition-all hover:scale-105 active:scale-95 text-[#f7f7f4] text-[10px] uppercase tracking-widest font-bold"
              >
                <Icon :name="copyStatus === 'copy' ? 'heroicons:clipboard' : 'heroicons:check'" class="w-3.5 h-3.5" />
                {{ copyStatus === 'copy' ? 'Copy Markdown' : 'Copied!' }}
              </button>
            </div>
          </div>
          
          <div class="p-0 relative min-h-[300px]">
            <div v-if="isProcessing && !conversionError" class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/5 backdrop-blur-[2px] z-20">
              <div class="flex gap-1.5">
                <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
              <span class="text-[10px] uppercase tracking-[0.25em] text-indigo-400 font-bold">Loading...</span>
            </div>

            <!-- Error State -->
            <div v-if="conversionError" class="p-16 flex flex-col items-center justify-center text-center gap-6 bg-white/40 backdrop-blur-sm">
              <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100 shadow-sm">
                <Icon name="heroicons:exclamation-triangle" class="w-8 h-8" />
              </div>
              <div class="space-y-2">
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-widest">Conversion Failed</h3>
                <p class="text-[11px] text-red-500/80 max-w-md leading-relaxed font-bold px-4">{{ conversionError }}</p>
              </div>
              <button 
                @click="handleConvert" 
                class="px-6 py-2 rounded-xl bg-gray-900 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-gray-800 transition-all active:scale-95"
              >
                Try Another URL
              </button>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-[220px_1fr] divide-x divide-gray-100/50">
              <!-- Metadata Sidebar -->
              <div class="p-6 bg-gray-50/40 space-y-6">
                <div v-if="resultMetadata">
                  <div class="sec-label mb-3">Analysis</div>
                  <div class="space-y-4">
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Page Type</span>
                      <span class="text-[11px] text-gray-700 font-bold px-2 py-0.5 bg-white/60 border border-white/80 rounded w-fit">{{ resultMetadata.pageType }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Tokens</span>
                      <span class="text-[11px] text-indigo-500 font-bold tabular-nums">{{ resultMetadata.stats.tokenCount.toLocaleString() }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Strategy</span>
                      <span class="text-[10px] text-gray-500 bg-gray-100/50 px-2 py-0.5 rounded border border-gray-200/30 w-fit">{{ resultMetadata.stats.conversionStrategy }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Performance</span>
                      <span class="text-[10px] text-gray-500 font-bold tabular-nums">{{ resultMetadata.stats.generationMs }}ms</span>
                    </div>
                  </div>
                </div>
                <div v-else class="space-y-5 animate-pulse">
                  <div class="h-2.5 w-16 bg-gray-200 rounded"></div>
                  <div class="space-y-3">
                    <div class="h-4 w-full bg-gray-100 rounded"></div>
                    <div class="h-4 w-5/6 bg-gray-100 rounded"></div>
                    <div class="h-4 w-2/3 bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>

              <!-- Markdown Content -->
              <div class="p-0 overflow-hidden bg-white/30 backdrop-blur-sm">
                <div v-if="resultMarkdown" class="p-6 max-h-[700px] overflow-y-auto custom-scrollbar-v2">
                  <pre class="font-mono text-[11px] leading-[1.6] text-gray-700 whitespace-pre-wrap selection:bg-indigo-100">{{ resultMarkdown }}</pre>
                </div>
                <div v-else class="p-8 space-y-6 animate-pulse opacity-40">
                  <div class="h-6 w-1/4 bg-gray-200 rounded"></div>
                  <div class="space-y-3">
                    <div class="h-4 w-full bg-gray-100 rounded"></div>
                    <div class="h-4 w-full bg-gray-100 rounded"></div>
                    <div class="h-4 w-full bg-gray-100 rounded"></div>
                    <div class="h-4 w-4/5 bg-gray-100 rounded"></div>
                    <div class="h-4 w-full bg-gray-100 rounded"></div>
                    <div class="h-4 w-3/4 bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── API Reference ── -->
      <div class="max-w-3xl w-full mt-12 space-y-4">

        <!-- Section divider label -->
        <div class="flex items-center gap-3 mb-2">
          <span class="text-[10px] uppercase tracking-widest text-gray-500">v0.1.0</span>
          <span class="w-1 h-1 rounded-full bg-gray-400"></span>
          <span class="text-[10px] uppercase tracking-widest text-gray-500">API Reference</span>
        </div>

        <!-- Endpoints -->
        <section class="glass-card p-6">
          <div class="sec-label">Endpoints</div>

          <div class="mt-5 space-y-7">

            <!-- GET /r -->
            <div>
              <div class="flex items-baseline gap-3 mb-2">
                <span class="method-badge">GET</span>
                <code class="text-sm text-gray-800">/r?url=<span class="text-indigo-500">{url}</span></code>
              </div>
              <p class="text-xs text-gray-500 leading-relaxed mb-3">
                Returns clean <strong class="text-gray-700 font-semibold">Markdown</strong> with YAML frontmatter — title, type, token count — so agents parse metadata and content from a single response.
              </p>

              <!-- bash block -->
              <div class="code-block">
                <div class="code-label">bash</div>
                <pre class="code-pre"><span class="sh-prompt">$</span> <span class="sh-cmd">curl</span> <span class="sh-str">"https://markdownforagents.com/r?url=example.com"</span></pre>
              </div>

              <!-- markdown response -->
              <div class="code-block mt-2">
                <div class="code-label">response · text/markdown</div>
                <pre class="code-pre"><span class="hl-dim">---</span>
<span class="hl-key">url:</span> <span class="hl-val">https://example.com</span>
<span class="hl-key">title:</span> <span class="hl-str">"Example Domain"</span>
<span class="hl-key">type:</span> <span class="hl-val">unknown</span>
<span class="hl-key">tokens:</span> <span class="hl-num">42</span>
<span class="hl-dim">---</span>

<span class="hl-heading"># Example Domain</span>

This domain is for use in illustrative examples...

<span class="hl-dim">## Actions</span>

[1] link: Learn more (click)</pre>
              </div>
            </div>

            <div class="border-t border-gray-100"></div>

            <!-- GET /map -->
            <div>
              <div class="flex items-baseline gap-3 mb-2">
                <span class="method-badge">GET</span>
                <code class="text-sm text-gray-800">/map?url=<span class="text-indigo-500">{url}</span></code>
              </div>
              <p class="text-xs text-gray-500 leading-relaxed mb-3">
                Returns a structured <strong class="text-gray-700 font-semibold">PageMap JSON</strong> — interactables (buttons, forms, CTAs), metadata, images, stats. Useful when your agent needs to know what it <em>can do</em>, not just read.
              </p>

              <div class="code-block">
                <div class="code-label">bash</div>
                <pre class="code-pre"><span class="sh-prompt">$</span> <span class="sh-cmd">curl</span> <span class="sh-str">"https://markdownforagents.com/map?url=example.com"</span></pre>
              </div>

              <div class="code-block mt-2">
                <div class="code-label">response · application/json</div>
                <pre class="code-pre"><span class="hl-dim">{</span>
  <span class="hl-key">"url":</span>          <span class="hl-str">"https://example.com"</span>,
  <span class="hl-key">"title":</span>        <span class="hl-str">"Example Domain"</span>,
  <span class="hl-key">"page_type":</span>    <span class="hl-str">"unknown"</span>,
  <span class="hl-key">"interactables":</span> [
    <span class="hl-dim">{</span> <span class="hl-key">"ref":</span> <span class="hl-num">1</span>, <span class="hl-key">"role":</span> <span class="hl-str">"link"</span>, <span class="hl-key">"name":</span> <span class="hl-str">"Learn more"</span>, <span class="hl-key">"affordance":</span> <span class="hl-str">"click"</span> <span class="hl-dim">}</span>
  ],
  <span class="hl-key">"stats":</span> <span class="hl-dim">{</span> <span class="hl-key">"tokenCount":</span> <span class="hl-num">42</span>, <span class="hl-key">"conversionStrategy":</span> <span class="hl-str">"ai-tomarkdown"</span> <span class="hl-dim">}</span>
<span class="hl-dim">}</span></pre>
              </div>
            </div>

          </div>
        </section>

        <!-- Response Headers -->
        <section class="glass-card p-6">
          <div class="sec-label">Response Headers</div>
          <p class="text-xs text-gray-400 mt-2 mb-5">Both endpoints return these diagnostic headers.</p>
          <!-- Desktop table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left text-[9px] uppercase tracking-widest text-gray-300 pb-2 pr-6 whitespace-nowrap font-normal">Header</th>
                  <th class="text-left text-[9px] uppercase tracking-widest text-gray-300 pb-2 pr-6 font-normal">Value</th>
                  <th class="text-left text-[9px] uppercase tracking-widest text-gray-300 pb-2 font-normal">Description</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100/60">
                <tr v-for="h in headers" :key="h.name">
                  <td class="py-2.5 pr-6 align-top whitespace-nowrap">
                    <code class="text-gray-700 text-[11px]">{{ h.name }}</code>
                  </td>
                  <td class="py-2.5 pr-6 align-top">
                    <code class="text-indigo-400 text-[11px]">{{ h.example }}</code>
                  </td>
                  <td class="py-2.5 text-gray-400 text-[11px] leading-relaxed">{{ h.desc }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Mobile card list -->
          <ul class="sm:hidden space-y-4">
            <li v-for="h in headers" :key="h.name" class="border-t border-gray-100 pt-3">
              <div class="flex items-center gap-2 mb-1">
                <code class="text-[11px] text-gray-700 break-all">{{ h.name }}</code>
                <code class="text-[10px] text-indigo-400 shrink-0">{{ h.example }}</code>
              </div>
              <p class="text-[11px] text-gray-400 leading-relaxed">{{ h.desc }}</p>
            </li>
          </ul>
        </section>

        <!-- Formats + Errors side by side -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <section class="glass-card p-6">
            <div class="sec-label">Supported Formats</div>
            <p class="text-xs text-gray-400 mt-2 mb-4">Any URL pointing to these content types.</p>
            <ul class="space-y-2">
              <li v-for="fmt in formats" :key="fmt.ext" class="flex items-center gap-3">
                <code class="text-[10px] text-indigo-400/70 w-12 shrink-0">{{ fmt.ext }}</code>
                <span class="text-[11px] text-gray-500">{{ fmt.label }}</span>
              </li>
            </ul>
          </section>

          <section class="glass-card p-6">
            <div class="sec-label">Error Codes</div>
            <p class="text-xs text-gray-400 mt-2 mb-4">Standard HTTP status codes.</p>
            <ul class="space-y-2.5">
              <li v-for="e in errors" :key="e.code" class="flex items-start gap-3">
                <code class="text-[10px] text-indigo-400 w-8 shrink-0 mt-0.5">{{ e.code }}</code>
                <span class="text-[11px] text-gray-500 leading-relaxed">{{ e.desc }}</span>
              </li>
            </ul>
          </section>

        </div>

        <!-- Constraints -->
        <section class="glass-card px-6 py-5">
          <div class="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div v-for="c in constraints" :key="c.label" class="flex flex-col gap-0.5">
              <span class="text-sm font-bold text-gray-800">{{ c.value }}</span>
              <span class="text-[9px] uppercase tracking-widest text-gray-400">{{ c.label }}</span>
            </div>
            <div class="ml-auto text-[10px] text-gray-300 uppercase tracking-widest hidden sm:block">
              SSRF protection · private IPs blocked
            </div>
          </div>
        </section>

      </div>

    </main>

    <!-- Footer -->
    <footer class="relative z-10 pb-10 text-center text-[10px] text-gray-400 uppercase tracking-widest font-mono">
      MarkdownForAgents &copy; 2026
    </footer>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

/* ── ASCII background ── */
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
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ── Glass card ── */
.glass-card {
  background: rgba(247, 247, 244, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.03);
  border-radius: 1rem;
}

#results {
  position: relative;
}

#results::before {
  content: "";
  position: absolute;
  inset: -1px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  border-radius: 1.1rem;
  z-index: -1;
  filter: blur(8px);
}

/* ── Section label ── */
.sec-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #9ca3af;
  font-family: monospace;
}

/* ── Method badge ── */
.method-badge {
  font-size: 9px;
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: rgba(99, 102, 241, 0.07);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.18);
  border-radius: 4px;
  padding: 2px 7px;
}

/* ── Code blocks ── */
.code-block {
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  overflow: hidden;
}

.code-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #d1d5db;
  padding: 7px 14px 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-family: monospace;
}

.code-pre {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11.5px;
  line-height: 1.7;
  color: #6b7280;
  padding: 12px 16px;
  margin: 0;
  overflow-x: auto;
  white-space: pre;
}

/* ── Bash syntax highlighting ── */
.sh-prompt { color: #d1d5db; user-select: none; }
.sh-cmd    { color: #6366f1; font-weight: 600; }
.sh-flag   { color: #8b5cf6; }
.sh-str    { color: #374151; }

/* ── YAML / JSON highlighting ── */
.hl-key     { color: #4b5563; }
.hl-str     { color: #374151; }
.hl-num     { color: #6366f1; }
.hl-val     { color: #6b7280; }
.hl-dim     { color: #9ca3af; }
.hl-heading { color: #111827; font-weight: 700; }
/* ── Custom Scrollbar ── */
.custom-scrollbar-v2::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar-v2::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar-v2::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
.custom-scrollbar-v2::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.1);
}

</style>
