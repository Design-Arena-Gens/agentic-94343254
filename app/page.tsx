import { ImageProcessor } from "../components/ImageProcessor";

const featureHighlights = [
  {
    title: "Lightning-fast compression",
    description: "Optimize massive photos down to email-ready sizes with realtime previews and per-format quality controls.",
  },
  {
    title: "Precise crop & resize",
    description: "Frame the perfect shot, lock custom aspect ratios, and export to exact pixel dimensions without external editors.",
  },
  {
    title: "Convert to any format",
    description: "Switch between JPEG, PNG, WebP, or even flatten into a crisp PDF—all from your browser with zero uploads.",
  },
];

const workflowSteps = [
  {
    step: 1,
    title: "Drop your high-res image",
    description: "We decode large camera files locally—no uploads, no waiting, just instant rendering.",
  },
  {
    step: 2,
    title: "Tune compression & size",
    description: "Dial in pixel-perfect dimensions, set quality levels, and crop with visual feedback.",
  },
  {
    step: 3,
    title: "Export & share",
    description: "Download clean, optimized assets in seconds. Perfect for social media, print, or client delivery.",
  },
];

export default function Page() {
  return (
    <main className="pb-20">
      <section className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pt-24 text-center">
        <span className="inline-flex items-center rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
          JPEG Image Compressor
        </span>
        <h1 className="text-balance text-4xl font-bold leading-tight text-slate-50 sm:text-5xl">
          Compress, resize, crop, and convert photos instantly—right inside your browser
        </h1>
        <p className="max-w-2xl text-pretty text-slate-300">
          Speed through massive photo libraries with a studio-grade workflow built for photographers, designers, and busy creatives. No uploads or waiting rooms—just pixel-perfect control.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2">
            ⚡ Offline-first processing
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2">
            🗜️ Smart compression
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2">
            🎯 Exact pixels every time
          </span>
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-5xl gap-6 px-6 md:grid-cols-3">
        {featureHighlights.map((feature) => (
          <article
            key={feature.title}
            className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 text-left shadow-inner shadow-sky-500/10 backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-sky-200">{feature.title}</h3>
            <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-20 max-w-5xl px-6">
        <ImageProcessor />
      </section>

      <section className="mx-auto mt-20 max-w-5xl rounded-3xl border border-slate-800 bg-slate-950/60 px-6 py-12 backdrop-blur">
        <h2 className="text-center text-3xl font-semibold text-slate-100">Built for high-volume workflows</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-400">
          Whether you are prepping product shots, assembling case studies, or shipping assets to clients, the JPEG Image Compressor keeps everything lightweight and sharable without compromising detail.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {workflowSteps.map((step) => (
            <article
              key={step.step}
              className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/10 text-base font-semibold text-sky-300">
                {step.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-100">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
