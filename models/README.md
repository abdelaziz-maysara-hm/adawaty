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

## Why the lighter "p" (portable) variant

The full `u2net.onnx` is ~176 MB; `u2netp.onnx` is ~4.6 MB. Given this
site's own philosophy of fast, lightweight tools (and that a 176 MB
first-load download would be a genuinely bad experience for most
visitors), the lite variant was chosen as the default -- it trades a
little edge-detail precision (fine hair/fur strands) for a dramatically
smaller download.
