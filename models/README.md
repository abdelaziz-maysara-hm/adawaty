# Third-party ML models

## u2netp.onnx

- **What**: U^2-Net-p ("portable"), a lightweight salient-object-detection
  model used for client-side background removal (the `background-remover`
  tool). Runs entirely in the browser via ONNX Runtime Web -- no server,
  no upload, matching every other tool on this site.
- **Original model**: U^2-Net, Xuebin Qin et al., *Pattern Recognition* 2020
  (2020 Pattern Recognition Best Paper Award). Upstream repo:
  https://github.com/xuebinqin/U-2-Net
- **License**: Apache License 2.0 (see the upstream repo's own `LICENSE`
  file). Permissive, commercial use allowed, no source-disclosure
  obligation -- confirmed directly from the upstream license file before
  using this model, not assumed from marketing copy.
- **Downloaded from**: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
  (a GitHub Release from `danielgatis/rembg`, itself MIT-licensed, which
  redistributes the original weights unmodified -- confirmed no
  relicensing occurred).
- **SHA256**: `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`
  -- verify with `sha256sum models/u2netp.onnx` if this file is ever
  re-downloaded or updated.
- **Verified before use**: `onnx.checker.check_model()` confirmed a
  structurally valid ONNX graph (input `[1,3,320,320]`, mask output
  `[1,1,320,320]`); a real inference run on a synthetic test image (a
  red circle "subject" on a blue background) produced mask value `1.0`
  at the subject's center and `0.0` at a background corner -- confirming
  the model genuinely distinguishes foreground from background, not
  just that the file loads.
- **Deliberately NOT used**: `RMBG-1.4`/`RMBG-2.0` (BRIA AI) and
  `@imgly/background-removal` (AGPL-3.0) -- both looked like reasonable
  first choices from general search results, but were ruled out after
  checking their actual license terms directly: BRIA's models require a
  paid commercial license (this site carries ads, which counts as
  commercial use), and AGPL-3.0 carries network-use source-disclosure
  obligations. u2netp/Apache-2.0 has neither restriction.

## u2net_human_seg.onnx

- **What**: U^2-Net, human-segmentation-specialized checkpoint, trained on
  the Supervisely Person Dataset for the same core U^2-Net architecture as
  `u2netp.onnx` above. Used as the "People" option in `background-remover`
  and `replace-background` (alongside the default "General" option), added
  after real user feedback: the general `u2netp` model struggled to fully
  separate a person from a visually busy, multi-colored background (a
  painted wall mural).
- **License**: Apache License 2.0 -- same upstream repo
  (https://github.com/xuebinqin/U-2-Net), same license terms as `u2netp.onnx`,
  confirmed the same way (directly from the upstream `LICENSE` file, not
  assumed).
- **Downloaded from**: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx
  (the same GitHub Release, from the same MIT-licensed `danielgatis/rembg`
  redistribution, as `u2netp.onnx`).
- **SHA256**: `01eb6a29a5c4d8edb30b56adad9bb3a2a0535338e480724a213e0acfd2d1c73c`.
- **Verified before use**: `onnx.checker.check_model()` confirmed a
  structurally valid ONNX graph with the exact same input/output shapes as
  `u2netp.onnx` (`[1,3,320,320]` in, `[1,1,320,320]` mask out) -- same
  architecture, different trained weights. A real inference run on a
  synthetic test image (a skin-tone "person" shape centered over two
  *different*-colored background regions, deliberately mimicking the
  multi-colored-mural scenario from the real bug report) produced a mask
  value of `0.87` at the person shape's center and `0.0` at *both*
  differently-colored background corners -- confirming the model
  genuinely distinguishes the subject from a visually varied background,
  not just a single background color.
- **NOT vendored same-origin, unlike u2netp.onnx**: at ~176 MB, this file
  is far too large to commit to this git repository (GitHub rejects files
  over 100 MB outright) or to deploy as a Cloudflare Workers static asset
  (25 MB per-file limit -- see the `.assetsignore`/`workerd` deployment
  notes elsewhere in this repo's history). Loaded from the GitHub Release
  URL above at runtime instead, via `rembg-web`'s `u2net_custom` session
  type (which accepts an arbitrary `modelPath`) -- the same "public,
  non-personal model weights fetched from a CDN once and cached
  client-side, same as loading any CDN-hosted JS library" reasoning
  already used for `text-summarizer`'s much larger Qwen2.5 model. The
  actual image being processed still never leaves the browser; only the
  model weights themselves are fetched externally.

## Why u2netp is the default ("General") option

The full `u2net.onnx` is ~176 MB (same order of size as `u2net_human_seg.onnx`
above); `u2netp.onnx` is ~4.6 MB. Given this site's own philosophy of fast,
lightweight tools (and that a 176 MB first-load download would be a
genuinely bad experience for most visitors), the lite variant was chosen
as the default, general-purpose option -- it trades a little edge-detail
precision (fine hair/fur strands) for a dramatically smaller download.
"People" mode (`u2net_human_seg.onnx`) is offered as an explicit,
user-chosen alternative specifically for photos of people, where its
larger download is worth the added accuracy.

